// app/page.tsx
'use client';

import React, { useCallback } from 'react';
import {
  useEffect, useMemo,Suspense, useDeferredValue, memo, useRef
} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';

import { usePrefersDarkMode, useTheme } from '../hooks/useThemeManager';
import { useClipLogic, LoadingState, LOADING_MESSAGES } from '../hooks/useClipLogic';
import { useSyntaxHighlighting, detectLanguage } from '../hooks/useSyntaxHighlighting';

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
  const [dark, setDark] = usePrefersDarkMode();
  const theme = useTheme(dark);
  const syntaxStyle = useSyntaxHighlighting(dark);

  const {
    input, setInput,
    shareUrl, 
    rawUrl,
    state,
    decrypted,
    error,
    showRaw, setShowRaw,
    expiration, setExpiration,
    isPending,
    isNotFound,
    isCreating,
    isReading,
    urlCopied, copyUrl,
    textCopied, copyText,
    rawCopied, copyRaw,
    upload,
    readClip,
    reset: logicReset
  } = useClipLogic();

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

    const handleHashChangeEvent = () => {
      processHashForDisplay(location.hash.slice(1));
    };

    window.addEventListener('hashchange', handleHashChangeEvent);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChangeEvent);
    };
  }, []);

  const detectedLang = useMemo(() => decrypted ? detectLanguage(decrypted) : 'plaintext', [decrypted]);
  const deferredDecrypted = useDeferredValue(decrypted);

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg}`}>
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Image src={dark ? '/assets/clipzy-white.png' : '/assets/clipzy.png'} width={80} height={40} alt="Clipzy Logo" className="cursor-pointer" onClick={handleFullReset} />
        <button onClick={() => setDark(d => !d)} className={theme.btnSecondary}>{dark ? '☀️' : '🌙'}</button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col px-8 pt-6 pb-12 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {isReading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className={`w-8 h-8 rounded-full border-3 border-t-transparent ${theme.border}`} />
              <span className={`${theme.textPrimary} text-lg`}>{LOADING_MESSAGES[state as Exclude<LoadingState, LoadingState.Idle>]}</span>
            </motion.div>
          )}

          {!isReading && decrypted && (
            <motion.div key="decrypted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
              <div className="flex justify-between items-start mb-8">
                <div className="max-w-3xl">
                  <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-3`}>已解密内容</h2>
                  <p className={`${theme.textSecondary} text-base`}>此内容已被安全解密，仅限当前设备访问</p>
                </div>
                <div className="flex space-x-4">
                  <button onClick={() => copyText(deferredDecrypted!)} className={theme.btnSecondary}>
                    {textCopied ? <span className={theme.success}>已复制</span> : '复制全文'}
                  </button>
                  <button onClick={handleFullReset} className={theme.btnSecondary}>新建</button>
                </div>
              </div>
              <div className={`flex-1 border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}>
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
                <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-3`}>新建分享</h2>
                <p className={`${theme.textSecondary} text-base`}>输入的文本将被端到端加密，仅限链接持有者查看</p>
              </div>
              <div className="flex flex-col flex-1">
                <label htmlFor="main-input" className={`${theme.textSecondary} text-sm mb-1`}>输入文本</label>
                <textarea id="main-input" placeholder="在此处输入要分享的文本…" value={input} onChange={e => setInput(e.target.value)} disabled={isCreating} className={`flex-1 p-4 ${theme.inputBg} placeholder-neutral-400 resize-none focus:outline-none border ${theme.border} rounded-md ${isCreating ? 'opacity-50' : ''}`} autoFocus />
              </div>

              <div className="mt-4">
                <label htmlFor="exp" className={`${theme.textSecondary} text-sm mb-1`}>过期时间</label>
                <select id="exp" value={expiration} onChange={e => setExpiration(Number(e.target.value))} disabled={isCreating} className={`w-full p-2 border ${theme.border} ${theme.inputBg} rounded-md text-sm ${isCreating ? 'opacity-50' : ''}`}>
                  <option value={3600}>1 小时 (上限 70 万字)</option>
                  <option value={86400}>1 天 (上限 70 万字)</option>
                  <option value={604800}>7 天 (上限 70 万字)</option>
                  <option value={-1}>永久有效 (上限 17 万字)</option>
                </select>
              </div>

              {error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 p-3 rounded bg-red-50 dark:bg-red-900/20 ${theme.error}`}>{error}</motion.div>}

              <div className="mt-6 flex justify-end">
                <button onClick={upload} disabled={!input || isCreating} className={`px-6 py-2 ${theme.btnPrimary} ${(!input || isCreating) ? 'opacity-50' : ''}`}>
                  {isCreating ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-t-transparent rounded-full inline-block mr-2" /> : '创建链接'}
                </button>
              </div>
            </motion.div>
          )}

          {!isReading && shareUrl && state === LoadingState.Idle && (
            <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 space-y-8">
              <div>
                <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-2`}>链接已创建</h2>
                <p className={`${theme.textSecondary} text-base`}>已自动复制<span className="font-semibold">最安全</span>的链接到剪贴板，此链接包含解密密钥，有效期为{expiration === -1 ? '永久' : expiration === 3600 ? '1小时' : expiration === 86400 ? '1天' : '7天'}</p>
              </div>
              <div className="space-y-2">
                <label className={`${theme.textSecondary} text-sm mb-2 block`}>分享链接</label>
                <div className={`flex items-center border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}>
                  <input readOnly value={shareUrl} onClick={e => e.currentTarget.select()} className="flex-1 px-4 py-3 focus:outline-none text-sm" />
                  <button onClick={() => copyUrl(shareUrl)} className={`px-4 py-3 ${urlCopied ? theme.success : theme.btnSecondary} border-l ${theme.border}`}>{urlCopied ? '已复制' : '复制'}</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className={`${theme.textSecondary} text-sm font-medium block`}>或者，获取纯文本链接
                  <span onClick={() => setShowRaw(s => !s)} className="ml-1 text-zinc-400 hover:underline cursor-pointer">{showRaw ? '(收起事项)' : '(注意事项)'}</span>
                </label>
                <div className={`flex items-center border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}>
                  <input readOnly value={rawUrl} onClick={e => e.currentTarget.select()} className="flex-1 px-4 py-3 focus:outline-none text-sm" />
                  <button onClick={() => copyRaw(rawUrl)} className={`px-4 py-3 ${rawCopied ? theme.success : theme.btnSecondary} border-l ${theme.border}`}>{rawCopied ? '已复制' : '复制'}</button>
                </div>
                <AnimatePresence>
                  {showRaw && (
                    <motion.div initial={{ opacity: 0, maxHeight: 0 }} animate={{ opacity: 1, maxHeight: '500px' }} exit={{ opacity: 0, maxHeight: 0 }} transition={{ duration: 0.3 }} className={`mt-1 p-3 rounded text-xs ${theme.inputBg} border ${theme.border}`}>
                      <strong className={theme.error}>警告：</strong>如果你使用了此链接，链接的解密操作将会在服务器端进行…链接有效期为{expiration === -1 ? '永久' : expiration === 3600 ? ' 1 小时' : expiration === 86400 ? ' 1 天' : ' 7 天'}。
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={handleFullReset} className={`${theme.btnPrimary} px-6 py-2 self-start`}>创建新剪贴</button>
            </motion.div>
          )}

          {!isReading && isNotFound && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="text-6xl opacity-50">🌵</div>
              <h2 className={`${theme.textPrimary} text-2xl font-light`}>无法找到内容</h2>
              <p className={`${theme.textSecondary} max-w-xl`}>
                您尝试访问的链接可能已过期或者被删除。
              </p>
              <button onClick={handleFullReset} className={`${theme.btnPrimary} px-6 py-2`}>
                创建新剪贴
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>);
});
