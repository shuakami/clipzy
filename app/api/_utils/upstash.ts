// app/api/_utils/upstash.ts
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

/** 环境参数校验 & 暴露 (Upstash) */
export function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  // 如果是本地模式，不强制要求 Upstash 配置
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

  console.log(`[Upstash Fetch] URL: ${url}`);
  console.log(`[Upstash Fetch] Token Present: ${!!token}, Length: ${token?.length ?? 0}`);

  const res = await fetch(`${url}/${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    // Upstash 404 说明 key 不存在
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

/** 获取本地 Redis 客户端实例 (单例) */
function getLocalRedisClient(): Redis {
  if (!localRedisClient) {
    const redisUrl = process.env.LOCAL_REDIS_URL || 'redis://localhost:6379';
    console.log(`[Local Redis] Connecting to: ${redisUrl}`);
    localRedisClient = new Redis(redisUrl, {
      // 重试
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    // 连接错误
    localRedisClient.on('error', (error: Error) => {
      console.error("[Local Redis] Connection Error:", error);
      if (localRedisClient) {
        localRedisClient.disconnect(); // 连接错误时断开连接
        localRedisClient = null;
      }
    });

    // 连接成功
    localRedisClient.on('connect', () => {
        console.log("[Local Redis] Connected successfully.");
    });

  }
  return localRedisClient;
}

/** 本地 Redis Set 操作 */
export async function localRedisSet(id: string, value: string, ttlSeconds: number | null): Promise<'OK'> {
  const client = getLocalRedisClient();
  try {
    if (ttlSeconds !== null && ttlSeconds > 0) {
      return await client.set(id, value, 'EX', ttlSeconds);
    } else {
      // ttlSeconds 为 null 表示永久
      return await client.set(id, value);
    }
  } catch (error) {
    console.error(`[Local Redis] SET error for key ${id}:`, error);
    throw new Error(`Local Redis SET failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** 本地 Redis Get 操作 */
export async function localRedisGet(id: string): Promise<string | null> {
  const client = getLocalRedisClient();
  try {
    const result = await client.get(id);
    // 如果 key 不存在，ioredis 的 get 返回 null
    return result;
  } catch (error) {
    console.error(`[Local Redis] GET error for key ${id}:`, error);
    throw new Error(`Local Redis GET failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** 检查是否处于本地部署模式 */
export function isLocalMode(): boolean {
  return process.env.DEPLOYMENT_MODE === 'local';
}

/** 统一 Response 帮助函数 */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** 自定义错误：数据未找到 (可用于 Upstash 或 Redis) */
export class NotFoundError extends Error {
  constructor(message = 'Data not found or expired') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// 保留 UpstashNotFoundError 并使其继承 NotFoundError (可选)
export class UpstashNotFoundError extends NotFoundError {
  constructor() {
    super('Upstash data not found or expired'); // 更具体的消息
    this.name = 'UpstashNotFoundError';
  }
}
