import * as LZString from 'lz-string';

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** ArrayBuffer → Base64 */
export const bufferToBase64 = (buffer: ArrayBuffer): string => {
  // 分块转换避免 apply 限制
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let str = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    str += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(str);
};

/** Base64 → ArrayBuffer */
export const base64ToBuffer = (b64: string): ArrayBuffer =>
  Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

/** 生成 AES-GCM 密钥，并导出为 Base64 */
export async function generateKey(): Promise<{ key: CryptoKey; base64Key: string }> {
  const key = await crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  const base64Key = bufferToBase64(raw);
  return { key, base64Key };
}

/**
 * 从 Base64 字符串导入 CryptoKey
 * @param base64Key Base64 格式的原始密钥
 * @param keyUsages 允许的密钥用途，例如 ['encrypt', 'decrypt']
 * @returns Promise<CryptoKey>
 */
export async function getKeyFromBase64(base64Key: string, keyUsages: KeyUsage[]): Promise<CryptoKey> {
  const keyBuf = base64ToBuffer(base64Key);
  return crypto.subtle.importKey(
    'raw',      // 导入原始字节
    keyBuf,     // 包含密钥字节的 ArrayBuffer
    { name: ALGO }, // 指定算法 (与生成时一致)
    true,       // 是否可导出 (通常设为 true)
    keyUsages   // 允许的密钥用途
  );
}

/** 加密 */
export async function encryptData(plain: string, key: CryptoKey): Promise<string> {
  const data = encoder.encode(plain);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const cipher = await crypto.subtle.encrypt({ name: ALGO, iv }, key, data);
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.byteLength);
  return bufferToBase64(combined.buffer);
}

/** 解密 */
export async function decryptData(
  cipherBase64: string,
  base64Key: string
): Promise<string> {
  // 复用新函数来导入密钥
  const key = await getKeyFromBase64(base64Key, ['decrypt']);
  const combined = new Uint8Array(base64ToBuffer(cipherBase64));
  const iv = combined.subarray(0, IV_LENGTH);
  const data = combined.subarray(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    data
  );
  return decoder.decode(decrypted);
}

/**
 * 解密 (使用已导入的 CryptoKey 对象)
 * @param cipherBase64 Base64 编码的密文 (包含 IV)
 * @param key 用于解密的 CryptoKey 对象
 * @returns Promise<string>
 */
export async function decryptDataWithKey(cipherBase64: string, key: CryptoKey): Promise<string> {
  const combined = new Uint8Array(base64ToBuffer(cipherBase64));
  const iv = combined.subarray(0, IV_LENGTH);
  const data = combined.subarray(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    data
  );
  return decoder.decode(decrypted);
}

/** LZ-String 压缩 / 解压 */
export const compressString = (input: string): string =>
  LZString.compressToBase64(input);
export const decompressString = (input: string): string | null =>
  LZString.decompressFromBase64(input);
