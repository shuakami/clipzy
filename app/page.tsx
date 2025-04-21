// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  generateKey,
  encryptData,
  compressString,
  decompressString,
  decryptData
} from '../lib/crypto';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then(mod => mod.Light),
  { ssr: false }
);

/* ------------------------------------------------------------------ */
/* ---------------------- 类型 & 常量定义 --------------------------- */
/* ------------------------------------------------------------------ */

enum LoadingState {
  Idle = 'idle',
  Encrypting = 'encrypting',
  Uploading = 'uploading',
  Fetching = 'fetching',
  Decompressing = 'decompressing',
  Decrypting = 'decrypting'
}

const LOADING_MESSAGES: Record<Exclude<LoadingState, LoadingState.Idle>, string> = {
  [LoadingState.Encrypting]: '加密中…',
  [LoadingState.Uploading]: '生成链接中…',
  [LoadingState.Fetching]: '获取数据中…',
  [LoadingState.Decompressing]: '解压数据中…',
  [LoadingState.Decrypting]: '解密内容中…'
};

// 按用途快速判断
const CREATING_STATES = new Set<LoadingState>([
  LoadingState.Encrypting,
  LoadingState.Uploading
]);
const READING_STATES = new Set<LoadingState>([
  LoadingState.Fetching,
  LoadingState.Decompressing,
  LoadingState.Decrypting
]);

/* ------------------------------------------------------------------ */
/* --------------------------- 工具函数 ----------------------------- */
/* ------------------------------------------------------------------ */

const detectLanguage = (txt: string): string => {
  if (!txt.includes('{') && !txt.includes('<')) return 'plaintext';
  if (txt.includes('<') && txt.includes('>')) return 'xml';
  if (txt.includes('function') || txt.includes('=>')) return 'javascript';
  return 'json';
};

/* ------------------------------------------------------------------ */
/* --------------------------- 自定义 Hook -------------------------- */
/* ------------------------------------------------------------------ */

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

function useTheme(dark: boolean) {
  return useMemo(
    () => ({
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
    }),
    [dark]
  );
}

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch {
        throw new Error('复制失败');
      }
    },
    [timeout]
  );
  return { copied, copy };
}

/* ------------------------------------------------------------------ */
/* ----------------------------- 组件主体 --------------------------- */
/* ------------------------------------------------------------------ */

export default function Page() {
  /* ---------------- state ---------------- */
  const [inputValue, setInputValue] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.Idle);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { copied: urlCopied, copy: copyUrl } = useClipboard();
  const { copied: textCopied, copy: copyText } = useClipboard();

  const [darkMode, setDarkMode] = usePrefersDarkMode();
  const theme = useTheme(darkMode);

  // 使用 Set.has 的常量时间复杂度判断
  const isCreating = CREATING_STATES.has(loadingState);
  const isReading = READING_STATES.has(loadingState);

  /* ---------------- 工具函数 ---------------- */
  const abortRef = useRef<AbortController | null>(null); // 控制并发请求

  const handleError = (err: unknown) =>
    setError(`失败: ${err instanceof Error ? err.message : String(err)}`);

  /* ---------------- 操作：加密并上传 ---------------- */
  const handleEncryptAndUpload = async () => {
    if (isCreating || !inputValue) return;

    setError(null);
    setLoadingState(LoadingState.Encrypting);

    try {
      const { key, base64Key } = await generateKey();
      const encrypted = await encryptData(inputValue, key);

      setLoadingState(LoadingState.Uploading);
      const compressed = compressString(encrypted);

      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compressedData: compressed })
      });

      if (!res.ok) throw new Error((await res.text().catch(() => '')) || `API Error:${res.status}`);

      const { id } = await res.json();
      if (!id) throw new Error('No ID returned');

      const url = `${location.origin}${location.pathname}#${id}!${base64Key}`;
      setShareUrl(url);
      await copyUrl(url);
    } catch (e) {
      handleError(e);
    } finally {
      setLoadingState(LoadingState.Idle);
    }
  };

  /* ---------------- 操作：读取 & 解密 ---------------- */
  const fetchAndDecrypt = useCallback(
    async (hash: string) => {
      const [id, base64Key] = hash.split('!');
      if (!id || !base64Key) throw new Error('URL 格式错误');

      // 中断上一请求
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      setLoadingState(LoadingState.Fetching);
      const res = await fetch(`/api/get?id=${encodeURIComponent(id)}`, { signal });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(
          txt ||
            (res.status === 404 ? '内容未找到或已过期' : `API Error:${res.status}`)
        );
      }

      const { compressedData } = await res.json();
      if (!compressedData) throw new Error('无数据返回');

      setLoadingState(LoadingState.Decompressing);
      const decompressed = decompressString(compressedData);
      if (decompressed === null) throw new Error('解压失败');

      setLoadingState(LoadingState.Decrypting);
      const decrypted = await decryptData(decompressed, base64Key);
      setDecryptedContent(decrypted);
    },
    []
  );

  // hash 变化监听
  useEffect(() => {
    const processHash = async () => {
      const hash = location.hash.slice(1);
      if (!hash.includes('!')) return; // 无密钥 hash，忽略

      // 重置状态
      setShareUrl('');
      setInputValue('');
      setError(null);
      setDecryptedContent(null);

      try {
        await fetchAndDecrypt(hash);
      } catch (e) {
        handleError(e);
      } finally {
        setLoadingState(LoadingState.Idle);
      }
    };

    processHash();
    window.addEventListener('hashchange', processHash);
    return () => window.removeEventListener('hashchange', processHash);
  }, [fetchAndDecrypt]);

  /* ---------------- 根据解密内容自动识别语言 ---------------- */
  const detectedLanguage = useMemo(
    () => (decryptedContent ? detectLanguage(decryptedContent) : 'plaintext'),
    [decryptedContent]
  );

  /* ---------------- 其余交互 ---------------- */
  const reset = () => {
    setInputValue('');
    setShareUrl('');
    setDecryptedContent(null);
    setError(null);
    setLoadingState(LoadingState.Idle);
    history.replaceState(null, '', location.pathname + location.search);
  };

  /* ------------------------------------------------------------------ */
  /* ----------------------------- JSX -------------------------------- */
  /* ------------------------------------------------------------------ */

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg}`}>
      {/* ------------- header ------------- */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Image
          src={darkMode ? '/assets/clipzy-white.png' : '/assets/clipzy.png'}
          width={80}
          height={40}
          alt="Logo"
          className="cursor-pointer"
          onClick={reset}
        />
        <button
          onClick={() => setDarkMode(d => !d)}
          className={theme.btnSecondary}
          aria-label="toggle-theme"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* ------------- main ------------- */}
      <main className="flex-1 flex flex-col px-8 pt-6 pb-12 max-w-4xl mx-auto w-full">
        {/* 加载、输入、分享、已解密 四种主视图 */}
        <AnimatePresence mode="wait">
          {/* 加载态 */}
          {isReading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center flex-1"
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

          {/* 已解密视图 */}
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
                {/* Button container - Apply responsive classes */}
                <div className="flex flex-col space-y-2 items-end mt-4 sm:mt-0 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
                  <button
                    onClick={() => decryptedContent && copyText(decryptedContent)}
                    className={`${theme.btnSecondary} flex items-center space-x-2 w-full justify-center sm:w-auto`}> {/* Full width on mobile */}
                    {textCopied ? (
                      <span className={theme.success}>已复制</span>
                    ) : (
                      <span>复制全文</span>
                    )}
                  </button>
                  <button onClick={reset} className={`${theme.btnSecondary} w-full justify-center sm:w-auto`}> {/* Full width on mobile */}
                    新建
                  </button>
                </div>
              </div>

              <div
                className={`flex-1 border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}
              >
                <SyntaxHighlighter
                  language={detectedLanguage}
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
              </div>
            </motion.div>
          )}

          {/* 输入视图 */}
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
                <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-3`}>新建分享</h2>
                <p className={`${theme.textSecondary} text-base`}>
                  输入的文本将被端到端加密，仅限链接持有者查看
                </p>
              </div>

              {/* textarea */}
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2 h-6">
                  <label className={`${theme.textSecondary} text-sm`}>输入文本</label>
                  {inputValue && (
                    <motion.span
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`${theme.textSecondary} text-xs`}
                    >
                      {inputValue.length} 个字符
                    </motion.span>
                  )}
                </div>
                <textarea
                  placeholder="在此处输入要分享的文本…"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isCreating}
                  className={`flex-1 w-full p-4 ${theme.inputBg} placeholder-neutral-400 resize-none focus:outline-none border ${theme.border} rounded-md transition-all duration-200 ${
                    isCreating ? 'opacity-50' : ''
                  }`}
                  autoFocus
                />
              </div>

              {/* 错误提示 */}
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

              {/* 创建按钮 */}
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
                        {
                          LOADING_MESSAGES[
                            loadingState as Exclude<LoadingState, LoadingState.Idle>
                          ]
                        }
                      </span>
                    </div>
                  ) : (
                    '创建链接'
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* 分享视图 */}
          {!isReading && shareUrl && loadingState === LoadingState.Idle && (
            <motion.div
              key="share"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1"
            >
              <div className="mb-8 max-w-3xl">
                <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-3`}>
                  链接已创建
                </h2>
                <p className={`${theme.textSecondary} text-base`}>
                  已自动复制到剪贴板，此链接包含解密密钥，有效期为 1 小时
                </p>
              </div>

              <div className="mb-8">
                <label className={`${theme.textSecondary} text-sm mb-2 block`}>分享链接</label>
                <div
                  className={`flex items-center border ${theme.border} rounded-md overflow-hidden ${theme.inputBg}`}
                >
                  <input
                    readOnly
                    value={shareUrl}
                    onClick={e => (e.currentTarget as HTMLInputElement).select()}
                    className={`flex-1 px-4 py-3 ${theme.inputBg} focus:outline-none`}
                  />
                  <button
                    onClick={() => copyUrl(shareUrl)}
                    className={`px-4 py-3 ${
                      urlCopied ? theme.success : theme.btnSecondary
                    } border-l ${theme.border} transition-colors duration-200`}
                  >
                    {urlCopied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>

              <button
                onClick={reset}
                className={`${theme.btnPrimary} px-6 py-2 transition-all duration-200 hover:shadow-sm`}
              >
                创建新剪贴
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Use the Footer component */}
      <Footer />
    </div>
  );
}
