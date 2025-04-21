// app/api/store/route.ts
import { type NextRequest } from 'next/server';
import { upstashFetch, json } from '../_utils/upstash';

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour
const MAX_TTL_SECONDS = 60 * 60 * 24; // 1 day (86400 seconds)

interface UpstashSetResponse {
  result: 'OK';
}

export async function POST(req: NextRequest) {
  let compressedData: string | undefined;
  let ttlSeconds = DEFAULT_TTL_SECONDS;

  try {
    const body = (await req.json()) as {
      compressedData?: unknown;
      ttl?: unknown;
    };
    if (typeof body.compressedData === 'string') {
      compressedData = body.compressedData;
    } else {
      return json({ error: 'compressedData must be a string' }, 400);
    }
    if (typeof body.ttl === 'number' && body.ttl > 0) {
      ttlSeconds = Math.min(body.ttl, MAX_TTL_SECONDS);
    }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // 服务器端检查压缩后数据大小
  const MAX_COMPRESSED_SIZE_BYTES = 5.5 * 1024 * 1024; // 5.5 MB
  const compressedSizeBytes = Buffer.byteLength(compressedData, 'utf8'); // 使用 Buffer.byteLength 获取字节数

  if (compressedSizeBytes > MAX_COMPRESSED_SIZE_BYTES) {
    return json(
      {
        error: `Payload too large. Received ${(compressedSizeBytes / (1024 * 1024)).toFixed(2)} MB, limit is 5.50 MB.`
      },
      413 // 413 Payload Too Large
    );
  }

  // 动态 import，只有第一次写入时才加载 nanoid
  const { nanoid } = await import('nanoid');
  const id = nanoid(10);

  try {
    const { result } = await upstashFetch<UpstashSetResponse>(
      `set/${id}?EX=${ttlSeconds}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compressedData)
      }
    );

    if (result !== 'OK') {
      throw new Error(`Unexpected Upstash result: ${result}`);
    }
    return json({ id });
  } catch (e) {
    console.error('POST route error:', e);
    return json({ error: 'Failed to store data' }, 500);
  }
}
