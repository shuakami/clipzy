import {
  useState, useEffect, useRef,
  useCallback, useTransition
} from 'react';
import {
  generateKey, encryptData, compressString,
  decompressString, decryptData, getKeyFromBase64
} from '../lib/crypto';
import { saveViewedClip } from '../lib/indexeddb';
import { useClipboard } from './useClipboardUtils';

export enum LoadingState {
  Idle = 'idle',
  Encrypting = 'encrypting',
  Uploading = 'uploading',
  Fetching = 'fetching',
  Decompressing = 'decompressing',
  Decrypting = 'decrypting'
}

export const LOADING_MESSAGES = {
  [LoadingState.Encrypting]: '加密中…',
  [LoadingState.Uploading]: '生成链接中…',
  [LoadingState.Fetching]: '获取数据中…',
  [LoadingState.Decompressing]: '解压数据中…',
  [LoadingState.Decrypting]: '解密内容中…'
} as const;

export const CREATING = new Set([
  LoadingState.Encrypting,
  LoadingState.Uploading
]);

export const READING = new Set([
  LoadingState.Fetching,
  LoadingState.Decompressing,
  LoadingState.Decrypting
]);

export const EXP_KEY = 'clipzyExpirationPreference';

export function useClipLogic() {
  const [input, setInput] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [rawUrl, setRawUrl] = useState('');
  const [state, setState] = useState<LoadingState>(LoadingState.Idle);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [expiration, setExpiration] = useState<number>(3600);
  const [isPending, startTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const { copied: urlCopied, copy: copyUrl } = useClipboard();
  const { copied: textCopied, copy: copyText } = useClipboard();
  const { copied: rawCopied, copy: copyRaw } = useClipboard();

  const isCreating = CREATING.has(state);
  const isReading = READING.has(state);

  const abortRef = useRef<AbortController | null>(null);
  const localKeyRef = useRef<CryptoKey | null>(null);

  // 初始化本地密钥
  useEffect(() => {
    (async () => {
      try {
        const keyName = 'localEncryptKeyBase64';
        const b64 = localStorage.getItem(keyName);
        if (!b64) {
          const { key, base64Key } = await generateKey();
          localStorage.setItem(keyName, base64Key);
          localKeyRef.current = key;
        } else {
          localKeyRef.current = await getKeyFromBase64(b64, ['encrypt', 'decrypt']);
        }
      } catch (e) {
        console.error(e);
        setError('本地加密密钥初始化失败，无法保存预览历史。');
      }
    })();
  }, []);

  // 过期时间偏好
  useEffect(() => {
    const saved = localStorage.getItem(EXP_KEY);
    if (saved !== null) {
      const p = parseInt(saved, 10);
      if ([3600, 86400, 604800, -1].includes(p)) setExpiration(p);
    }
  }, []);
  useEffect(() => localStorage.setItem(EXP_KEY, String(expiration)), [expiration]);
  
  const onErr = useCallback((e: unknown) => {
    setIsNotFound(false);
    setError(`失败: ${e instanceof Error ? e.message : String(e)}`);
  }, []);

  // 上传逻辑 (upload function)
  const upload = useCallback(async () => {
    if (isCreating || !input) return;
    const chars = input.length;
    // 永久/长期：17万字，非永久：200万字
    const max = (expiration === -1 || expiration > 604800) ? 170000 : 2000000;
    const limitDesc = (expiration === -1 || expiration > 604800) ? '上限 17 万字' : '上限 200 万字';
    if (chars > max) return setError(`输入内容过长 (${chars.toLocaleString('zh-CN')} 字)，当前过期时间设置下限为 ${limitDesc}。`);
    setError(null); 
    setDecrypted(null);
    setState(LoadingState.Encrypting);
    try {
      const { key, base64Key } = await generateKey();
      const enc = await encryptData(input, key);
      setState(LoadingState.Uploading);
      const res = await fetch('/api/store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ compressedData: compressString(enc), ttl: expiration }) });
      if (!res.ok) throw new Error(await res.text() || `API Error:${res.status}`);
      const { id } = await res.json();
      const url = `${location.origin}${location.pathname}#${id}!${base64Key}`;
      const raw = `${location.origin}/api/raw/${id}?key=${base64Key}`;
      setShareUrl(url); setRawUrl(raw);
      await copyUrl(url);
    } catch (e) { onErr(e); } finally { setState(LoadingState.Idle); }
  }, [isCreating, input, expiration, copyUrl, onErr, setDecrypted]);

  // 读取逻辑 (readClip function)
  const readClip = useCallback(async (hash: string) => {
    const [id, b64] = hash.split('!');
    if (!id || !b64) return onErr(new Error('URL 格式错误'));
    
    setShareUrl(''); 
    setRawUrl('');   
    abortRef.current?.abort();
    const c = new AbortController(); abortRef.current = c;
    try {
      setState(LoadingState.Fetching);
      const res = await fetch(`/api/get?id=${encodeURIComponent(id)}`, { signal: c.signal });

      if (res.status === 404) {
        setIsNotFound(true);
        return;
      }
      if (!res.ok) {
        throw new Error(await res.text() || `API Error:${res.status}`);
      }

      const { compressedData } = await res.json();
      setState(LoadingState.Decompressing);
      const dec = decompressString(compressedData);
      if (dec === null) throw new Error('解压失败');
      setState(LoadingState.Decrypting);
      const txt = await decryptData(dec, b64);
      startTransition(() => {
        setDecrypted(txt);
      });
      if (localKeyRef.current) {
        const localEnc = await encryptData(txt, localKeyRef.current);
        await saveViewedClip({ id, encryptedData: localEnc, timestamp: Date.now() });
      }
    } catch (e) {
      onErr(e);
    } finally {
      setState(LoadingState.Idle);
      abortRef.current = null;
    }
  }, [onErr, startTransition, setShareUrl, setRawUrl, setIsNotFound]);

  const reset = () => {
    setInput('');
    setShareUrl('');
    setRawUrl('');
    setDecrypted(null);
    setError(null);
    setState(LoadingState.Idle);
    setShowRaw(false);
    setIsNotFound(false);
    history.replaceState(null, '', location.pathname + location.search);
  };
  
  return {
    input, setInput,
    shareUrl, rawUrl,
    state, setState,
    decrypted, setDecrypted,
    error, setError,
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
    reset,
    onErr
  };
}