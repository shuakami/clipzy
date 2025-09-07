import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore
import Peer from 'simple-peer';

// 设备信息接口
export interface Device {
    id: string;
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    joinedAt: number;
    lastSeen: number;
}

// 房间信息接口
export interface Room {
    id: string;
    name: string;
    devices: Device[];
    createdAt: number;
    lastActivity: number;
}

// 传输状态
export type TransferStatus = 'idle' | 'connecting' | 'connected' | 'transferring' | 'completed' | 'error';

// 传输项目
export interface TransferItem {
    id: string;
    type: 'text' | 'file';
    name: string;
    size?: number;
    content?: string;
    file?: File;
    progress: number;
    status: TransferStatus;
    fromDevice: string;
    toDevice: string;
    timestamp: number;
    downloadUrl?: string;  // 用于手动下载的URL
    fileName?: string;     // 原始文件名
}

// 连接状态
export interface ConnectionInfo {
    status: TransferStatus;
    connectedDevices: string[];
    error?: string;
}

// 信令消息接口
interface SignalMessage {
    id: string;
    type: 'offer' | 'answer' | 'ice-candidate' | 'room-update';
    fromDevice: string;
    toDevice: string;
    data: any;
    timestamp: number;
}

export function useLanTransfer() {
    // 状态管理
    const [room, setRoom] = useState<Room | null>(null);
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
    const [peers, setPeers] = useState<Map<string, Peer.Instance>>(new Map());
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
        status: 'idle',
        connectedDevices: []
    });
    const [transfers, setTransfers] = useState<TransferItem[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Refs
    const peersRef = useRef<Map<string, Peer.Instance>>(new Map());
    const transfersRef = useRef<TransferItem[]>([]);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageIdRef = useRef<string>('0');
    const roomIdRef = useRef<string | null>(null);
    const deviceIdRef = useRef<string | null>(null);

    // 更新 refs
    useEffect(() => {
        peersRef.current = peers;
    }, [peers]);

    useEffect(() => {
        transfersRef.current = transfers;
    }, [transfers]);

    useEffect(() => {
        roomIdRef.current = room?.id || null;
    }, [room?.id]);

    useEffect(() => {
        deviceIdRef.current = currentDevice?.id || null;
    }, [currentDevice?.id]);

    // 连接状态监控器
    useEffect(() => {
        if (!room || !currentDevice) return;

        const statusInterval = setInterval(() => {
            const canTransfer = peers.size > 0 && connectionInfo.status === 'connected';
        }, 5000);

        return () => clearInterval(statusInterval);
    }, [room, currentDevice, peers, connectionInfo]);

    // 文件接收状态
    const [receivingFiles, setReceivingFiles] = useState<Map<string, {
        name: string;
        size: number;
        totalChunks: number;
        receivedChunks: Map<number, Uint8Array>;
        transferItem: TransferItem;
    }>>(new Map());
    
    // 使用 ref 来存储最新的 receivingFiles 状态
    const receivingFilesRef = useRef<Map<string, {
        name: string;
        size: number;
        totalChunks: number;
        receivedChunks: Map<number, Uint8Array>;
        transferItem: TransferItem;
    }>>(new Map());
    
    // 更新 receivingFiles ref
    useEffect(() => {
        receivingFilesRef.current = receivingFiles;
    }, [receivingFiles]);

    // 处理接收到的数据
    const handleIncomingData = useCallback((data: any, fromDevice: string) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'text') {
                const transferItem: TransferItem = {
                    id: message.id || Math.random().toString(36).substring(2),
                    type: 'text',
                    name: '文本消息',
                    content: message.content,
                    progress: 100,
                    status: 'completed',
                    fromDevice,
                    toDevice: currentDevice?.id || '',
                    timestamp: Date.now()
                };
                
                setTransfers(prev => [...prev, transferItem]);
            }
            else if (message.type === 'file-start') {
                // 开始接收文件
                const transferItem: TransferItem = {
                    id: message.id,
                    type: 'file',
                    name: message.name,
                    size: message.size,
                    progress: 0,
                    status: 'transferring',
                    fromDevice,
                    toDevice: currentDevice?.id || '',
                    timestamp: Date.now()
                };

                setTransfers(prev => [...prev, transferItem]);
                
                setReceivingFiles(prev => {
                    const newMap = new Map(prev);
                    newMap.set(message.id, {
                        name: message.name,
                        size: message.size,
                        totalChunks: message.totalChunks,
                        receivedChunks: new Map(),
                        transferItem
                    });
                    return newMap;
                });
            }
            else if (message.type === 'file-chunk') {
                // 接收文件分块
                const fileInfo = receivingFilesRef.current.get(message.id);
                if (!fileInfo) {
                    return;
                }

                const chunkData = new Uint8Array(message.chunkData);
                
                // 创建新的receivedChunks Map来确保React能检测到状态变化
                const newReceivedChunks = new Map(fileInfo.receivedChunks);
                newReceivedChunks.set(message.chunkIndex, chunkData);

                const progress = Math.round((newReceivedChunks.size / fileInfo.totalChunks) * 100);
                
                // 更新receivingFiles状态
                setReceivingFiles(prev => {
                    const newMap = new Map(prev);
                    newMap.set(message.id, {
                        ...fileInfo,
                        receivedChunks: newReceivedChunks
                    });
                    return newMap;
                });
                
                // 更新传输进度
                setTransfers(prev => prev.map(t => 
                    t.id === message.id 
                        ? { ...t, progress }
                        : t
                ));

                // 检查是否接收完成
                if (message.isLast || newReceivedChunks.size === fileInfo.totalChunks) {
                    // 组装完整文件
                    const chunks: Uint8Array[] = [];
                    for (let i = 0; i < fileInfo.totalChunks; i++) {
                        const chunk = newReceivedChunks.get(i);
                        if (chunk) {
                            chunks.push(chunk);
                        }
                    }

                    // 组装完整文件
                    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                    const fullFile = new Uint8Array(totalLength);
                    let offset = 0;
                    
                    for (const chunk of chunks) {
                        fullFile.set(chunk, offset);
                        offset += chunk.length;
                    }

                    const blob = new Blob([fullFile]);
                    const downloadUrl = URL.createObjectURL(blob);

                    // 更新状态为已接收，包含下载URL
                    setTransfers(prev => prev.map(t => 
                        t.id === message.id 
                            ? { 
                                ...t, 
                                status: 'completed', 
                                progress: 100, 
                                downloadUrl,
                                fileName: fileInfo.name
                            }
                            : t
                    ));

                    // 清理接收状态
                    setReceivingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(message.id);
                        return newMap;
                    });
                }
            }
        } catch (error) {
        }
    }, [currentDevice?.id]);

    // 发送信令消息
    const sendSignalMessage = useCallback(async (
        type: 'offer' | 'answer' | 'ice-candidate',
        toDevice: string,
        data: any,
        roomId?: string,
        fromDeviceId?: string
    ) => {
        // 优先使用传入的参数，然后是 refs，最后是状态
        const actualRoomId = roomId || roomIdRef.current || room?.id;
        const actualDeviceId = fromDeviceId || deviceIdRef.current || currentDevice?.id;

        if (!actualRoomId || !actualDeviceId) {
            return;
        }

        const payload = {
            action: 'signal',
            roomId: actualRoomId,
            type,
            fromDevice: actualDeviceId,
            toDevice,
            data
        };

        try {
            const response = await fetch('/api/lan/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
        } catch (error) {
        }
    }, [room?.id, currentDevice?.id]);

    // 创建 WebRTC 连接
    const createPeerConnection = useCallback((deviceId: string, initiator: boolean, roomId?: string, fromDeviceId?: string) => {
        if (peersRef.current.has(deviceId)) {
            const existingPeer = peersRef.current.get(deviceId);
            console.log(`P2P连接已存在: ${deviceId}, destroyed: ${existingPeer?.destroyed}, connected: ${existingPeer?.connected}`);
            return existingPeer;
        }

        console.log(`创建新P2P连接: ${deviceId}, initiator: ${initiator}`);

        const peer = new Peer({
            initiator,
            trickle: false,
            config: {
                iceServers: [
                    // Google STUN 服务器
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    
                    // 其他公共 STUN 服务器
                    { urls: 'stun:stun.services.mozilla.com' },
                    { urls: 'stun:stunserver.org' },
                    
                    // 免费 TURN 服务器 (有限带宽)
                    { 
                        urls: 'turn:openrelay.metered.ca:80',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:443',
                        username: 'openrelayproject', 
                        credential: 'openrelayproject'
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    }
                ],
                iceCandidatePoolSize: 10,
                iceTransportPolicy: 'all'
            }
        });

        peer.on('signal', (data: any) => {
            console.log('发送信令:', data.type, '到设备:', deviceId);
            
            let signalType: 'offer' | 'answer' | 'ice-candidate';
            if (data.type === 'offer') {
                signalType = 'offer';
            } else if (data.type === 'answer') {
                signalType = 'answer';
            } else {
                // ice-candidate 或其他类型
                signalType = 'ice-candidate';
            }
            
            // 传递房间ID和设备ID参数避免竞态条件
            sendSignalMessage(signalType, deviceId, data, roomId, fromDeviceId);
        });

        peer.on('connect', () => {
            console.log(`✅ P2P连接已建立: ${deviceId}`);
            setConnectionInfo(prev => {
                const newConnectedDevices = [...prev.connectedDevices.filter(id => id !== deviceId), deviceId];
                console.log('更新连接设备列表:', newConnectedDevices);
                return {
                    ...prev,
                    connectedDevices: newConnectedDevices,
                    status: 'connected'
                };
            });
        });

        peer.on('data', (data: Buffer) => {
            console.log('收到P2P数据:', data.length, 'bytes from:', deviceId);
            handleIncomingData(data, deviceId);
        });

        peer.on('error', (error: Error) => {
            console.error(`❌ P2P连接错误 (${deviceId}):`, error);
            
            // 确定错误类型并提供相应的处理
            let errorMessage = '连接失败';
            let shouldRetry = false;
            
            if (error.message.includes('Connection failed')) {
                errorMessage = '网络连接失败，可能是防火墙或NAT问题';
                shouldRetry = true;
            } else if (error.message.includes('ICE connection failed')) {
                errorMessage = 'ICE连接失败，网络环境不支持P2P连接';
                shouldRetry = true;
            } else if (error.message.includes('Connection refused')) {
                errorMessage = '连接被拒绝，对方设备可能不可用';
                shouldRetry = false;
            } else if (error.message.includes('timeout')) {
                errorMessage = '连接超时，网络可能不稳定';
                shouldRetry = true;
            }
            
            // 更新连接状态显示错误信息
            setConnectionInfo(prev => ({
                ...prev,
                status: 'error',
                error: errorMessage,
                connectedDevices: prev.connectedDevices.filter(id => id !== deviceId)
            }));
            
            // 从peers列表中移除失败的连接
            setPeers(prev => {
                const newPeers = new Map(prev);
                newPeers.delete(deviceId);
                console.log('移除失败的P2P连接:', deviceId);
                return newPeers;
            });
            
            // 如果应该重试且重试次数未超限，则延迟重试
            if (shouldRetry) {
                const retryKey = `retry_${deviceId}`;
                const retryCount = (peer as any)[retryKey] || 0;
                
                if (retryCount < 2) { // 最多重试2次
                    console.log(`🔄 将在3秒后重试连接到设备: ${deviceId} (第${retryCount + 1}次重试)`);
                    setTimeout(() => {
                        try {
                            const currentDeviceId = deviceIdRef.current || currentDevice?.id;
                            const shouldBeInitiator = (currentDeviceId || '') < deviceId;
                            const newPeer = createPeerConnection(deviceId, shouldBeInitiator, roomId, fromDeviceId);
                            if (newPeer) {
                                (newPeer as any)[retryKey] = retryCount + 1;
                            }
                        } catch (retryError) {
                            console.error(`重试连接失败:`, retryError);
                        }
                    }, 3000);
                } else {
                    console.log(`❌ 设备 ${deviceId} 重试次数已达上限，停止重试`);
                }
            }
        });

        peer.on('close', () => {
            console.log(`🔌 P2P连接关闭: ${deviceId}`);
            setPeers(prev => {
                const newPeers = new Map(prev);
                newPeers.delete(deviceId);
                return newPeers;
            });
            setConnectionInfo(prev => {
                const newConnectedDevices = prev.connectedDevices.filter(id => id !== deviceId);
                console.log('更新连接设备列表 (移除):', newConnectedDevices);
                return {
                    ...prev,
                    connectedDevices: newConnectedDevices
                };
            });
        });

        // 添加连接超时机制
        const connectionTimeout = setTimeout(() => {
            if (!peer.connected && !peer.destroyed) {
                console.log(`⏰ P2P连接超时: ${deviceId}`);
                peer.destroy();
                
                setConnectionInfo(prev => ({
                    ...prev,
                    status: 'error',
                    error: '连接超时，请检查网络连接',
                    connectedDevices: prev.connectedDevices.filter(id => id !== deviceId)
                }));
            }
        }, 30000); // 30秒超时
        
        // 修改连接成功处理，添加超时清除
        peer.removeAllListeners('connect');
        peer.on('connect', () => {
            clearTimeout(connectionTimeout);
            console.log(`✅ P2P连接已建立: ${deviceId}`);
            setConnectionInfo(prev => {
                const newConnectedDevices = [...prev.connectedDevices.filter(id => id !== deviceId), deviceId];
                console.log('更新连接设备列表:', newConnectedDevices);
                return {
                    ...prev,
                    connectedDevices: newConnectedDevices,
                    status: 'connected',
                    error: undefined // 清除之前的错误
                };
            });
        });

        peersRef.current.set(deviceId, peer);
        setPeers(prev => new Map(prev).set(deviceId, peer));
        return peer;
    }, [sendSignalMessage, handleIncomingData]);

    // 处理信令消息
    const handleSignalMessage = useCallback(async (message: SignalMessage) => {
        const { type, fromDevice, data } = message;

        console.log('收到信令:', type, 'from:', fromDevice);

        if (type === 'offer' || type === 'answer') {
            console.log(`📡 收到 ${type} 信令，来自设备: ${fromDevice}`);
            let peer = peersRef.current.get(fromDevice);
            
            if (!peer) {
                console.log(`🔗 为设备 ${fromDevice} 创建新的P2P连接 (接收方)`);
                
                // 使用决定性策略避免冲突：设备ID较小的作为initiator
                const currentDeviceId = deviceIdRef.current || currentDevice?.id;
                const shouldBeInitiator = (currentDeviceId || '') < fromDevice;
                
                console.log(`连接策略: 当前设备(${currentDeviceId}) ${shouldBeInitiator ? '作为' : '不作为'} initiator 连接到 ${fromDevice}`);
                
                // 使用 refs 中的最新值
                peer = createPeerConnection(fromDevice, shouldBeInitiator, roomIdRef.current || undefined, currentDeviceId || undefined);
            }
            
            if (peer && !peer.destroyed) {
                console.log(`📨 处理 ${type} 信令数据:`, data.type, `连接状态:`, peer.connected);
                try {
                    // 检查连接状态，避免在错误状态下处理信令
                    if (type === 'answer' && peer.connected) {
                        console.log(`⚠️ 跳过 ${type} 信令：连接已建立`);
                        return;
                    }
                    
                    peer.signal(data);
                    console.log(`✅ ${type} 信令处理成功`);
                } catch (error) {
                    console.error(`❌ ${type} 信令处理失败:`, error);
                    
                    // 如果是状态错误，尝试重新创建连接
                    if (error instanceof Error && error.name === 'InvalidStateError') {
                        console.log(`🔄 尝试重新创建P2P连接: ${fromDevice}`);
                        peersRef.current.delete(fromDevice);
                        setPeers(prev => {
                            const newPeers = new Map(prev);
                            newPeers.delete(fromDevice);
                            return newPeers;
                        });
                        
                        // 重新创建连接，使用决定性策略
                        const currentDeviceId = deviceIdRef.current || currentDevice?.id;
                        const shouldBeInitiator = (currentDeviceId || '') < fromDevice;
                        setTimeout(() => {
                            createPeerConnection(fromDevice, shouldBeInitiator, roomIdRef.current || undefined, currentDeviceId || undefined);
                        }, 100); // 短暂延迟避免立即冲突
                    }
                }
            } else {
                console.log(`❌ 无法处理 ${type} 信令：peer不存在或已销毁`);
            }
        } else if (type === 'ice-candidate') {
            console.log(`🧊 收到 ICE candidate，来自设备: ${fromDevice}`);
            const peer = peersRef.current.get(fromDevice);
            if (peer && !peer.destroyed && !peer.connected) {
                try {
                    peer.signal(data);
                    console.log(`✅ ICE candidate 处理成功`);
                } catch (error) {
                    console.error(`❌ ICE candidate 处理失败:`, error);
                }
            } else {
                if (peer?.connected) {
                    console.log(`⚠️ 跳过 ICE candidate：连接已建立`);
                } else {
                    console.log(`❌ 无法处理 ICE candidate：peer不存在或已销毁`);
                }
            }
        } else if (type === 'room-update') {
            // 处理房间状态更新
            console.log('收到房间状态更新:', data);
            console.log('更新后的房间设备列表:', data.room?.devices?.map((d: any) => `${d.name}(${d.id})`));
            
            if (data.room) {
                setRoom(data.room);
                console.log('房间状态已更新，设备数量:', data.room.devices?.length);
                
                // 如果有新设备加入，为新设备创建P2P连接
                if (data.type === 'device-joined' && (currentDevice || deviceIdRef.current)) {
                    const currentDeviceId = currentDevice?.id || deviceIdRef.current;
                    for (const device of data.room.devices) {
                        if (device.id !== currentDeviceId && !peersRef.current.has(device.id)) {
                            console.log('为新设备创建P2P连接:', device.name, device.id);
                            
                            // 使用决定性策略避免冲突：设备ID较小的作为initiator
                            const shouldBeInitiator = (currentDeviceId || '') < device.id;
                            console.log(`连接策略: 当前设备(${currentDeviceId}) ${shouldBeInitiator ? '作为' : '不作为'} initiator 连接到 ${device.id}`);
                            
                            // 使用 refs 中的最新值
                            createPeerConnection(device.id, shouldBeInitiator, roomIdRef.current || undefined, currentDeviceId || undefined);
                        }
                    }
                }
            }
        }
    }, [createPeerConnection, currentDevice]);

    // 轮询消息 - 接受参数避免竞态条件
    const pollMessages = useCallback(async (roomId?: string, deviceId?: string) => {
        // 优先使用传入的参数，然后是 refs，最后是状态
        const actualRoomId = roomId || roomIdRef.current || room?.id;
        const actualDeviceId = deviceId || deviceIdRef.current || currentDevice?.id;
        
        if (!actualRoomId || !actualDeviceId) {
            console.log('轮询跳过: 房间或设备信息缺失', { 
                actualRoomId, 
                actualDeviceId,
                roomIdRef: roomIdRef.current,
                deviceIdRef: deviceIdRef.current,
                stateRoomId: room?.id,
                stateDeviceId: currentDevice?.id,
                paramRoomId: roomId,
                paramDeviceId: deviceId
            });
            return;
        }

        try {
            const url = `/api/lan/signal?action=poll&roomId=${actualRoomId}&deviceId=${actualDeviceId}&lastMessageId=${lastMessageIdRef.current}`;
            console.log('开始轮询:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`轮询失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const messages: SignalMessage[] = data.messages || [];

            console.log(`收到 ${messages.length} 条新消息`);

            // 处理新消息
            for (const message of messages) {
                console.log('处理信令消息:', message.type, 'from:', message.fromDevice, 'to:', message.toDevice);
                await handleSignalMessage(message);
                lastMessageIdRef.current = message.timestamp.toString();
            }

            setIsConnected(true);
            if (connectionInfo.status === 'connecting') {
                console.log('状态从连接中变为已连接');
                setConnectionInfo(prev => ({ ...prev, status: 'connected' }));
            }
        } catch (error) {
            console.error('轮询消息失败:', error);
            setIsConnected(false);
            setConnectionInfo(prev => ({ ...prev, status: 'error', error: '连接失败' }));
        }
    }, [room?.id, currentDevice?.id, connectionInfo.status, handleSignalMessage]);

    // 开始轮询 - 接受参数避免竞态条件
    const startPolling = useCallback((roomId?: string, deviceId?: string) => {
        if (pollingRef.current) {
            console.log('轮询已经在运行中');
            return;
        }

        console.log('🔄 开始轮询信令消息', { roomId, deviceId });
        pollingRef.current = setInterval(() => {
            pollMessages(roomId, deviceId);
        }, 2000); // 每2秒轮询一次

        // 立即执行一次
        pollMessages(roomId, deviceId);
    }, [pollMessages]);

    // 停止轮询
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            console.log('🛑 停止轮询信令消息');
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // 创建房间
    const createRoom = useCallback(async (): Promise<string | null> => {
        try {
            setConnectionInfo(prev => ({ ...prev, status: 'connecting' }));
            
            const response = await fetch('/api/lan/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-room' })
            });
            
            const data = await response.json();
            return data.roomId;
        } catch (error) {
            console.error('创建房间失败:', error);
            setConnectionInfo(prev => ({ ...prev, status: 'error', error: '创建房间失败' }));
            return null;
        }
    }, []);

    // 加入房间
    const joinRoom = useCallback(async (
        roomId: string, 
        deviceName: string, 
        deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    ) => {
        try {
            setConnectionInfo(prev => ({ ...prev, status: 'connecting' }));
            
            const response = await fetch('/api/lan/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'join-room',
                    roomId,
                    deviceName,
                    deviceType
                })
            });

            if (!response.ok) {
                throw new Error('加入房间失败');
            }

            const data = await response.json();
            console.log('加入房间成功，房间信息:', data.room);
            console.log('当前设备信息:', data.device);
            
            setRoom(data.room);
            setCurrentDevice(data.device);
            
            // 开始轮询 - 传递参数避免竞态条件
            startPolling(data.room.id, data.device.id);

            // 为现有设备创建连接
            if (data.room.devices.length > 1) {
                console.log(`房间中已有 ${data.room.devices.length} 个设备，为其他设备创建P2P连接`);
                for (const device of data.room.devices) {
                    if (device.id !== data.device.id) {
                        // 使用决定性策略避免冲突：设备ID较小的作为initiator
                        const shouldBeInitiator = data.device.id < device.id;
                        console.log(`为现有设备创建P2P连接: ${device.name} (${device.id}), 当前设备 ${shouldBeInitiator ? '作为' : '不作为'} initiator`);
                        
                        // 传递房间ID和设备ID避免竞态条件
                        createPeerConnection(device.id, shouldBeInitiator, data.room.id, data.device.id);
                    }
                }
            } else {
                console.log('房间中只有当前设备，等待其他设备加入');
            }

            console.log(`✅ 成功加入房间: ${roomId}`);
        } catch (error) {
            console.error('加入房间失败:', error);
            setConnectionInfo(prev => ({ 
                ...prev, 
                status: 'error', 
                error: error instanceof Error ? error.message : '加入房间失败' 
            }));
        }
    }, [startPolling, createPeerConnection]);

    // 发送文本
    const sendText = useCallback(async (text: string, targetDevices?: string[]) => {
        console.log('📤 尝试发送文本消息');
        console.log('当前设备:', currentDevice);
        console.log('P2P连接数量:', peersRef.current.size);
        console.log('连接状态:', connectionInfo.status);
        
        if (!currentDevice) {
            console.log('❌ 无当前设备，取消发送');
            return;
        }
        
        if (peersRef.current.size === 0) {
            console.log('❌ 无P2P连接，取消发送');
            return;
        }

        const transferId = Math.random().toString(36).substring(2);
        const transferItem: TransferItem = {
            id: transferId,
            type: 'text',
            name: '文本消息',
            content: text,
            progress: 0,
            status: 'transferring',
            fromDevice: currentDevice.id,
            toDevice: 'multiple',
            timestamp: Date.now()
        };

        setTransfers(prev => [...prev, transferItem]);

        const targets = targetDevices || Array.from(peersRef.current.keys());
        console.log('目标设备:', targets);
        
        const message = {
            type: 'text',
            id: transferId,
            content: text,
            timestamp: Date.now()
        };
        
        let successCount = 0;
        for (const deviceId of targets) {
            const peer = peersRef.current.get(deviceId);
            console.log(`检查设备 ${deviceId}:`, {
                exists: !!peer,
                connected: peer?.connected,
                destroyed: peer?.destroyed
            });
            
            if (peer && peer.connected) {
                try {
                    peer.send(JSON.stringify(message));
                    successCount++;
                    console.log(`✅ 成功向设备 ${deviceId} 发送消息`);
                } catch (error) {
                    console.error(`❌ 向设备 ${deviceId} 发送失败:`, error);
                }
            } else {
                console.log(`❌ 设备 ${deviceId} 未连接或不存在`);
            }
        }

        console.log(`发送完成，成功: ${successCount}/${targets.length}`);

        // 更新传输状态
        setTransfers(prev => prev.map(t => 
            t.id === transferId 
                ? { ...t, status: successCount > 0 ? 'completed' : 'error', progress: 100 }
                : t
        ));
    }, [currentDevice, connectionInfo.status]);

    // 等待数据通道缓冲区有足够空间
    const waitForBufferSpace = useCallback((peer: any, maxBufferedAmount = 8 * 1024 * 1024) => { // 8MB limit
        return new Promise<void>((resolve) => {
            // 检查 simple-peer 的内部通道
            const channel = peer._channel;
            if (!channel || channel.readyState !== 'open') {
                resolve();
                return;
            }
            
            const bufferedAmount = channel.bufferedAmount || 0;
            if (bufferedAmount <= maxBufferedAmount) {
                resolve();
                return;
            }
            
            const checkBuffer = () => {
                const currentBuffered = channel.bufferedAmount || 0;
                if (currentBuffered <= maxBufferedAmount) {
                    resolve();
                } else {
                    setTimeout(checkBuffer, 50); // 检查间隔50ms
                }
            };
            
            checkBuffer();
        });
    }, []);

    // 发送文件
    const sendFile = useCallback(async (file: File, targetDevices?: string[]) => {
        console.log('📤 开始发送文件:', file.name, `大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
        if (!currentDevice || peersRef.current.size === 0) {
            console.log('❌ 无法发送文件: 无设备连接');
            return;
        }

        const transferId = Math.random().toString(36).substring(2);
        const chunkSize = 32 * 1024; // 32KB chunks (减小以避免缓冲区溢出)
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        const transferItem: TransferItem = {
            id: transferId,
            type: 'file',
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'transferring',
            fromDevice: currentDevice.id,
            toDevice: 'multiple',
            timestamp: Date.now()
        };

        setTransfers(prev => [...prev, transferItem]);

        const targets = targetDevices || Array.from(peersRef.current.keys());
        console.log('文件发送目标:', targets);
        
        try {
            // 发送文件元数据
            const metadata = {
                type: 'file-start',
                id: transferId,
                name: file.name,
                size: file.size,
                mimeType: file.type,
                totalChunks,
                timestamp: Date.now()
            };
            
            // 向所有目标设备发送元数据
            for (const deviceId of targets) {
                const peer = peersRef.current.get(deviceId);
                if (peer && peer.connected) {
                    peer.send(JSON.stringify(metadata));
                }
            }

            // 分块发送文件
            let sentChunks = 0;
            const buffer = await file.arrayBuffer();
            
            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = buffer.slice(start, end);
                
                const chunkMessage = {
                    type: 'file-chunk',
                    id: transferId,
                    chunkIndex: i,
                    chunkData: Array.from(new Uint8Array(chunk)),
                    isLast: i === totalChunks - 1
                };
                
                // 向所有目标设备发送分块
                let chunkSentCount = 0;
                for (const deviceId of targets) {
                    const peer = peersRef.current.get(deviceId);
                    if (peer && peer.connected) {
                        try {
                            // 等待缓冲区有足够空间
                            await waitForBufferSpace(peer);
                            peer.send(JSON.stringify(chunkMessage));
                            chunkSentCount++;
                        } catch (error) {
                            console.error(`发送分块失败 (设备 ${deviceId}):`, error);
                        }
                    }
                }
                
                if (chunkSentCount > 0) {
                    sentChunks++;
                    const progress = Math.round((sentChunks / totalChunks) * 100);
                    
                    // 更新进度
                    setTransfers(prev => prev.map(t => 
                        t.id === transferId 
                            ? { ...t, progress }
                            : t
                    ));
                    
                    console.log(`文件发送进度: ${progress}% (${sentChunks}/${totalChunks})`);
                }
                
                // 避免阻塞UI和缓冲区溢出，每5个分块暂停一下
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            
            // 完成传输
            setTransfers(prev => prev.map(t => 
                t.id === transferId 
                    ? { ...t, status: 'completed', progress: 100 }
                    : t
            ));
            
            console.log(`✅ 文件发送完成: ${file.name}`);
        } catch (error) {
            console.error('❌ 文件发送失败:', error);
            setTransfers(prev => prev.map(t => 
                t.id === transferId 
                    ? { ...t, status: 'error' }
                    : t
            ));
        }
    }, [currentDevice, waitForBufferSpace]);

    // 离开房间
    const leaveRoom = useCallback(async () => {
        if (!room?.id || !currentDevice?.id) return;

        try {
            stopPolling();
            
            await fetch(`/api/lan/signal?roomId=${room.id}&deviceId=${currentDevice.id}`, {
                method: 'DELETE'
            });

            // 关闭所有P2P连接
            peersRef.current.forEach(peer => peer.destroy());
            setPeers(new Map());
            
            setRoom(null);
            setCurrentDevice(null);
            setTransfers([]);
            setConnectionInfo({ status: 'idle', connectedDevices: [] });
            setIsConnected(false);
            lastMessageIdRef.current = '0';
            roomIdRef.current = null;
            deviceIdRef.current = null;
        } catch (error) {
            console.error('离开房间失败:', error);
        }
    }, [room?.id, currentDevice?.id, stopPolling]);

    // 清理
    useEffect(() => {
        return () => {
            stopPolling();
            peersRef.current.forEach(peer => peer.destroy());
        };
    }, [stopPolling]);

    // 手动下载文件
    const downloadFile = useCallback((transfer: TransferItem) => {
        if (transfer.downloadUrl && transfer.fileName) {
            const a = document.createElement('a');
            a.href = transfer.downloadUrl;
            a.download = transfer.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }, []);

    // 清理下载URL（防止内存泄露）
    const cleanupDownloadUrl = useCallback((transferId: string) => {
        setTransfers(prev => prev.map(t => {
            if (t.id === transferId && t.downloadUrl) {
                URL.revokeObjectURL(t.downloadUrl);
                return { ...t, downloadUrl: undefined };
            }
            return t;
        }));
    }, []);

    return {
        // 状态
        isConnected,
        room,
        currentDevice,
        connectionInfo,
        transfers,
        connectedDevicesCount: peers.size,
        
        // 方法
        createRoom,
        joinRoom,
        leaveRoom,
        sendText,
        sendFile,
        downloadFile,
        cleanupDownloadUrl,
        
        // 计算属性
        canTransfer: peers.size > 0 && connectionInfo.status === 'connected',
        
        // 调试信息
        debugInfo: {
            peersSize: peers.size,
            connectionStatus: connectionInfo.status,
            connectedDevicesCount: connectionInfo.connectedDevices.length,
            peersConnected: Array.from(peers.entries()).map(([id, peer]) => ({
                id,
                connected: peer.connected,
                destroyed: peer.destroyed
            }))
        }
    };
}