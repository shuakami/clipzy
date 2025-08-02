// app/api/_utils/upstash.ts
import { NextResponse, NextRequest } from 'next/server';
import Redis from 'ioredis';

const allowedOrigins = [
  'http://localhost:3000',
  'https://api.uapis.cn',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  const uapisRegex = /^https?:\/\/[a-zA-Z0-9-]+\.uapis\.cn$/;
  return uapisRegex.test(origin);
}

export function getCorsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin!;
  }
  return headers;
}

export function handleOptions(req: NextRequest): NextResponse {
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers });
}

/** 环境参数校验 & 暴露 (Upstash) */
export function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (isLocalMode()) {
    return { url: null, token: null }; 
  }
  if (!url || !token) throw new Error('Upstash Redis credentials are missing (and not in local mode)');
  return { url, token };
}

/** 根据 Upstash REST API 规则发起请求并解析 JSON */
export async function upstashFetch<T>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const { url, token } = getUpstashConfig();
  if (!url || !token) {
    throw new Error('Upstash config unavailable in upstashFetch');
  }

  const res = await fetch(`${url}/${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new UpstashNotFoundError();
    }
    throw new Error(
      `Upstash request failed (${res.status}) – ${await res.text()}`
    );
  }

  return (await res.json()) as T;
}

let localRedisClient: Redis | null = null;

function getLocalRedisClient(): Redis {
  if (!localRedisClient) {
    const redisUrl = process.env.LOCAL_REDIS_URL || 'redis://localhost:6379';
    localRedisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });
    localRedisClient.on('error', (error: Error) => {
      console.error("[Local Redis] Connection Error:", error);
      if (localRedisClient) {
        localRedisClient.disconnect();
        localRedisClient = null;
      }
    });
    localRedisClient.on('connect', () => {
        console.log("[Local Redis] Connected successfully.");
    });
  }
  return localRedisClient;
}

export async function localRedisSet(id: string, value: string, ttlSeconds: number | null): Promise<'OK'> {
  const client = getLocalRedisClient();
  try {
    if (ttlSeconds !== null && ttlSeconds > 0) {
      return await client.set(id, value, 'EX', ttlSeconds);
    } else {
      return await client.set(id, value);
    }
  } catch (error) {
    console.error(`[Local Redis] SET error for key ${id}:`, error);
    throw new Error(`Local Redis SET failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function localRedisGet(id: string): Promise<string | null> {
  const client = getLocalRedisClient();
  try {
    return await client.get(id);
  } catch (error) {
    console.error(`[Local Redis] GET error for key ${id}:`, error);
    throw new Error(`Local Redis GET failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function isLocalMode(): boolean {
  return process.env.DEPLOYMENT_MODE === 'local';
}

export function json(data: unknown, status = 200, req?: NextRequest) {
  const origin = req ? req.headers.get('origin') : null;
  const headers = getCorsHeaders(origin);
  return NextResponse.json(data, { status, headers });
}

export class NotFoundError extends Error {
  constructor(message = 'Data not found or expired') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UpstashNotFoundError extends NotFoundError {
  constructor() {
    super('Upstash data not found or expired');
    this.name = 'UpstashNotFoundError';
  }
}
