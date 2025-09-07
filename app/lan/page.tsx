'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../../components/Footer';
import { QRCodeModal } from '../../components/QRCodeModal';
import { useLanTransfer } from '../../hooks/useLanTransfer';

type ViewMode = 'home' | 'connected';

// 简洁的SVG图标
const WifiIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <circle cx="12" cy="20" r="1"/>
    </svg>
);

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22,2 15,22 11,13 2,9 22,2"/>
    </svg>
);

const FileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    </svg>
);

const UploadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);

const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20,6 9,17 4,12"/>
    </svg>
);

const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
    </svg>
);

const DeviceIcon = ({ type }: { type?: string }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {type === 'mobile' ? (
            <>
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
            </>
        ) : type === 'tablet' ? (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" ry="2"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </>
        ) : (
            <>
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <line x1="2" y1="20" x2="22" y2="20"/>
            </>
        )}
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);

export default function LanPage() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('home');
    const [roomCode, setRoomCode] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [textToSend, setTextToSend] = useState('');
    const [copied, setCopied] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    const {
        isConnected,
        room,
        currentDevice,
        connectionInfo,
        transfers,
        createRoom,
        joinRoom,
        leaveRoom,
        sendText,
        sendFile,
        canTransfer,
        downloadFile,
        cleanupDownloadUrl
    } = useLanTransfer();

    useEffect(() => {
        setMounted(true);
        setDeviceName(`设备-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
        
        // 从URL参数中读取房间码
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoomCode = urlParams.get('room');
        if (urlRoomCode && urlRoomCode.length === 6) {
            setRoomCode(urlRoomCode.toUpperCase());
        }
    }, []);

    useEffect(() => {
        if (room) {
            setViewMode('connected');
        } else {
            setViewMode('home');
            // 清除URL参数中的房间码
            const url = new URL(window.location.href);
            if (url.searchParams.has('room')) {
                url.searchParams.delete('room');
                window.history.replaceState(null, '', url.toString());
            }
        }
    }, [room]);

    const dark = resolvedTheme === 'dark';
    const themeClasses = {
        bg: 'bg-white dark:bg-black',
        textPrimary: 'text-black dark:text-white',
        textSecondary: 'text-neutral-500 dark:text-neutral-400',
        textMuted: 'text-neutral-400 dark:text-neutral-500',
        btnPrimary: 'bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700',
        btnSecondary: 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
        border: 'border-neutral-200 dark:border-zinc-700',
        inputBg: 'bg-white dark:bg-zinc-900',
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-500 dark:text-red-400',
    };

    const handleCreateRoom = useCallback(async () => {
        const newRoomId = await createRoom();
        if (newRoomId) {
            setRoomCode(newRoomId);
            // 更新URL参数
            const url = new URL(window.location.href);
            url.searchParams.set('room', newRoomId);
            window.history.replaceState(null, '', url.toString());
            await joinRoom(newRoomId, deviceName);
        }
    }, [createRoom, joinRoom, deviceName]);

    const handleJoinRoom = useCallback(async () => {
        if (roomCode.trim()) {
            const upperRoomCode = roomCode.trim().toUpperCase();
            // 更新URL参数
            const url = new URL(window.location.href);
            url.searchParams.set('room', upperRoomCode);
            window.history.replaceState(null, '', url.toString());
            await joinRoom(upperRoomCode, deviceName);
        }
    }, [joinRoom, roomCode, deviceName]);

    const handleSendText = useCallback(async () => {
        if (textToSend.trim()) {
            await sendText(textToSend.trim());
            setTextToSend('');
        }
    }, [sendText, textToSend]);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && canTransfer) {
            for (const file of Array.from(files)) {
                await sendFile(file);
            }
        }
        event.target.value = '';
    }, [sendFile, canTransfer]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        setDragOver(true);
    }, [handleDrag]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
        }
    }, [handleDrag]);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        handleDrag(e);
        setDragOver(false);
        
        if (!canTransfer) return;

        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            await sendFile(file);
        }
    }, [handleDrag, sendFile, canTransfer]);

    const copyRoomLink = useCallback(async () => {
        if (room?.id) {
            try {
                const roomUrl = `${window.location.origin}/lan?room=${room.id}`;
                await navigator.clipboard.writeText(roomUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error('Failed to copy:', error);
            }
        }
    }, [room?.id]);

    if (!mounted) {
        return null;
    }

    return (
        <div className={`flex flex-col min-h-screen ${themeClasses.bg} transition-colors duration-300`}>
            {/* Header */}
            <header className="px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link href="/">
                        <Image 
                            src={dark ? '/assets/clipzy-white.png' : '/assets/clipzy.png'} 
                            width={80} 
                            height={40} 
                            alt="Clipzy Logo" 
                            className="cursor-pointer" 
                            priority
                        />
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`${themeClasses.textSecondary} text-sm`}>局域网快传</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                        Beta
                    </span>
                    {room && (
                        <button
                            onClick={leaveRoom}
                            className={`p-2 rounded-md ${themeClasses.btnSecondary} transition-colors`}
                            title="离开房间"
                        >
                            <XIcon />
                        </button>
                    )}
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col px-8 pt-6 pb-12 max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {viewMode === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col flex-1"
                        >
                            <div className="mb-8 max-w-3xl">
                                <h1 className={`${themeClasses.textPrimary} text-4xl font-extralight mb-3 transition-colors duration-300`}>
                                    局域网快传
                                </h1>
                                <p className={`${themeClasses.textSecondary} text-base transition-colors duration-300`}>
                                    在同一网络下的设备之间安全传输文本和文件。数据直接在设备间传输，无需上传到云端。
                                </p>
                            </div>

                            <div className="flex-1 flex flex-col">
                                {/* 设备名称 */}
                                <div className="mb-6 max-w-md">
                                    <label className={`${themeClasses.textSecondary} text-sm mb-2 block transition-colors duration-300`}>
                                        设备名称
                                    </label>
                                    <input
                                        type="text"
                                        value={deviceName}
                                        onChange={(e) => setDeviceName(e.target.value)}
                                        className={`enhanced-input w-full px-4 py-3 border ${themeClasses.border} rounded-md ${themeClasses.inputBg} ${themeClasses.textPrimary} placeholder-neutral-400 focus:outline-none transition-colors duration-300`}
                                        placeholder="为此设备命名"
                                    />
                                </div>

                                {/* 房间码输入 */}
                                <div className="mb-6 max-w-md">
                                    <label className={`${themeClasses.textSecondary} text-sm mb-2 block transition-colors duration-300`}>
                                        房间码 (可选)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="输入房间码加入现有房间，留空则创建新房间"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        className={`enhanced-input w-full px-4 py-3 border ${themeClasses.border} rounded-md ${themeClasses.inputBg} ${themeClasses.textPrimary} placeholder-neutral-400 focus:outline-none transition-colors duration-300 font-mono tracking-wider`}
                                        maxLength={6}
                                    />
                                </div>

                                {/* 单一按钮 */}
                                <div>
                                    <button
                                        onClick={roomCode.trim() ? handleJoinRoom : handleCreateRoom}
                                        disabled={connectionInfo.status === 'connecting'}
                                        className={`enhanced-button px-6 py-2 ${themeClasses.btnPrimary} ${themeClasses.textPrimary} rounded-md transition-colors duration-300 disabled:opacity-50`}
                                    >
                                        {connectionInfo.status === 'connecting' ? (
                                            <div className="flex items-center">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                    className={`w-4 h-4 border-2 border-t-transparent rounded-full mr-2 ${themeClasses.border}`}
                                                />
                                                {roomCode.trim() ? '加入中...' : '创建中...'}
                                            </div>
                                        ) : (
                                            roomCode.trim() ? `加入房间 ${roomCode}` : '创建房间'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'connected' && room && (
                        <motion.div
                            key="connected"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col flex-1"
                        >
                            {/* 房间信息 */}
                            <div className="mb-8 max-w-3xl">
                                <h1 className={`${themeClasses.textPrimary} text-4xl font-extralight mb-2 transition-colors duration-300`}>
                                    房间 <span className="font-mono">{room.id}</span>
                                </h1>
                                <p className={`${themeClasses.textSecondary} text-base mb-6 transition-colors duration-300`}>
                                    {room.devices?.length || 0} 个设备已连接
                                    <button
                                        onClick={copyRoomLink}
                                        className={`ml-4 ${themeClasses.btnSecondary} transition-colors duration-300 text-base`}
                                    >
                                        {copied ? '已复制链接' : '复制链接'}
                                    </button>
                                    <button
                                        onClick={() => setIsQRModalOpen(true)}
                                        className={`ml-3 ${themeClasses.btnSecondary} transition-colors duration-300 text-base`}
                                    >
                                        扫码加入
                                    </button>
                                </p>

                                {/* 设备列表 */}
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {room.devices?.map((device) => (
                                        <div
                                            key={device.id}
                                            className={`inline-flex items-center gap-1 px-3 py-1 text-sm border ${themeClasses.border} rounded transition-colors duration-300 ${
                                                device.id === currentDevice?.id 
                                                    ? 'bg-neutral-50 dark:bg-zinc-800' 
                                                    : ''
                                            }`}
                                        >
                                            <DeviceIcon type={device.type} />
                                            <span className={`${themeClasses.textPrimary} transition-colors duration-300`}>
                                                {device.name}
                                                {device.id === currentDevice?.id && (
                                                    <span className={`ml-1 ${themeClasses.textSecondary}`}>(你)</span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col max-w-2xl">
                                {/* 文本发送 */}
                                <div className="mb-6">
                                    <label className={`${themeClasses.textSecondary} text-sm mb-2 block transition-colors duration-300`}>
                                        发送文本
                                    </label>
                                    <textarea
                                        value={textToSend}
                                        onChange={(e) => setTextToSend(e.target.value)}
                                        placeholder="输入要发送的文本..."
                                        className={`enhanced-input w-full px-4 py-3 border ${themeClasses.border} rounded-md ${themeClasses.inputBg} ${themeClasses.textPrimary} placeholder-neutral-400 resize-none focus:outline-none transition-colors duration-300 mb-3`}
                                        rows={4}
                                    />
                                    <button
                                        onClick={handleSendText}
                                        disabled={!textToSend.trim() || !canTransfer}
                                        className={`enhanced-button px-6 py-2 ${themeClasses.btnPrimary} ${themeClasses.textPrimary} rounded-md transition-colors duration-300 disabled:opacity-50`}
                                    >
                                        发送文本
                                    </button>
                                </div>

                                {/* 文件传输 */}
                                <div className="mb-8">
                                    <label className={`${themeClasses.textSecondary} text-sm mb-2 block transition-colors duration-300`}>
                                        发送文件
                                    </label>
                                    <div
                                        className={`enhanced-input border-2 border-dashed rounded-md p-8 text-center transition-all duration-300 ${
                                            dragOver 
                                                ? 'border-neutral-400 bg-neutral-50 dark:border-zinc-500 dark:bg-zinc-800' 
                                                : `${themeClasses.border} ${canTransfer ? 'hover:border-neutral-400 dark:hover:border-zinc-500 cursor-pointer' : 'opacity-50'}`
                                        }`}
                                        onDragEnter={handleDragEnter}
                                        onDragLeave={handleDragLeave}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => {
                                            if (canTransfer) {
                                                document.getElementById('file-input')?.click();
                                            }
                                        }}
                                    >
                                        <input
                                            id="file-input"
                                            type="file"
                                            multiple
                                            onChange={handleFileUpload}
                                            disabled={!canTransfer}
                                            className="hidden"
                                        />
                                        <div className={`w-8 h-8 ${themeClasses.textSecondary} mx-auto mb-3 flex items-center justify-center`}>
                                            <UploadIcon />
                                        </div>
                                        <p className={`${themeClasses.textPrimary} mb-1 transition-colors duration-300`}>
                                            {dragOver ? '松开以上传文件' : '拖拽文件到此处或点击选择'}
                                        </p>
                                        <p className={`${themeClasses.textSecondary} text-sm transition-colors duration-300`}>
                                            支持多个文件同时上传
                                        </p>
                                        {!canTransfer && (
                                            <div className={`${themeClasses.textSecondary} text-sm mt-2 transition-colors duration-300 flex items-center justify-center gap-2`}>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                                    className={`w-3 h-3 border border-t-transparent rounded-full ${themeClasses.border}`}
                                                />
                                                等待其他设备连接...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 传输历史 */}
                                {transfers.length > 0 && (
                                    <div>
                                        <label className={`${themeClasses.textSecondary} text-sm mb-3 block transition-colors duration-300`}>
                                            传输历史
                                        </label>
                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                            {transfers.map((transfer) => (
                                                <motion.div
                                                    key={transfer.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={`py-2 transition-colors duration-300`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            {transfer.type === 'text' ? (
                                                                <>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`${themeClasses.textSecondary} text-xs transition-colors duration-300`}>
                                                                            文本消息
                                                                        </span>
                                                                    </div>
                                                                    <p className={`${themeClasses.textPrimary} text-sm transition-colors duration-300 leading-relaxed`}
                                                                       style={{ 
                                                                           display: '-webkit-box',
                                                                           WebkitLineClamp: 2,
                                                                           WebkitBoxOrient: 'vertical',
                                                                           overflow: 'hidden'
                                                                       }}>
                                                                        {transfer.content || transfer.name}
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`${themeClasses.textSecondary} text-xs transition-colors duration-300`}>
                                                                            文件
                                                                        </span>
                                                                    </div>
                                                                    <p className={`${themeClasses.textPrimary} text-sm transition-colors duration-300 truncate`}>
                                                                        {transfer.name}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {transfer.status === 'transferring' && transfer.progress !== undefined ? (
                                                                <div className="flex items-center gap-1">
                                                                    <div className={`w-12 h-1 bg-neutral-200 dark:bg-zinc-700 rounded-full overflow-hidden`}>
                                                                        <div 
                                                                            className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                                                                            style={{ width: `${transfer.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`${themeClasses.textSecondary} text-xs transition-colors duration-300`}>
                                                                        {transfer.progress}%
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                             <>
                                                                 {/* 已完成的文件且有下载URL - 显示下载按钮 */}
                                                                 {transfer.status === 'completed' && transfer.type === 'file' && transfer.downloadUrl ? (
                                                                     <button
                                                                         onClick={() => downloadFile(transfer)}
                                                                         className={`${themeClasses.btnPrimary} p-1.5 rounded hover:bg-opacity-80 transition-colors duration-300`}
                                                                         title="下载文件"
                                                                     >
                                                                         <DownloadIcon />
                                                                     </button>
                                                                 ) : (
                                                                     /* 其他状态显示图标 */
                                                                     <div className={`transition-colors duration-300 ${
                                                                         transfer.status === 'completed' 
                                                                             ? themeClasses.success 
                                                                             : transfer.status === 'error' 
                                                                             ? themeClasses.error 
                                                                             : themeClasses.textSecondary
                                                                     }`}>
                                                                         {transfer.status === 'completed' ? (
                                                                             <CheckIcon />
                                                                         ) : transfer.status === 'error' ? (
                                                                             <XIcon />
                                                                         ) : (
                                                                             <ClockIcon />
                                                                         )}
                                                                     </div>
                                                                 )}
                                                             </>
                                                         )}
                                                     </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
            
            {/* QR Code Modal */}
            <QRCodeModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                url={room ? `${window.location.origin}/lan?room=${room.id}` : ''}
                themeClasses={themeClasses}
            />
        </div>
    );
}