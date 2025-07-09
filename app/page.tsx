// app/page.tsx
'use client';

import React, { useCallback, useState, useEffect, useMemo, Suspense, useDeferredValue, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useSyntaxHighlighting, detectLanguage } from '../hooks/useSyntaxHighlighting';
import { QRCodeModal } from '../components/QRCodeModal';
import { useClipLogic, LoadingState, LOADING_MESSAGES } from '../hooks/useClipLogic';

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

const SyntaxHighlighter = dynamic(async () => {
  const { Light } = await import('react-syntax-highlighter');
  const js = (await import('react-syntax-highlighter/dist/esm/languages/hljs/javascript')).default;
  const json = (await import('react-syntax-highlighter/dist/esm/languages/hljs/json')).default;
  const xml = (await import('react-syntax-highlighter/dist/esm/languages/hljs/xml')).default;
  Light.registerLanguage('javascript', js);
  Light.registerLanguage('json', json);
  Light.registerLanguage('xml', xml);
  return Light;
}, { ssr: false });


const MarkdownRenderer = dynamic(
  () =>
    import('./_md').then(async ({ default: ReactMarkdown }) => {
      const { default: remarkGfm } = await import('remark-gfm');
      return memo(({ children, dark }: { children: string; dark: boolean }) => (
        <div className={`prose ${dark ? 'prose-invert' : ''} max-w-none p-4 text-sm`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
        </div>
      ));
    }),
  { ssr: false, loading: () => <div className="p-4 text-sm">加载 Markdown…</div> }
);

export default memo(function Page() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const syntaxStyle = useSyntaxHighlighting(resolvedTheme === 'dark');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [showBanner, setShowBanner] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('clipzy_limit_banner_closed') !== '1';
        }
        return true;
    });

    const {
        input, setInput,
        shareUrl, rawUrl,
        state,
        decrypted,
        error,
        showRaw, setShowRaw,
        expiration, setExpiration,
        isPending, isNotFound, isCreating, isReading,
        urlCopied, copyUrl,
        textCopied, copyText,
        rawCopied, copyRaw,
        upload,
        readClip,
        reset: logicReset
    } = useClipLogic();
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCloseBanner = useCallback(() => {
        setShowBanner(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem('clipzy_limit_banner_closed', '1');
        }
    }, []);

    useEffect(() => {
        if (!showBanner) return;
        const timer = setTimeout(() => {
            setShowBanner(false);
            if (typeof window !== 'undefined') {
                localStorage.setItem('clipzy_limit_banner_closed', '1');
            }
        }, 15000);
        return () => clearTimeout(timer);
    }, [showBanner]);

    const handleFullReset = useCallback(() => {
        logicReset();
        history.replaceState(null, '', location.pathname + location.search);
    }, [logicReset]);

    const logicResetRef = useRef(logicReset);
    useEffect(() => { logicResetRef.current = logicReset; }, [logicReset]);
    const readClipRef = useRef(readClip);
    useEffect(() => { readClipRef.current = readClip; }, [readClip]);
    const handleFullResetRef = useRef(handleFullReset);
    useEffect(() => { handleFullResetRef.current = handleFullReset; }, [handleFullReset]);
    const shareUrlRef = useRef(shareUrl);
    useEffect(() => { shareUrlRef.current = shareUrl; }, [shareUrl]);
    const decryptedRef = useRef(decrypted);
    useEffect(() => { decryptedRef.current = decrypted; }, [decrypted]);

    useEffect(() => {
        const processHashForDisplay = (hashToProcess: string) => {
            if (hashToProcess && hashToProcess.includes('!')) {
                logicResetRef.current();
                readClipRef.current(hashToProcess);
            } else if (!hashToProcess) {
                if (shareUrlRef.current || decryptedRef.current) {
                    handleFullResetRef.current();
                }
            }
        };
        processHashForDisplay(location.hash.slice(1));
        const handleHashChangeEvent = () => processHashForDisplay(location.hash.slice(1));
        window.addEventListener('hashchange', handleHashChangeEvent);
        return () => window.removeEventListener('hashchange', handleHashChangeEvent);
    }, []);
    
    // Input optimization
    const [inputValue, setInputValue] = useState(input);
    useEffect(() => { setInputValue(input); }, [input]);
    useEffect(() => {
        const handler = setTimeout(() => {
            if (inputValue !== input) setInput(inputValue);
        }, 200);
        return () => clearTimeout(handler);
    }, [inputValue, input, setInput]);

    const detectedLang = useMemo(() => decrypted ? detectLanguage(decrypted) : 'plaintext', [decrypted]);
    const deferredDecrypted = useDeferredValue(decrypted);

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
        success: 'text-blue-500',
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <Image src={dark ? '/assets/clipzy-white.png' : '/assets/clipzy.png'} width={80} height={40} alt="Clipzy Logo" className="cursor-pointer" onClick={handleFullReset} />
                    <Link href="/lan" className={`hidden md:flex items-center gap-2 ${themeClasses.textSecondary} hover:text-opacity-80 transition-colors duration-300`}>
                        <span>局域网快传</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">Beta</span>
                    </Link>
                </div>
                <button onClick={() => setTheme(dark ? 'light' : 'dark')} className={`${themeClasses.btnSecondary} p-2 rounded-md transition-colors duration-300`}>
                    {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
            </header>

            {/* Banner */}
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="max-w-2xl mx-auto mt-2 mb-4 px-5 py-2.5 rounded-2xl flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                        style={{ zIndex: 20 }}
                    >
                        <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-100 truncate">临时剪切板单次上限已提升至 <b className="font-medium text-amber-700 dark:text-amber-400">200万字/8MB</b>，欢迎体验。</span>
                        <button
                            onClick={handleCloseBanner}
                            className="ml-1 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400 focus:outline-none"
                            aria-label="关闭横幅"
                        >
                            <svg width="16" height="16" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M6 14L14 6"/></svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main */}
            <main className="flex-1 flex flex-col px-8 pt-6 pb-12 max-w-4xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {isReading && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className={`w-8 h-8 rounded-full border-3 border-t-transparent ${themeClasses.border}`} />
                            <span className={`${themeClasses.textPrimary} text-lg`}>{LOADING_MESSAGES[state as Exclude<LoadingState, LoadingState.Idle>]}</span>
                        </motion.div>
                    )}

                    {!isReading && decrypted && (
                        <motion.div key="decrypted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-8">
                                <div className="max-w-3xl">
                                    <h2 className={`${themeClasses.textPrimary} text-4xl font-extralight mb-3`}>已解密内容</h2>
                                    <p className={`${themeClasses.textSecondary} text-base`}>此内容已被安全解密，仅限当前设备访问</p>
                                </div>
                                <div className="flex space-x-4">
                                    <button onClick={() => copyText(deferredDecrypted!)} className={`${themeClasses.btnSecondary} transition-colors duration-300`}>
                                        {textCopied ? <span className={themeClasses.success}>已复制</span> : '复制全文'}
                                    </button>
                                    <button onClick={handleFullReset} className={`${themeClasses.btnSecondary} transition-colors duration-300`}>新建</button>
                                </div>
                            </div>
                            <div className={`flex-1 border ${themeClasses.border} rounded-md overflow-hidden transition-colors duration-300`}>
                                {isPending ? (
                                    <div className="animate-pulse space-y-4 p-4">
                                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
                                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
                                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
                                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
                                    </div>
                                ) : (
                                    detectedLang === 'markdown' ? (
                                        <Suspense fallback={<div className="p-4 text-sm">渲染 Markdown…</div>}>
                                            <MarkdownRenderer dark={dark}>{deferredDecrypted!}</MarkdownRenderer>
                                        </Suspense>
                                    ) : (
                                        <Suspense fallback={<div className="p-4 text-sm">加载高亮…</div>}>
                                            {syntaxStyle ? (
                                                <SyntaxHighlighter
                                                    language={detectedLang === 'plaintext' ? 'text' : detectedLang}
                                                    style={syntaxStyle}
                                                    customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.875rem', lineHeight: '1.5' }}
                                                    showLineNumbers={detectedLang !== 'plaintext'}
                                                    wrapLines wrapLongLines
                                                >
                                                    {deferredDecrypted!}
                                                </SyntaxHighlighter>
                                            ) : (
                                                <div className="p-4 text-sm">加载样式…</div>
                                            )}
                                        </Suspense>
                                    )
                                )}
                            </div>
                        </motion.div>
                    )}

                    {!isReading && !decrypted && !shareUrl && !isNotFound && (
                        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                            <div className="mb-8 max-w-3xl">
                                <h2 className={`${themeClasses.textPrimary} text-4xl font-extralight mb-3`}>新建分享</h2>
                                <p className={`${themeClasses.textSecondary} text-base`}>输入的文本将被端到端加密，仅限链接持有者查看</p>
                            </div>
                            <div className="flex flex-col flex-1">
                                <label htmlFor="main-input" className={`${themeClasses.textSecondary} text-sm mb-1 transition-colors duration-300`}>输入文本</label>
                                <textarea
                                    id="main-input"
                                    placeholder="在此处输入要分享的文本…"
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    disabled={isCreating}
                                    className={`flex-1 p-4 ${themeClasses.inputBg} placeholder-neutral-400 resize-none focus:outline-none border ${themeClasses.border} rounded-md ${isCreating ? 'opacity-50' : ''} transition-colors duration-300`}
                                    autoFocus
                                    rows={Math.min(20, Math.max(4, (inputValue.match(/\n/g)?.length ?? 0) + 1))}
                                    style={{ fontFamily: 'inherit', fontSize: '1rem', minHeight: 120, maxHeight: 600, overflow: 'auto' }}
                                    spellCheck={false}
                                />
                            </div>

                            <div className="mt-4">
                                <label htmlFor="exp" className={`${themeClasses.textSecondary} text-sm mb-1 transition-colors duration-300`}>过期时间</label>
                                <select id="exp" value={expiration} onChange={e => setExpiration(Number(e.target.value))} disabled={isCreating} className={`w-full p-2 border ${themeClasses.border} ${themeClasses.inputBg} rounded-md text-sm ${isCreating ? 'opacity-50' : ''} transition-colors duration-300`}>
                                    <option value={3600}>1 小时 (上限 200 万字)</option>
                                    <option value={86400}>1 天 (上限 200 万字)</option>
                                    <option value={604800}>7 天 (上限 200 万字)</option>
                                    <option value={-1}>永久有效 (上限 17 万字)</option>
                                </select>
                            </div>

                            {error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 p-3 rounded bg-red-50 dark:bg-red-900/20 ${themeClasses.error} transition-colors duration-300`}>{error}</motion.div>}

                            <div className="mt-6 flex justify-end">
                                <button onClick={upload} disabled={!inputValue || isCreating} className={`px-6 py-2 ${themeClasses.btnPrimary} text-black dark:text-white ${(!inputValue || isCreating) ? 'opacity-50' : ''} transition-colors duration-300`}>
                                    {isCreating ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-t-transparent rounded-full inline-block mr-2" /> : '创建链接'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {!isReading && shareUrl && state === LoadingState.Idle && (
                        <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 space-y-8">
                            <div>
                                <h2 className={`${themeClasses.textPrimary} text-4xl font-extralight mb-2`}>链接已创建</h2>
                                <p className={`${themeClasses.textSecondary} text-base`}>已自动复制<span className="font-semibold">最安全</span>的链接到剪贴板，此链接包含解密密钥，有效期为{expiration === -1 ? '永久' : expiration === 3600 ? '1小时' : expiration === 86400 ? '1天' : '7天'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className={`${themeClasses.textSecondary} text-sm mb-2 block`}>分享链接</label>
                                <div className={`flex flex-col md:flex-row border ${themeClasses.border} rounded-md overflow-hidden transition-colors duration-300`}>
                                    <input readOnly value={shareUrl} onClick={e => e.currentTarget.select()} className={`w-full md:flex-1 px-4 py-3 focus:outline-none text-sm bg-transparent ${themeClasses.textPrimary} transition-colors duration-300`} />
                                    <div className="flex">
                                        <button onClick={() => setIsModalOpen(true)} className={`flex-1 md:flex-initial px-4 py-3 ${themeClasses.btnSecondary} border-t md:border-t-0 md:border-l ${themeClasses.border} transition-colors duration-300`}>扫码</button>
                                        <button onClick={() => copyUrl(shareUrl)} className={`flex-1 md:flex-initial px-4 py-3 ${urlCopied ? themeClasses.success : themeClasses.btnSecondary} border-l ${themeClasses.border} transition-colors duration-300`}>{urlCopied ? '已复制' : '复制'}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={`${themeClasses.textSecondary} text-sm font-medium block`}>或者，获取纯文本链接
                                    <span onClick={() => setShowRaw(s => !s)} className="ml-1 text-zinc-400 hover:underline cursor-pointer">{showRaw ? '(收起事项)' : '(注意事项)'}</span>
                                </label>
                                <div className={`flex flex-col md:flex-row border ${themeClasses.border} rounded-md overflow-hidden transition-colors duration-300`}>
                                    <input readOnly value={rawUrl} onClick={e => e.currentTarget.select()} className={`w-full md:flex-1 px-4 py-3 focus:outline-none text-sm bg-transparent ${themeClasses.textPrimary} transition-colors duration-300`} />
                                    <button onClick={() => copyRaw(rawUrl)} className={`px-4 py-3 ${rawCopied ? themeClasses.success : themeClasses.btnSecondary} border-t md:border-t-0 md:border-l ${themeClasses.border} transition-colors duration-300`}>{rawCopied ? '已复制' : '复制'}</button>
                                </div>
                                <AnimatePresence>
                                    {showRaw && (
                                        <motion.div initial={{ opacity: 0, maxHeight: 0 }} animate={{ opacity: 1, maxHeight: '500px' }} exit={{ opacity: 0, maxHeight: 0 }} transition={{ duration: 0.3 }} className={`mt-1 p-3 rounded text-xs ${themeClasses.inputBg} border ${themeClasses.border} transition-colors duration-300`}>
                                            <strong className={themeClasses.error}>警告：</strong>如果你使用了此链接，链接的解密操作将会在服务器端进行…链接有效期为{expiration === -1 ? '永久' : expiration === 3600 ? ' 1 小时' : expiration === 86400 ? ' 1 天' : ' 7 天'}。
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button onClick={handleFullReset} className={`${themeClasses.btnPrimary} px-6 py-2 self-start mt-8 transition-colors duration-300`}>创建新剪贴</button>
                        </motion.div>
                    )}

                    {!isReading && isNotFound && (
                        <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                        >
                            <div className="text-6xl opacity-50">🌵</div>
                           <h2 className={`${themeClasses.textPrimary} text-2xl font-light`}>无法找到内容</h2>
                           <p className={`${themeClasses.textSecondary} max-w-xl`}>
                              您尝试访问的链接可能已过期或者被删除。
                            </p>
                           <button onClick={handleFullReset} className={`${themeClasses.btnPrimary} px-6 py-2 transition-colors duration-300`}>
                              创建新剪贴
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
            <QRCodeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                url={shareUrl || ''}
                themeClasses={themeClasses}
            />
        </div>
    );
});
