// app/api/store/route.ts
import { type NextRequest } from 'next/server';
import {
  upstashFetch, json, isLocalMode,
  localRedisSet
} from '../_utils/upstash';

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 小时
const MAX_NON_PERMANENT_TTL_SECONDS = 60 * 60 * 24 * 30; // 非永久 TTL 的最大值（30 天）

export async function POST(req: NextRequest) {
  let compressedData: string | undefined;
  // ttlSeconds 为 null 表示永久存储
  let ttlSeconds: number | null = DEFAULT_TTL_SECONDS;

  try {
    const body = (await req.json()) as {
      compressedData?: unknown;
      ttl?: unknown;
    };
    if (typeof body.compressedData === 'string') {
      compressedData = body.compressedData;
    } else {
      return json({ error: 'compressedData 必须是字符串' }, 400);
    }

    if (typeof body.ttl === 'number') {
      if (body.ttl === -1) { // -1 表示永久
        ttlSeconds = null;
      } else if (body.ttl > 0) {
        // 强制应用非永久 TTL 的上限
        ttlSeconds = Math.min(body.ttl, MAX_NON_PERMANENT_TTL_SECONDS);
      }
    }

  } catch {
    return json({ error: '无效的 JSON body' }, 400);
  }

  // 根据 TTL 动态确定最大压缩后体积限制
  let currentMaxCompressedSizeBytes: number;
  const sevenDaysInSeconds = 60 * 60 * 24 * 7;
  // 永久或长于7天的，限制压缩后约 0.6MB
  const longTermCompressedLimitBytes = 0.6 * 1024 * 1024;
  // 7天及以内的，限制压缩后 2MB
  const defaultCompressedLimitBytes = 2 * 1024 * 1024;

  if (ttlSeconds === null || (ttlSeconds !== null && ttlSeconds > sevenDaysInSeconds)) {
    // 永久 或 TTL > 7 天
    currentMaxCompressedSizeBytes = longTermCompressedLimitBytes;
  } else {
    // TTL <= 7 天
    currentMaxCompressedSizeBytes = defaultCompressedLimitBytes;
  }

  // 服务器端体积检查（使用动态限制）
  const compressedSizeBytes = Buffer.byteLength(compressedData!, 'utf8'); // compressedData 必有值，否则前面已返回

  if (compressedSizeBytes > currentMaxCompressedSizeBytes) {
    const limitMB = (currentMaxCompressedSizeBytes / (1024 * 1024)).toFixed(2);
    return json(
      {
        error: `请求体过大。收到 ${(compressedSizeBytes / (1024 * 1024)).toFixed(2)} MB，当前过期时间设置下，压缩后数据限制为 ${limitMB} MB.`
      },
      413 // 413 Payload Too Large
    );
  }

  const { nanoid } = await import('nanoid');
  const id = nanoid(10);
  const useLocalRedis = isLocalMode(); // 检查模式

  try {
    let result: 'OK';
    if (useLocalRedis) {
      // 本地模式：调用 localRedisSet
      result = await localRedisSet(id, JSON.stringify(compressedData!), ttlSeconds);
    } else {
      // Upstash 模式：调用 upstashFetch (需要保留 URL 中的 TTL)
      let upstashEndpoint = `set/${id}`; 
      // 仅当 ttlSeconds 是正数时添加 EX 参数 (Upstash REST API 方式)
      if (ttlSeconds !== null && ttlSeconds > 0) {
        upstashEndpoint += `?EX=${ttlSeconds}`;
      }
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compressedData!) // Upstash 需要 JSON 字符串化的数据
      };
      const upstashResponse = await upstashFetch<{ result: 'OK' }>(
        upstashEndpoint,
        fetchOptions
      );
      result = upstashResponse.result;
    }

    if (result !== 'OK') {
      throw new Error(`存储数据失败，未预期的结果: ${result}`);
    }
    return json({ id });

  } catch (e) {
    console.error('POST 路由错误:', e);
    return json({ error: `存储数据失败: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }
}
