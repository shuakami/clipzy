// app/api/store/route.ts
import { type NextRequest } from 'next/server';
import { upstashFetch, json } from '../_utils/upstash';

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 小时
const MAX_NON_PERMANENT_TTL_SECONDS = 60 * 60 * 24 * 30; // 非永久 TTL 的最大值（30 天）

interface UpstashSetResponse {
  result: 'OK';
}

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

  try {
    // 构建 Upstash 请求
    let upstashEndpoint = `set/${id}`; // 基础命令
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compressedData) // 将压缩数据作为 JSON 字符串存储
    };

    // 仅当 ttlSeconds 是正数时添加 EX 参数
    if (ttlSeconds !== null && ttlSeconds > 0) {
      upstashEndpoint += `?EX=${ttlSeconds}`;
    }

    const { result } = await upstashFetch<UpstashSetResponse>(
      upstashEndpoint,
      fetchOptions
    );

    if (result !== 'OK') {
      throw new Error(`未预期的 Upstash 结果: ${result}`);
    }
    return json({ id });
  } catch (e) {
    console.error('POST 路由错误:', e);
    return json({ error: '存储数据失败' }, 500);
  }
}
