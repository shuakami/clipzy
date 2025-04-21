// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  generateKey,
  encryptData,
  compressString,
  decompressString,
  decryptData,
  getKeyFromBase64
} from '../lib/crypto';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { saveViewedClip } from '../lib/indexeddb';

// 动态加载代码高亮
const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then(mod => mod.Light),
  { ssr: false }
);
// 动态加载 Markdown 渲染
const MarkdownRenderer = dynamic(
  () =>
    import('./_md').then(async ({ default: ReactMarkdown }) => {
      const { default: remarkGfm } = await import('remark-gfm');
      return (props: { children: string; dark: boolean }) => (
        <div className={`prose ${props.dark ? 'prose-invert' : ''} max-w-none p-4 text-sm`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.children}</ReactMarkdown>
        </div>
      );
    }),
  { ssr: false, loading: () => <div className="p-4 text-sm">加载 Markdown…</div> }
);

// 加载状态
enum LoadingState {
  Idle = 'idle',
  Encrypting = 'encrypting',
  Uploading = 'uploading',
  Fetching = 'fetching',
  Decompressing = 'decompressing',
  Decrypting = 'decrypting'
}
const LOADING_MESSAGES = {
  [LoadingState.Encrypting]: '加密中...',
  [LoadingState.Uploading]: '生成链接中...',
  [LoadingState.Fetching]: '获取数据中...',
  [LoadingState.Decompressing]: '解压数据中...',
  [LoadingState.Decrypting]: '解密内容中...'
} as const;
const CREATING = new Set<LoadingState>([LoadingState.Encrypting, LoadingState.Uploading]);
const READING  = new Set<LoadingState>([LoadingState.Fetching, LoadingState.Decompressing, LoadingState.Decrypting]);

// 语言检测
const detectLanguage = (txt: string) => {
  if (/(^|\n)\s*```/.test(txt) || /(^|\n)#\s/.test(txt) || /\[.*\]\(.*\)/.test(txt)) return 'markdown';
  if (txt.includes('<') && txt.includes('>')) return 'xml';
  if (txt.includes('{') || txt.includes('}')) return 'json';
  if (txt.includes('function') || txt.includes('=>')) return 'javascript';
  return 'plaintext';
};

// 系统暗色模式
function usePrefersDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return [dark, setDark] as const;
}
// 生成主题 class
function useTheme(dark: boolean) {
  return useMemo(() => ({
    bg: dark ? 'bg-black text-white' : 'bg-white text-black',
    border: dark ? 'border-zinc-700' : 'border-neutral-200',
    inputBg: dark ? 'bg-zinc-900' : 'bg-white',
    btnPrimary: dark
      ? 'bg-zinc-800 text-white hover:bg-zinc-700'
      : 'bg-neutral-100 text-black hover:bg-neutral-200',
    btnSecondary: dark
      ? 'text-zinc-400 hover:text-zinc-200'
      : 'text-neutral-500 hover:text-neutral-800',
    textPrimary: dark ? 'text-white' : 'text-black',
    textSecondary: dark ? 'text-zinc-400' : 'text-neutral-500',
    success: 'text-blue-500',
    error: dark ? 'text-red-400' : 'text-red-500'
  }), [dark]);
}

// 剪贴板复制
function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  }, [timeout]);
  return { copied, copy };
}


export default memo(function Page() {
  // 状态
  const [inputValue, setInputValue] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [rawUrl, setRawUrl] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.Idle);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawDetails, setShowRawDetails] = useState(false);

  // 复制状态
  const { copied: urlCopied, copy: copyUrl } = useClipboard();
  const { copied: textCopied, copy: copyText } = useClipboard();
  const { copied: rawUrlCopied, copy: copyRawUrl } = useClipboard();

  const [darkMode, setDarkMode] = usePrefersDarkMode();
  const theme = useTheme(darkMode);

  const isCreating = useMemo(() => CREATING.has(loadingState), [loadingState]);
  const isReading  = useMemo(() => READING.has(loadingState), [loadingState]);

  const abortRef = useRef<AbortController | null>(null);
  const localKeyRef = useRef<CryptoKey | null>(null);

  const handleError = useCallback((err: unknown) => {
    setError(`失败: ${err instanceof Error ? err.message : String(err)}`);
  }, []);

  // 初始化本地密钥
  useEffect(() => {
    (async () => {
      try {
        const name = 'localEncryptKeyBase64';
        const b64 = localStorage.getItem(name);
        if (!b64) {
          const { key, base64Key } = await generateKey();
          localStorage.setItem(name, base64Key);
          localKeyRef.current = key;
        } else {
          localKeyRef.current = await getKeyFromBase64(b64, ['encrypt','decrypt']);
        }
      } catch (e) {
        console.error(e);
        setError('本地加密密钥初始化失败，无法保存预览历史。');
      }
    })();
  }, []);

  // 加密并上传
  const handleEncryptAndUpload = useCallback(async () => {
    if (isCreating || !inputValue) return;
    const size = new TextEncoder().encode(inputValue).length;
    if (size > 5*1024*1024) {
      setError(`输入内容过大 (${(size/1024/1024).toFixed(2)} MB)，请确保不超过 5.00 MB。`);
      return;
    }
    setError(null);
    setLoadingState(LoadingState.Encrypting);
    try {
      const { key, base64Key } = await generateKey();
      const encrypted = await encryptData(inputValue, key);
      setLoadingState(LoadingState.Uploading);
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compressedData: compressString(encrypted) })
      });
      if (!res.ok) throw new Error((await res.text()) || `API Error:${res.status}`);
      const { id } = await res.json();
      const url = `${location.origin}${location.pathname}#${id}!${base64Key}`;
      const raw = `${location.origin}/api/raw/${id}?key=${base64Key}`;
      setShareUrl(url);
      setRawUrl(raw);
      await copyUrl(url);
    } catch (e) {
      handleError(e);
    } finally {
      setLoadingState(LoadingState.Idle);
    }
  }, [inputValue, isCreating, copyUrl, handleError]);

  // 获取并解密
  const fetchAndDecrypt = useCallback(async (hash: string) => {
    const [id, base64Key] = hash.split('!');
    if (!id || !base64Key) return handleError(new Error('URL 格式错误'));
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setLoadingState(LoadingState.Fetching);
      const res = await fetch(`/api/get?id=${encodeURIComponent(id)}`, { signal: controller.signal });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || (res.status === 404 ? '内容未找到或已过期' : `API Error:${res.status}`));
      }
      const { compressedData } = await res.json();
      setLoadingState(LoadingState.Decompressing);
      const decompressed = decompressString(compressedData);
      if (decompressed === null) throw new Error('解压失败');
      setLoadingState(LoadingState.Decrypting);
      const decrypted = await decryptData(decompressed, base64Key);
      setDecryptedContent(decrypted);
      if (localKeyRef.current) {
        try {
          const localEncrypted = await encryptData(decrypted, localKeyRef.current);
          await saveViewedClip({ id, encryptedData: localEncrypted, timestamp: Date.now() });
        } catch (e) {
          console.error('Failed to save clip:', e);
        }
      }
    } catch (e) {
      handleError(e);
    } finally {
      setLoadingState(LoadingState.Idle);
      abortRef.current = null;
    }
  }, [handleError]);

  // 监听 hashchange
  useEffect(() => {
    const onHash = () => {
      const hash = location.hash.slice(1);
      if (!hash.includes('!')) return;
      setInputValue('');
      setShareUrl('');
      setRawUrl('');
      setDecryptedContent(null);
      setError(null);
      fetchAndDecrypt(hash);
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [fetchAndDecrypt]);

  const detectedLanguage = useMemo(
    () => decryptedContent ? detectLanguage(decryptedContent) : 'plaintext',
    [decryptedContent]
  );

  const reset = () => {
    setInputValue('');
    setShareUrl('');
    setRawUrl('');
    setDecryptedContent(null);
    setError(null);
    setLoadingState(LoadingState.Idle);
    setShowRawDetails(false);
    history.replaceState(null, '', location.pathname + location.search);
  };

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg}`}>
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Image
          src={darkMode ? '/assets/clipzy-white.png' : '/assets/clipzy.png'}
          width={80}
          height={40}
          alt="Clipzy Logo"
          className="cursor-pointer"
          onClick={reset}
        />
        <button onClick={() => setDarkMode(d => !d)} className={theme.btnSecondary}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col px-8 pt-6 pb-12 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {isReading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className={`w-8 h-8 rounded-full border-3 border-t-transparent ${theme.border}`}
              />
              <span className={`${theme.textPrimary} text-lg`}>
                {LOADING_MESSAGES[loadingState as Exclude<LoadingState, LoadingState.Idle>]}
              </span>
            </motion.div>
          )}

          {/* Decrypted view */}
          {!isReading && decryptedContent && (
            <motion.div
              key="decrypted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="max-w-3xl">
                  <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-3`}>
                    已解密内容
                  </h2>
                  <p className={`${theme.textSecondary} text-base`}>
                    此内容已被安全解密，仅限当前设备访问
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => copyText(decryptedContent)}
                    className={theme.btnSecondary}
                  >
                    {textCopied ? <span className={theme.success}>已复制</span> : '复制全文'}
                  </button>
                  <button onClick={reset} className={theme.btnSecondary}>
                    新建
                  </button>
                </div>
              </div>
              <div className={`flex-1 border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}>
                {detectedLanguage === 'markdown' ? (
                  <Suspense fallback={<div className="p-4 text-sm">渲染 Markdown…</div>}>
                    <MarkdownRenderer dark={darkMode}>{decryptedContent}</MarkdownRenderer>
                  </Suspense>
                ) : (
                  <SyntaxHighlighter
                    language={detectedLanguage === 'plaintext' ? 'text' : detectedLanguage}
                    style={darkMode ? atomOneDark : atomOneLight}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}
                    showLineNumbers={detectedLanguage !== 'plaintext'}
                    wrapLines
                    wrapLongLines
                  >
                    {decryptedContent}
                  </SyntaxHighlighter>
                )}
              </div>
            </motion.div>
          )}

          {/* Input view */}
          {!isReading && !decryptedContent && !shareUrl && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1"
            >
              <div className="mb-8 max-w-3xl">
                <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-3`}>
                  新建分享
                </h2>
                <p className={`${theme.textSecondary} text-base`}>
                  输入的文本将被端到端加密，仅限链接持有者查看
                </p>
              </div>
              <div className="flex flex-col flex-1">
                <label className={`${theme.textSecondary} text-sm mb-1`}>输入文本</label>
                <textarea
                  placeholder="在此处输入要分享的文本…"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isCreating}
                  className={`flex-1 p-4 ${theme.inputBg} placeholder-neutral-400 resize-none focus:outline-none border ${theme.border} rounded-md transition-all duration-200 ${
                    isCreating ? 'opacity-50' : ''
                  }`}
                  autoFocus
                />
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`mt-4 p-3 rounded bg-red-50 dark:bg-red-900/20 ${theme.error}`}
                >
                  {error}
                </motion.div>
              )}
              <motion.div
                className="mt-6 flex justify-end"
                initial={false}
                animate={{
                  opacity: inputValue ? 1 : 0.5,
                  scale: inputValue ? 1 : 0.98,
                  y: inputValue ? 0 : 5
                }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={handleEncryptAndUpload}
                  disabled={!inputValue || isCreating}
                  className={`relative px-6 py-2 ${
                    !inputValue ? 'opacity-50 cursor-not-allowed' : ''
                  } ${theme.btnPrimary} transition-all duration-200`}
                >
                  {isCreating ? (
                    <div className="flex items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-t-transparent rounded-full mr-2"
                      />
                      <span>
                        {LOADING_MESSAGES[loadingState as Exclude<LoadingState, LoadingState.Idle>]}
                      </span>
                    </div>
                  ) : (
                    '创建链接'
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Share view */}
          {!isReading && shareUrl && loadingState === LoadingState.Idle && (
            <motion.div
              key="share"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 space-y-8"
            >
              <div>
                <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-2`}>
                  链接已创建
                </h2>
                <p className={`${theme.textSecondary} text-base`}>
                  已自动复制到剪贴板，此链接包含解密密钥，有效期为1小时
                </p>
              </div>
              <div className="space-y-2">
                <label className={`${theme.textSecondary} text-sm mb-2 block`}>分享链接</label>
                <div className={`flex items-center border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}>
                  <input
                    readOnly
                    value={shareUrl}
                    onClick={e => (e.currentTarget as HTMLInputElement).select()}
                    className={`flex-1 px-4 py-3 ${theme.inputBg} focus:outline-none`}
                  />
                  <button
                    onClick={() => copyUrl(shareUrl)}
                    className={`px-4 py-3 ${urlCopied ? theme.success : theme.btnSecondary} border-l ${theme.border}`}
                  >
                    {urlCopied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className={`${theme.textSecondary} text-sm font-medium block`}>
                  或者，获取纯文本链接
                  <span
                    onClick={() => setShowRawDetails(prev => !prev)}
                    className="ml-1 text-zinc-400 hover:underline cursor-pointer"
                  >
                    {showRawDetails ? '(收起事项)' : '(注意事项)'}
                  </span>
                </label>
                <div className={`flex items-center border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}>
                  <input
                    readOnly
                    value={rawUrl}
                    onClick={e => (e.currentTarget as HTMLInputElement).select()}
                    className={`flex-1 px-4 py-3 ${theme.inputBg} focus:outline-none`}
                  />
                  <button
                    onClick={() => copyRawUrl(rawUrl)}
                    className={`px-4 py-3 ${rawUrlCopied ? theme.success : theme.btnSecondary} border-l ${theme.border}`}
                  >
                    {rawUrlCopied ? '已复制' : '复制'}
                  </button>
                </div>
                <AnimatePresence>
                  {showRawDetails && (
                    <motion.div
                      initial={{ opacity: 0, maxHeight: 0 }}
                      animate={{ opacity: 1, maxHeight: '500px' }}
                      exit={{ opacity: 0, maxHeight: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`mt-1 p-3 rounded text-xs ${theme.inputBg} border ${theme.border} overflow-hidden`}
                    >
                      <strong className={theme.error}>警告：</strong>
                      如果你使用了此链接，链接的解密操作将会在服务器端进行，服务器会临时接触到原始内容。会破坏端到端加密的安全性，但我们承诺 <strong className="font-semibold">绝不存储</strong> 解密后的数据。请仅在信任接收方或不在意内容临时暴露给服务器的情况下使用。链接有效期 1 小时。
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={reset} className={`${theme.btnPrimary} px-6 py-2 transition-all duration-200 hover:shadow-sm self-start`}>
                创建新剪贴
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
});
