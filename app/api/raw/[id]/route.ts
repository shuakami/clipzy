import { NextResponse, NextRequest } from 'next/server';
import {
  upstashFetch,
  isLocalMode,
  localRedisGet,
  NotFoundError,
  UpstashNotFoundError,
  handleOptions as handleCorsOptions,
  getCorsHeaders
} from '../../_utils/upstash';
import { decompressString, decryptData } from '@/lib/crypto';

interface ApiContext {
  params: {
    id: string;
  }
}

function createTextResponse(body: string, status: number, origin: string | null): Response {
  const corsHeaders = getCorsHeaders(origin);
  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  if (status === 200) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Surrogate-Control', 'no-store');
  }
  return new Response(body, { status, headers });
}

export async function GET(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse | Response> {
  const origin = request.headers.get('origin');
  const { id } = context.params;
  const { searchParams } = new URL(request.url);
  const base64Key = searchParams.get('key');

  if (!id) {
    return createTextResponse('Missing ID parameter', 400, origin);
  }
  if (!base64Key) {
    return createTextResponse('Missing key parameter', 400, origin);
  }

  const useLocalRedis = isLocalMode();

  try {
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

    const decompressed = decompressString(finalCompressedData);
    if (decompressed === null) {
      console.error(`Decompression failed for ID: ${id}`);
      return createTextResponse('Failed to decompress data.', 500, origin);
    }

    let decrypted: string;
    try {
      decrypted = await decryptData(decompressed, base64Key);
    } catch (decryptError) {
      console.error(`Decryption failed for ID: ${id}`, decryptError);
      return createTextResponse('Failed to decrypt data. Invalid key?', 403, origin);
    }

    return createTextResponse(decrypted, 200, origin);

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof UpstashNotFoundError) {
      return createTextResponse('Content not found or expired.', 404, origin);
    }
    console.error(`Error processing raw request for ID: ${id}`, error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createTextResponse(`Server error: ${message}`, 500, origin);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}
