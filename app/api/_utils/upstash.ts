// app/api/_utils/upstash.ts
import { NextResponse } from 'next/server';

/** 环境参数校验 & 暴露 */
export function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Upstash Redis credentials are missing');
  return { url, token };
}

/** 根据 Upstash REST API 规则发起请求并解析 JSON */
export async function upstashFetch<T>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const { url, token } = getUpstashConfig();

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

/** 统一 Response 帮助函数 */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** 自定义错误：Redis key 不存在 / 过期 */
export class UpstashNotFoundError extends Error {
  constructor() {
    super('Data not found or expired');
    this.name = 'UpstashNotFoundError';
  }
}
