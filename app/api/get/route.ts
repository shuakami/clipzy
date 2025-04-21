// app/api/get/route.ts
import { type NextRequest } from 'next/server';
import {
  upstashFetch,
  json,
  UpstashNotFoundError
} from '../_utils/upstash';

// Upstash GET 返回格式
interface UpstashGetResponse {
  result: string | null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return json({ error: 'Missing id query parameter' }, 400);

  try {
    const { result } = await upstashFetch<UpstashGetResponse>(`get/${id}`);

    if (result === null) throw new UpstashNotFoundError();

    // Upstash 将 value 当作 JSON 字符串存储，这里需要两次反序列化
    let compressedData: unknown;
    try {
      compressedData = JSON.parse(result);
      if (typeof compressedData !== 'string') {
        throw new Error('Parsed data is not a string');
      }
    } catch (e) {
      throw new Error(`Malformed data in storage – ${e}`);
    }

    return json({ compressedData });
  } catch (e) {
    if (e instanceof UpstashNotFoundError) {
      return json({ error: e.message }, 404);
    }
    console.error('GET route error:', e);
    return json({ error: 'Failed to retrieve data' }, 500);
  }
}
