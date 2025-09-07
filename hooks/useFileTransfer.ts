import { useState, useCallback, useRef } from 'react';

// 文件分块大小 (64KB)
const CHUNK_SIZE = 64 * 1024;

// 传输状态
export type FileTransferStatus = 'idle' | 'uploading' | 'downloading' | 'completed' | 'error' | 'cancelled';

// 文件传输项目
export interface FileTransferItem {
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number;
    status: FileTransferStatus;
    direction: 'send' | 'receive';
    fromDevice?: string;
    toDevice?: string;
    startTime: number;
    endTime?: number;
    speed?: number; // bytes per second
    error?: string;
}

// 文件分块信息
interface FileChunk {
    index: number;
    data: ArrayBuffer;
    size: number;
    hash?: string;
}

// 文件元数据
interface FileMetadata {
    id: string;
    name: string;
    size: number;
    type: string;
    totalChunks: number;
    chunkSize: number;
}

export function useFileTransfer() {
    const [transfers, setTransfers] = useState<FileTransferItem[]>([]);
    const [dragOver, setDragOver] = useState(false);
    
    // 存储文件传输相关的引用
    const transfersMapRef = useRef<Map<string, {
        file?: File;
        chunks: Map<number, FileChunk>;
        metadata?: FileMetadata;
        receivedChunks: number;
        peer?: any;
    }>>(new Map());

    const speedCalculationRef = useRef<Map<string, {
        startTime: number;
        bytesTransferred: number;
        lastUpdate: number;
    }>>(new Map());

    // 计算文件哈希（简单版本）
    const calculateChunkHash = useCallback(async (chunk: ArrayBuffer): Promise<string> => {
        const hashBuffer = await crypto.subtle.digest('SHA-256', chunk);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }, []);

    // 将文件分块
    const chunkFile = useCallback(async (file: File): Promise<FileChunk[]> => {
        const chunks: FileChunk[] = [];
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunkBlob = file.slice(start, end);
            const chunkBuffer = await chunkBlob.arrayBuffer();
            
            chunks.push({
                index: i,
                data: chunkBuffer,
                size: chunkBuffer.byteLength,
                hash: await calculateChunkHash(chunkBuffer)
            });
        }

        return chunks;
    }, [calculateChunkHash]);

    // 开始发送文件
    const sendFile = useCallback(async (
        file: File, 
        peer: any, 
        targetDevice: string
    ): Promise<string> => {
        const transferId = `send_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 创建传输项目
        const transferItem: FileTransferItem = {
            id: transferId,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: 'uploading',
            direction: 'send',
            toDevice: targetDevice,
            startTime: Date.now()
        };

        setTransfers(prev => [...prev, transferItem]);

        try {
            // 分块文件
            const chunks = await chunkFile(file);
            const metadata: FileMetadata = {
                id: transferId,
                name: file.name,
                size: file.size,
                type: file.type,
                totalChunks: chunks.length,
                chunkSize: CHUNK_SIZE
            };

            // 保存传输信息
            transfersMapRef.current.set(transferId, {
                file,
                chunks: new Map(chunks.map(chunk => [chunk.index, chunk])),
                metadata,
                receivedChunks: 0,
                peer
            });

            // 初始化速度计算
            speedCalculationRef.current.set(transferId, {
                startTime: Date.now(),
                bytesTransferred: 0,
                lastUpdate: Date.now()
            });

            // 发送文件元数据
            const metadataMessage = {
                type: 'file-metadata',
                transferId,
                metadata
            };

            if (peer && peer.connected) {
                peer.send(JSON.stringify(metadataMessage));
            }

            // 开始发送分块
            let sentChunks = 0;
            for (const chunk of chunks) {
                const chunkMessage = {
                    type: 'file-chunk',
                    transferId,
                    chunkIndex: chunk.index,
                    data: Array.from(new Uint8Array(chunk.data)),
                    hash: chunk.hash
                };

                if (peer && peer.connected) {
                    peer.send(JSON.stringify(chunkMessage));
                    sentChunks++;

                    // 更新进度
                    const progress = (sentChunks / chunks.length) * 100;
                    updateTransferProgress(transferId, progress);

                    // 限制发送速度，避免网络拥塞
                    if (sentChunks % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
            }

            // 发送完成信号
            const completeMessage = {
                type: 'file-complete',
                transferId
            };

            if (peer && peer.connected) {
                peer.send(JSON.stringify(completeMessage));
            }

            // 更新传输状态
            updateTransferStatus(transferId, 'completed');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTransferStatus(transferId, 'error', errorMessage);
        }

        return transferId;
    }, [chunkFile]);

    // 处理接收到的文件数据
    const handleReceivedData = useCallback(async (data: string, fromDevice: string) => {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'file-metadata':
                    await handleFileMetadata(message, fromDevice);
                    break;
                case 'file-chunk':
                    await handleFileChunk(message);
                    break;
                case 'file-complete':
                    await handleFileComplete(message);
                    break;
                default:
                    break;
            }
        } catch (error) {
        }
    }, []);

    // 处理文件元数据
    const handleFileMetadata = useCallback(async (
        message: { transferId: string; metadata: FileMetadata }, 
        fromDevice: string
    ) => {
        const { transferId, metadata } = message;

        // 创建接收传输项目
        const transferItem: FileTransferItem = {
            id: transferId,
            name: metadata.name,
            size: metadata.size,
            type: metadata.type,
            progress: 0,
            status: 'downloading',
            direction: 'receive',
            fromDevice,
            startTime: Date.now()
        };

        setTransfers(prev => [...prev, transferItem]);

        // 初始化接收数据结构
        transfersMapRef.current.set(transferId, {
            chunks: new Map(),
            metadata,
            receivedChunks: 0
        });

        speedCalculationRef.current.set(transferId, {
            startTime: Date.now(),
            bytesTransferred: 0,
            lastUpdate: Date.now()
        });

    }, []);

    // 处理文件分块
    const handleFileChunk = useCallback(async (message: {
        transferId: string;
        chunkIndex: number;
        data: number[];
        hash: string;
    }) => {
        const { transferId, chunkIndex, data, hash } = message;
        const transferData = transfersMapRef.current.get(transferId);

        if (!transferData || !transferData.metadata) return;

        // 转换数据
        const chunkData = new Uint8Array(data).buffer;
        
        // 验证哈希
        const calculatedHash = await calculateChunkHash(chunkData);
        if (calculatedHash !== hash) {
            return;
        }

        // 保存分块
        transferData.chunks.set(chunkIndex, {
            index: chunkIndex,
            data: chunkData,
            size: chunkData.byteLength,
            hash
        });

        transferData.receivedChunks++;

        // 更新进度
        const progress = (transferData.receivedChunks / transferData.metadata.totalChunks) * 100;
        updateTransferProgress(transferId, progress);

        // 更新速度
        updateTransferSpeed(transferId, chunkData.byteLength);

    }, [calculateChunkHash]);

    // 处理文件传输完成
    const handleFileComplete = useCallback(async (message: { transferId: string }) => {
        const { transferId } = message;
        const transferData = transfersMapRef.current.get(transferId);

        if (!transferData || !transferData.metadata) return;

        try {
            // 重组文件
            const chunks: FileChunk[] = [];
            for (let i = 0; i < transferData.metadata.totalChunks; i++) {
                const chunk = transferData.chunks.get(i);
                if (!chunk) {
                    throw new Error(`缺少分块 ${i}`);
                }
                chunks.push(chunk);
            }

            // 合并分块
            const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
            const mergedData = new Uint8Array(totalSize);
            let offset = 0;

            for (const chunk of chunks) {
                mergedData.set(new Uint8Array(chunk.data), offset);
                offset += chunk.size;
            }

            // 创建文件Blob
            const fileBlob = new Blob([mergedData], { type: transferData.metadata.type });
            
            // 自动下载文件
            const url = URL.createObjectURL(fileBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = transferData.metadata.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            updateTransferStatus(transferId, 'completed');

        } catch (error) {
            console.error('文件重组失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTransferStatus(transferId, 'error', errorMessage);
        }
    }, []);

    // 更新传输进度
    const updateTransferProgress = useCallback((transferId: string, progress: number) => {
        setTransfers(prev => prev.map(transfer => 
            transfer.id === transferId 
                ? { ...transfer, progress: Math.round(progress) }
                : transfer
        ));
    }, []);

    // 更新传输状态
    const updateTransferStatus = useCallback((
        transferId: string, 
        status: FileTransferStatus, 
        error?: string
    ) => {
        setTransfers(prev => prev.map(transfer => 
            transfer.id === transferId 
                ? { 
                    ...transfer, 
                    status, 
                    error,
                    endTime: status === 'completed' || status === 'error' ? Date.now() : undefined
                }
                : transfer
        ));
    }, []);

    // 更新传输速度
    const updateTransferSpeed = useCallback((transferId: string, bytesTransferred: number) => {
        const speedData = speedCalculationRef.current.get(transferId);
        if (!speedData) return;

        const now = Date.now();
        speedData.bytesTransferred += bytesTransferred;
        
        // 每秒更新一次速度
        if (now - speedData.lastUpdate >= 1000) {
            const timeElapsed = (now - speedData.startTime) / 1000; // 秒
            const speed = speedData.bytesTransferred / timeElapsed; // bytes/sec

            setTransfers(prev => prev.map(transfer => 
                transfer.id === transferId 
                    ? { ...transfer, speed }
                    : transfer
            ));

            speedData.lastUpdate = now;
        }
    }, []);

    // 取消传输
    const cancelTransfer = useCallback((transferId: string) => {
        transfersMapRef.current.delete(transferId);
        speedCalculationRef.current.delete(transferId);
        updateTransferStatus(transferId, 'cancelled');
    }, [updateTransferStatus]);

    // 清除已完成的传输
    const clearCompletedTransfers = useCallback(() => {
        setTransfers(prev => prev.filter(transfer => 
            !['completed', 'error', 'cancelled'].includes(transfer.status)
        ));
    }, []);

    // 拖拽处理
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, onFilesSelected: (files: File[]) => void) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, []);

    // 格式化传输速度
    const formatSpeed = useCallback((bytesPerSecond: number): string => {
        if (bytesPerSecond < 1024) {
            return `${bytesPerSecond.toFixed(0)} B/s`;
        } else if (bytesPerSecond < 1024 * 1024) {
            return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
        } else {
            return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
        }
    }, []);

    // 格式化文件大小
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        } else {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        }
    }, []);

    return {
        // 状态
        transfers,
        dragOver,
        
        // 方法
        sendFile,
        handleReceivedData,
        cancelTransfer,
        clearCompletedTransfers,
        
        // 拖拽处理
        handleDragOver,
        handleDragLeave,
        handleDrop,
        
        // 工具函数
        formatSpeed,
        formatFileSize
    };
}
