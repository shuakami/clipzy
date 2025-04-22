import { NextResponse, NextRequest } from 'next/server';
import {
  upstashFetch,
  isLocalMode,
  localRedisGet,
  NotFoundError,
  UpstashNotFoundError
} from '../../_utils/upstash';
import { decompressString, decryptData } from '@/lib/crypto';

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
    return new Response('Missing ID parameter', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }
  if (!base64Key) {
    return new Response('Missing key parameter', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const useLocalRedis = isLocalMode();

  try {
    // 1. 根据模式获取压缩数据
    let compressedDataResult: string | null;
    if (useLocalRedis) {
      compressedDataResult = await localRedisGet(id);
      if (compressedDataResult === null) {
        throw new NotFoundError(`Data not found in local Redis for ID: ${id}`);
      }
    } else {
      const { result } = await upstashFetch<{ result: string | null }>(`get/${id}`);
      if (result === null) {
        throw new UpstashNotFoundError();
      }
      compressedDataResult = result;
    }

    // 2. 处理获取到的数据 (Upstash 需要解析 JSON)
    let finalCompressedData: string;
    if (!useLocalRedis && typeof compressedDataResult === 'string') {
      try {
        const parsed = JSON.parse(compressedDataResult);
        if (typeof parsed !== 'string') throw new Error('Parsed data is not a string');
        finalCompressedData = parsed;
      } catch (parseError) {
        console.error(`Failed to parse Upstash response for ID ${id}:`, compressedDataResult, parseError);
        throw new Error('Invalid data format received from storage.');
      }
    } else if (useLocalRedis && typeof compressedDataResult === 'string'){
      finalCompressedData = compressedDataResult;
    } else {
      throw new Error('Unexpected compressed data type or null after fetch');
    }

    // 3. 解压缩 (使用 finalCompressedData)
    const decompressed = decompressString(finalCompressedData);
    if (decompressed === null) {
      console.error(`Decompression failed for ID: ${id}`);
      return new Response('Failed to decompress data.', { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }

    // 4. 解密 (使用 decompressed)
    let decrypted: string;
    try {
      decrypted = await decryptData(decompressed, base64Key);
    } catch (decryptError) {
      console.error(`Decryption failed for ID: ${id}`, decryptError);
      // 密钥错误返回 403 Forbidden 可能更合适
      return new Response('Failed to decrypt data. Invalid key?', { status: 403, headers: { 'Content-Type': 'text/plain' } });
    }

    // 5. 返回纯文本
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
    if (error instanceof NotFoundError || error instanceof UpstashNotFoundError) {
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