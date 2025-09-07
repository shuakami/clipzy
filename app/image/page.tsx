'use client';

import React, { useCallback, useState, useEffect, useMemo, useRef, memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useImageUpload } from '../../hooks/useImageUpload';
import { AnnouncementBar } from '../../components/AnnouncementBar';
import { QRCodeModal } from '../../components/QRCodeModal';

// Zero-dependency SVG icons
const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
);

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17,8 12,3 7,8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
);

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

export default memo(function ImagePage() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const {
        isUploading,
        uploadProgress,
        imageUrl,
        error,
        uploadImage,
        copyUrl,
        urlCopied,
        reset
    } = useImageUpload();

    const [isDragOver, setIsDragOver] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 当获得新的图片URL时，初始化加载状态
    useEffect(() => {
        if (imageUrl) {
            setImageLoading(true);
        }
    }, [imageUrl]);

    const dark = resolvedTheme === 'dark';
    const themeClasses = {
        bg: 'bg-white dark:bg-black',
        textPrimary: 'text-black dark:text-white',
        textSecondary: 'text-neutral-500 dark:text-neutral-400',
        btnPrimary: 'bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700',
        btnSecondary: 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
        border: 'border-neutral-200 dark:border-zinc-700',
        inputBg: 'bg-white dark:bg-zinc-900',
        error: 'text-red-500 dark:text-red-400',
        success: 'text-green-600 dark:text-green-400',
    };

    const checkFirstTimeAndUpload = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        // 检查是否首次使用
        const hasAcceptedTerms = localStorage.getItem('uapi-terms-accepted') === 'true';
        
        if (!hasAcceptedTerms) {
            // 先预览图片
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreviewImage(result);
            };
            reader.readAsDataURL(file);
            
            // 显示确认模态框
            setShowConfirmModal(true);
        } else {
            // 直接上传
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreviewImage(result);
                uploadImage(result);
            };
            reader.readAsDataURL(file);
        }
    }, [uploadImage]);

    const handleFileSelect = checkFirstTimeAndUpload;

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    }, [handleFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    }, []);

    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    // 检查是否首次使用
                    const hasAcceptedTerms = localStorage.getItem('uapi-terms-accepted') === 'true';
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const result = e.target?.result as string;
                        setPreviewImage(result);
                        
                        if (!hasAcceptedTerms) {
                            setShowConfirmModal(true);
                        } else {
                            uploadImage(result);
                        }
                    };
                    reader.readAsDataURL(file);
                }
                break;
            }
        }
    }, [uploadImage]);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const handleReset = useCallback(() => {
        reset();
        setPreviewImage(null);
        setImageLoading(false);
        setPreviewLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [reset]);

    const handleConfirmTerms = useCallback(() => {
        localStorage.setItem('uapi-terms-accepted', 'true');
        setShowConfirmModal(false);
        
        // 如果有预览图片，开始上传
        if (previewImage) {
            uploadImage(previewImage);
        }
    }, [previewImage, uploadImage]);

    const handleCancelUpload = useCallback(() => {
        setShowConfirmModal(false);
        setPreviewImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Link href="/">
                        <Image 
                            src={dark ? '/assets/clipzy-white.png' : '/assets/clipzy.png'} 
                            width={80} 
                            height={40} 
                            alt="Clipzy - 在线安全图床 | 图片分享服务" 
                            className="cursor-pointer" 
                            priority
                        />
                    </Link>
                    <span className={`hidden md:flex items-center gap-2 ${themeClasses.textPrimary} font-medium`}>
                        <span>图床</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300">New</span>
                    </span>
                    <Link href="/lan" className={`hidden md:flex items-center gap-2 ${themeClasses.textSecondary} hover:text-opacity-80 transition-colors duration-300`}>
                        <span>局域网快传</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">Beta</span>
                    </Link>
                </div>
                <button onClick={() => setTheme(dark ? 'light' : 'dark')} className={`${themeClasses.btnSecondary} p-2 rounded-md transition-colors duration-300`}>
                    {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col px-8 pt-6 pb-12 max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {isUploading && (
                        <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className={`w-8 h-8 rounded-full border-3 border-t-transparent ${themeClasses.border} mb-4`} />
                            <span className={`${themeClasses.textPrimary} text-lg mb-2`}>上传中...</span>
                            <div className={`w-64 h-2 ${themeClasses.inputBg} rounded-full overflow-hidden border ${themeClasses.border}`}>
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full bg-green-500 rounded-full"
                                />
                            </div>
                            <span className={`${themeClasses.textSecondary} text-sm mt-2`}>{uploadProgress}%</span>
                        </motion.div>
                    )}

                    {!isUploading && imageUrl && (
                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 space-y-8">
                            <div>
                                <h2 className={`${themeClasses.textPrimary} text-4xl font-extralight mb-3`}>上传成功</h2>
                                <p className={`${themeClasses.textSecondary} text-base`}>图片已成功上传到图床，您可以使用下方链接分享或嵌入图片。</p>
                            </div>

                            {/* Preview */}
                            <div className="space-y-4">
                                <label className={`${themeClasses.textSecondary} text-sm font-medium block`}>图片预览</label>
                                <div className={`border ${themeClasses.border} rounded-md overflow-hidden p-4 ${themeClasses.inputBg}`}>
                                    <div className="flex justify-center relative">
                                        {/* 骨架屏 */}
                                        {imageLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full max-w-sm h-64 bg-neutral-200 dark:bg-zinc-700 rounded-md skeleton-shimmer relative overflow-hidden">
                                                    <div className="flex items-center justify-center w-full h-full relative z-10">
                                                        <svg className="w-12 h-12 text-neutral-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <img 
                                            src={imageUrl.startsWith('http') ? imageUrl : `https://uapis.cn${imageUrl}`} 
                                            alt="上传的图片" 
                                            className={`max-w-full max-h-96 object-contain rounded-md transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                            onLoad={() => setImageLoading(false)}
                                            onLoadStart={() => setImageLoading(true)}
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                img.style.display = 'none';
                                                setImageLoading(false);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image URL */}
                            <div className="space-y-2">
                                <label className={`${themeClasses.textSecondary} text-sm font-medium block`}>图片链接</label>
                                <div className={`flex flex-col md:flex-row border ${themeClasses.border} rounded-md overflow-hidden transition-colors duration-300`}>
                                    <input 
                                        readOnly 
                                        value={imageUrl.startsWith('http') ? imageUrl : `https://uapis.cn${imageUrl}`} 
                                        onClick={e => e.currentTarget.select()} 
                                        className={`enhanced-input w-full md:flex-1 px-4 py-3 focus:outline-none text-sm bg-transparent ${themeClasses.textPrimary} transition-colors duration-300`} 
                                    />
                                    <div className="flex">
                                        <button 
                                            onClick={() => setIsQRModalOpen(true)} 
                                            className={`enhanced-button flex-1 md:flex-initial px-4 py-3 ${themeClasses.btnSecondary} border-t md:border-t-0 md:border-l ${themeClasses.border} transition-colors duration-300`}
                                        >
                                            扫码
                                        </button>
                                        <button 
                                            onClick={() => copyUrl(imageUrl.startsWith('http') ? imageUrl : `https://uapis.cn${imageUrl}`)} 
                                            className={`enhanced-button flex items-center justify-center gap-2 flex-1 md:flex-initial px-4 py-3 ${urlCopied ? `${themeClasses.success} success-flash` : themeClasses.btnSecondary} border-l ${themeClasses.border} transition-colors duration-300`}
                                        >
                                            <CopyIcon />
                                            {urlCopied ? '已复制' : '复制'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleReset} className={`${themeClasses.btnPrimary} px-6 py-2 self-start mt-8 transition-colors duration-300`}>
                                上传新图片
                            </button>
                        </motion.div>
                    )}

                    {!isUploading && !imageUrl && (
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                            <div className="mb-8 max-w-3xl">
                                <h1 className={`${themeClasses.textPrimary} text-4xl font-extralight mb-3`}>图片上传</h1>
                                <p className={`${themeClasses.textSecondary} text-base`}>将图片上传到图床，获得永久访问链接。支持拖拽、粘贴和点击上传，完全免费使用。</p>
                                <p className={`text-xs ${themeClasses.textSecondary} opacity-60 mt-2`}>
                                    *图床服务由UapiPro与其相关机构合作提供
                                </p>
                            </div>

                            {/* Upload Zone */}
                            <div 
                                ref={dropZoneRef}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`
                                    enhanced-input flex-1 min-h-[300px] p-8 border-2 border-dashed rounded-lg
                                    ${isDragOver ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : themeClasses.border}
                                    ${themeClasses.inputBg} transition-all duration-300 cursor-pointer
                                    flex flex-col items-center justify-center text-center space-y-6
                                `}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />

                                {previewImage ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="relative">
                                            {/* 预览骨架屏 */}
                                            {previewLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                                    <div className="w-full max-w-sm h-64 bg-neutral-200 dark:bg-zinc-700 rounded-md skeleton-shimmer relative overflow-hidden">
                                                        <div className="flex items-center justify-center w-full h-full relative z-10">
                                                            <svg className="w-12 h-12 text-neutral-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <img 
                                                src={previewImage} 
                                                alt="预览" 
                                                className={`max-w-full max-h-64 object-contain rounded-md shadow-sm transition-opacity duration-300 ${previewLoading ? 'opacity-0' : 'opacity-100'}`}
                                                onLoad={() => setPreviewLoading(false)}
                                                onLoadStart={() => setPreviewLoading(true)}
                                                onError={() => setPreviewLoading(false)}
                                            />
                                        </div>
                                        <p className={`${themeClasses.textSecondary} text-sm`}>
                                            准备上传，点击确认或选择其他图片
                                        </p>
                                    </motion.div>
                                ) : (
                                    <>
                                        <motion.div
                                            animate={{ y: isDragOver ? -5 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <UploadIcon className={`w-16 h-16 ${isDragOver ? 'text-green-500' : themeClasses.textSecondary}`} />
                                        </motion.div>
                                        
                                        <div className="space-y-3">
                                            <h3 className={`${themeClasses.textPrimary} text-xl font-medium`}>
                                                {isDragOver ? '释放以上传图片' : '选择或拖拽图片到此处'}
                                            </h3>
                                            <p className={`${themeClasses.textSecondary} text-sm`}>
                                                支持 JPG、PNG、GIF、WebP 格式<br />
                                                也可以直接粘贴剪贴板中的图片 (Ctrl+V)
                                            </p>
                                        </div>

                                        <button 
                                            className={`enhanced-button px-6 py-3 ${themeClasses.btnPrimary} text-black dark:text-white rounded-md transition-colors duration-300 flex items-center gap-2`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            选择图片
                                        </button>
                                    </>
                                )}
                            </div>

                            {previewImage && !isUploading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 flex justify-end space-x-4"
                                >
                                    <button 
                                        onClick={handleReset}
                                        className={`enhanced-button px-6 py-2 ${themeClasses.btnSecondary} transition-colors duration-300`}
                                    >
                                        重新选择
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const hasAcceptedTerms = localStorage.getItem('uapi-terms-accepted') === 'true';
                                            if (!hasAcceptedTerms) {
                                                setShowConfirmModal(true);
                                            } else {
                                                uploadImage(previewImage);
                                            }
                                        }}
                                        className={`enhanced-button px-6 py-2 ${themeClasses.btnPrimary} text-black dark:text-white transition-colors duration-300 flex items-center gap-2`}
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                        确认上传
                                    </button>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className={`mt-4 p-3 rounded bg-red-50 dark:bg-red-900/20 ${themeClasses.error} transition-colors duration-300`}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Terms Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 ${dark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm flex items-center justify-center z-50 p-4`}
                        onClick={handleCancelUpload}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ 
                                duration: 0.4, 
                                ease: [0.4, 0, 0.2, 1],
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                            className={`
                                ${themeClasses.inputBg} rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto 
                                border ${themeClasses.border} 
                                shadow-2xl shadow-black/20 dark:shadow-black/40
                                backdrop-blur-xl
                            `}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className={`${themeClasses.textPrimary} text-xl font-semibold mb-6`}>
                                重要声明
                            </h2>
                            
                            <div className={`${themeClasses.textSecondary} text-sm space-y-4 mb-8`}>
                                <p>
                                    Clipzy和UapiPro都严禁上传包括反动、暴力、色情、违法、及侵权内容的文件。我们有义务配合有关部门将上传违规文件的用户信息保存，并保留因配合调查而冻结账号的权利。
                                </p>
                                
                                <p>
                                    国家秘密受法律保护。一切国家机关、武装力量、政党、社会团体、企事业单位和公民都有保守国家秘密的义务。任何危害国家秘密安全的行为，都必须受到法律追究。请严格遵守保密法律法规，严禁在互联网上存储、处理、传输、发布涉密信息。
                                </p>
                                
                                <p>
                                    服务由UapiPro与其相关机构合作提供，使用代表您同意了{' '}
                                    <a 
                                        href="https://uapis.cn/docs/getting-started/privacy-policy" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`${themeClasses.textPrimary} hover:opacity-80 transition-opacity duration-200 underline`}
                                    >
                                        隐私政策
                                    </a>
                                </p>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={handleCancelUpload}
                                    className={`enhanced-button px-6 py-2 ${themeClasses.btnSecondary} transition-colors duration-300`}
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleConfirmTerms}
                                    className={`enhanced-button px-6 py-2 ${themeClasses.btnPrimary} text-black dark:text-white transition-colors duration-300`}
                                >
                                    同意并继续
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <QRCodeModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                url={imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `https://uapis.cn${imageUrl}`) : ''}
                themeClasses={themeClasses}
            />

            <Footer />
        </div>
    );
});
