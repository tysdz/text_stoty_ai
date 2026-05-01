/**
 * 🛡️ IP localized text
 *
 * localized text Redis localized text，localized text/localized text。
 * localized text (action, ip) localized text。localized text。
 */

import { redis } from '@/lib/redis'
import { NextRequest } from 'next/server'

// ============================================================
// localized text
// ============================================================

export interface RateLimitConfig {
    /** localized text（localized text） */
    windowSeconds: number
    /** localized text */
    maxRequests: number
}

export interface RateLimitResult {
    /** localized text */
    limited: boolean
    /** localized text */
    remaining: number
    /** localized text（localized text，localized text limited=true localized text） */
    retryAfterSeconds: number
}

// ============================================================
// localized text
// ============================================================

/** sign in：60 localized text 5 localized text */
export const AUTH_LOGIN_LIMIT: RateLimitConfig = {
    windowSeconds: 60,
    maxRequests: 5,
}

/** sign up：60 localized text 3 localized text */
export const AUTH_REGISTER_LIMIT: RateLimitConfig = {
    windowSeconds: 60,
    maxRequests: 3,
}

// ============================================================
// localized text
// ============================================================

/**
 * localized text。
 *
 * @param action  localized text（localized text "auth:login"），localized text Redis key
 * @param ip      localized text IP
 * @param config  localized text
 */
export async function checkRateLimit(
    action: string,
    ip: string,
    config: RateLimitConfig,
): Promise<RateLimitResult> {
    const key = `rate_limit:${action}:${ip}`
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000

    // Lua localized text：localized text、localized text、localized text
    const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowMs = tonumber(ARGV[2])
    local maxRequests = tonumber(ARGV[3])
    local expireSeconds = tonumber(ARGV[4])

    -- localized text
    redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)

    -- localized text
    local count = redis.call('ZCARD', key)

    if count < maxRequests then
      -- localized text，localized text
      redis.call('ZADD', key, now, now .. ':' .. math.random(100000))
      redis.call('EXPIRE', key, expireSeconds)
      return { 0, maxRequests - count - 1, 0 }
    else
      -- localized text，localized text
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local retryAfterMs = 0
      if #oldest >= 2 then
        retryAfterMs = tonumber(oldest[2]) + windowMs - now
        if retryAfterMs < 0 then retryAfterMs = 0 end
      end
      return { 1, 0, retryAfterMs }
    end
  `

    try {
        const result = await (redis as ReturnType<typeof redis.duplicate>).eval(
            luaScript,
            1,
            key,
            now,
            windowMs,
            config.maxRequests,
            config.windowSeconds + 10, // TTL localized text
        ) as [number, number, number]

        return {
            limited: result[0] === 1,
            remaining: result[1],
            retryAfterSeconds: Math.ceil(result[2] / 1000),
        }
    } catch {
        // Redis localized text，localized text Redis localized text
        return { limited: false, remaining: config.maxRequests, retryAfterSeconds: 0 }
    }
}

// ============================================================
// localized text：localized text IP
// ============================================================

/**
 * localized text NextRequest localized text IP。
 * localized text，localized text 127.0.0.1。
 */
export function getClientIp(req: NextRequest): string {
    // x-forwarded-for localized text IP（localized text），localized text
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim()
        if (first) return first
    }

    const realIp = req.headers.get('x-real-ip')
    if (realIp) return realIp.trim()

    // Next.js 14+ localized text ip localized text
    if ('ip' in req && typeof (req as NextRequest & { ip?: string }).ip === 'string') {
        return (req as NextRequest & { ip?: string }).ip!
    }

    return '127.0.0.1'
}
