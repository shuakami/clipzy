'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { getKeyFromBase64, decryptDataWithKey } from '../../lib/crypto';
import { getViewedClips, deleteViewedClip, type ViewedClip } from '../../lib/indexeddb';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// 动态加载 Markdown 渲染器，SSR 禁用
const MarkdownRenderer = dynamic(
  () =>
    import('../_md').then(async ({ default: ReactMarkdown }) => {
      const { default: remarkGfm } = await import('remark-gfm');
      return (props: { children: string; dark: boolean }) => (
        <div className={`prose ${props.dark ? 'prose-invert' : ''} max-w-none p-4 text-sm`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.children}</ReactMarkdown>
        </div>
      );
    }),
  { ssr: false, loading: () => <div className="p-4 text-sm">渲染 Markdown…</div> }
);

// Hook：跟随系统主题
function usePrefersDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return [dark, setDark] as const;
}

// Hook：生成主题 class
function useTheme(dark: boolean) {
  return useMemo(
    () => ({
      bg: dark ? 'bg-black text-white' : 'bg-white text-black',
      border: dark ? 'border-zinc-700' : 'border-neutral-200',
      btnPrimary: dark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-neutral-100 text-black hover:bg-neutral-200',
      btnSecondary: dark ? 'text-zinc-400 hover:text-zinc-200' : 'text-neutral-500 hover:text-neutral-800',
      textPrimary: dark ? 'text-white' : 'text-black',
      textSecondary: dark ? 'text-zinc-400' : 'text-neutral-500',
      error: dark ? 'text-red-400' : 'text-red-500',
      success: 'text-blue-500',
    }),
    [dark]
  );
}

// Hook：剪贴板复制提示
function useClipboard(timeout = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = useCallback(
    async (text: string, id: string) => {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), timeout);
    },
    [timeout]
  );
  return { copiedId, copy };
}

// 语言检测
const detectLanguage = (txt: string): string => {
  if (/(^|\n)\s*```/.test(txt) || /(^|\n)#\s/.test(txt) || /\[.*\]\(.*\)/.test(txt)) return 'markdown';
  if (txt.includes('<') && txt.includes('>')) return 'xml';
  if (txt.includes('{') || txt.includes('}')) return 'json';
  if (txt.includes('function') || txt.includes('=>')) return 'javascript';
  return 'plaintext';
};

// 时间格式化
const formatTimestamp = (ts: number) => new Date(ts).toLocaleString();

interface HistoryItem extends ViewedClip {
  decryptedText?: string;
  detectedLang?: string;
  isDecrypting?: boolean;
  decryptionError?: string;
  isExpanded?: boolean;
}

function HistoryPage() {
  // 状态管理
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localKeyRef = useRef<CryptoKey | null>(null);

  // 主题和剪贴板
  const [darkMode, setDarkMode] = usePrefersDarkMode();
  const theme = useTheme(darkMode);
  const { copiedId, copy } = useClipboard();

  // 1. 初始化本地密钥
  useEffect(() => {
    (async () => {
      try {
        const base64 = localStorage.getItem('localEncryptKeyBase64');
        if (!base64) throw new Error('本地密钥不存在');
        localKeyRef.current = await getKeyFromBase64(base64, ['decrypt']);
      } catch (e: unknown) {
        console.error('Error loading local key:', e);
        setError('无法加载本地密钥，无法解密历史记录');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. 加载历史记录
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const clips = await getViewedClips();
        setHistory(clips.map(c => ({ ...c, isExpanded: false })));
      } catch {
        setError('加载历史记录失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 3. 解密条目
  const handleDecrypt = useCallback(
    async (id: string) => {
      if (!localKeyRef.current) {
        setError('本地密钥不可用');
        return;
      }
      setHistory(h =>
        h.map(item =>
          item.id === id
            ? { ...item, isDecrypting: true, decryptionError: undefined }
            : item
        )
      );
      const item = history.find(i => i.id === id);
      if (!item) return;
      try {
        const txt = await decryptDataWithKey(item.encryptedData, localKeyRef.current!);
        const lang = detectLanguage(txt);
        setHistory(h =>
          h.map(i =>
            i.id === id
              ? { ...i, decryptedText: txt, detectedLang: lang, isDecrypting: false, isExpanded: true }
              : i
          )
        );
      } catch {
        setHistory(h =>
          h.map(i =>
            i.id === id
              ? { ...i, isDecrypting: false, decryptionError: '解密失败' }
              : i
          )
        );
      }
    },
    [history]
  );

  // 切换展开/收起
  const toggleExpand = useCallback((id: string) => {
    setHistory(h => h.map(i => (i.id === id ? { ...i, isExpanded: !i.isExpanded } : i)));
  }, []);

  // 4. 删除条目
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteViewedClip(id);
      setHistory(h => h.filter(i => i.id !== id));
    } catch {
      setError('删除失败');
    }
  }, []);

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg}`}>
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center">
        <Link href="/">
          <Image
            src={darkMode ? '/assets/clipzy-white.png' : '/assets/clipzy.png'}
            width={80}
            height={40}
            alt="Logo"
            className="cursor-pointer"
          />
        </Link>
        <button
          onClick={() => setDarkMode(d => !d)}
          className={theme.btnSecondary}
          aria-label="切换主题"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 px-8 pt-6 pb-12 max-w-4xl mx-auto w-full">
        <h2 className={`${theme.textPrimary} text-4xl font-extralight mb-6`}>查看历史</h2>

        {/* 加载中 */}
        {loading && (
          <div className="flex-1 flex justify-center items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className={`w-8 h-8 rounded-full border-3 border-t-transparent ${theme.border}`}
            />
          </div>
        )}

        {/* 错误 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`p-3 rounded bg-red-50 dark:bg-red-900/20 ${theme.error}`}
          >
            {error}
          </motion.div>
        )}

        {/* 空状态 */}
        {!loading && !error && history.length === 0 && (
          <p className={`${theme.textSecondary} text-center py-10`}>
            暂无历史记录
          </p>
        )}

        {/* 列表 */}
        {!loading && !error && history.length > 0 && (
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className={`py-3 border-b ${theme.border}`}>
                {/* 条目信息 */}
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className={`${theme.textSecondary} text-xs font-mono truncate`} title={item.id}>
                      ID: {item.id}
                    </p>
                    <p className={`${theme.textSecondary} text-xs`}>
                      时间: {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {!item.decryptedText && !item.isDecrypting && !item.decryptionError && (
                      <button
                        onClick={() => handleDecrypt(item.id)}
                        className={`${theme.btnSecondary} text-sm px-3 py-1`}
                      >
                        解密查看
                      </button>
                    )}
                    {item.isDecrypting && <span className={`${theme.textSecondary}`}>解密中…</span>}
                    {item.decryptedText && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className={`${theme.btnSecondary} text-xs px-2 py-1`}
                      >
                        {item.isExpanded ? '隐藏' : '显示'}
                      </button>
                    )}
                    {item.decryptedText && (
                      <button
                        onClick={() => copy(item.decryptedText!, item.id)}
                        className={`${theme.btnSecondary} text-xs px-2 py-1`}
                      >
                        {copiedId === item.id ? '已复制' : '复制'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`${theme.btnSecondary} text-xs px-2 py-1`}
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 展开内容 */}
                <AnimatePresence>
                  {item.isExpanded && item.decryptedText && (
                    <motion.div
                      initial={{ opacity: 0, maxHeight: 0 }}
                      animate={{ opacity: 1, maxHeight: '500px' }}
                      exit={{ opacity: 0, maxHeight: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`border ${theme.border} rounded overflow-hidden`}
                    >
                      {item.detectedLang === 'markdown' ? (
                        <Suspense fallback={<div className="p-4 text-sm">渲染 Markdown…</div>}>
                          <MarkdownRenderer dark={darkMode}>
                            {item.decryptedText}
                          </MarkdownRenderer>
                        </Suspense>
                      ) : (
                        <SyntaxHighlighter
                          language={
                            item.detectedLang === 'plaintext' ? 'text' : item.detectedLang!
                          }
                          style={darkMode ? atomOneDark : atomOneLight}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                          }}
                          showLineNumbers={item.detectedLang !== 'plaintext'}
                          wrapLines
                          wrapLongLines
                        >
                          {item.decryptedText}
                        </SyntaxHighlighter>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 flex items-center">
        <Image
          src={darkMode ? '/assets/clipzy-white.png' : '/assets/clipzy.png'}
          width={24}
          height={24}
          alt="Logo"
        />
        <span className={`${theme.textSecondary} text-xs ml-2`}>
          © {new Date().getFullYear()} Clipzy.
        </span>
      </footer>
    </div>
  );
}

export default memo(HistoryPage);
