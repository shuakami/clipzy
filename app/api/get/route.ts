// app/api/get/route.ts
import { type NextRequest } from 'next/server';
import {
  upstashFetch,
  json,
  isLocalMode,
  localRedisGet,
  NotFoundError,
  UpstashNotFoundError,
  handleOptions
} from '../_utils/upstash';

// Upstash GET 返回格式
interface UpstashGetResponse {
  result: string | null;
}

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return json({ error: 'Missing ID parameter' }, 400, req);

  const useLocalRedis = isLocalMode();

  try {
    let compressedData: string | null;
    if (useLocalRedis) {
      compressedData = await localRedisGet(id);
      if (compressedData === null) {
        throw new NotFoundError(`Data not found in local Redis for ID: ${id}`);
      }
    } else {
      const { result } = await upstashFetch<UpstashGetResponse>(`get/${id}`);
      if (result === null) {
        throw new UpstashNotFoundError();
      }
      compressedData = result;
    }

    let finalCompressedData: string;
    if (!useLocalRedis && typeof compressedData === 'string') {
      try {
        const parsed = JSON.parse(compressedData);
        if (typeof parsed !== 'string') throw new Error('Parsed data is not a string');
        finalCompressedData = parsed;
      } catch (parseError) {
        console.error(`Failed to parse Upstash response for ID ${id}:`, compressedData, parseError);
        throw new Error('Invalid data format received from storage.');
      }
    } else if (useLocalRedis && typeof compressedData === 'string') {
      finalCompressedData = compressedData;
    } else {
      throw new Error('Unexpected compressed data type or null');
    }

    return json({ compressedData: finalCompressedData }, 200, req);
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof UpstashNotFoundError) {
      return json({ error: 'Data not found or expired' }, 404, req);
    }
    console.error('GET route error:', e);
    return json({ error: `Failed to get data: ${e instanceof Error ? e.message : String(e)}` }, 500, req);
  }
}
