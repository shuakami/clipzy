import { NextResponse, NextRequest } from 'next/server';
import {
  upstashFetch,
  UpstashNotFoundError,
} from '../../_utils/upstash';
import { decompressString, decryptData } from '@/lib/crypto';

interface UpstashGetResponse {
  result: string | null;
}

interface ApiContext {
  params: {
    id: string;
  }
}

export async function GET(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse | Response> {
  const { id } = context.params;
  const { searchParams } = new URL(request.url);
  const base64Key = searchParams.get('key');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
  }
  if (!base64Key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  try {
    // 1. 使用 upstashFetch 从 Upstash 获取数据，并使用本地定义的类型
    const { result } = await upstashFetch<UpstashGetResponse>(`get/${id}`);

    if (result === null) {
      throw new UpstashNotFoundError();
    }

    // Upstash 将 value 当作 JSON 字符串存储，这里需要反序列化
    let compressedData: string;
    try {
      const parsedResult = JSON.parse(result);
      if (typeof parsedResult !== 'string') {
        throw new Error('Parsed data is not a string');
      }
      compressedData = parsedResult;
    } catch (e) {
      console.error(`Malformed data in storage for ID: ${id}`, e);
      return new Response(`Malformed data in storage - ${e instanceof Error ? e.message : String(e)}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }

    // 2. 解压缩
    const decompressed = decompressString(compressedData);
    if (decompressed === null) {
      console.error(`Decompression failed for ID: ${id}`);
      return new Response('Failed to decompress data.', { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }

    // 3. 解密
    let decrypted: string;
    try {
      decrypted = await decryptData(decompressed, base64Key);
    } catch (decryptError) {
      console.error(`Decryption failed for ID: ${id}`, decryptError);
      return new Response('Failed to decrypt data. Invalid key?', { status: 400, headers: { 'Content-Type': 'text/plain' } });
    }

    // 4. 返回纯文本
    return new Response(decrypted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });

  } catch (error) {
    if (error instanceof UpstashNotFoundError) {
        return new Response('Content not found or expired.', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    }
    console.error(`Error processing raw request for ID: ${id}`, error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(`Server error: ${message}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}

// 添加 OPTIONS 方法以支持 CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}