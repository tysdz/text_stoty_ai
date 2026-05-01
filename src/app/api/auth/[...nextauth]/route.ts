import NextAuth from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { checkRateLimit, getClientIp, AUTH_LOGIN_LIMIT } from '@/lib/rate-limit'
import { logAuthAction } from '@/lib/logging/semantic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextAuthHandler = (NextAuth as any)(authOptions)

/**
 * sign in POST localized text IP localized text。
 * localized text callback/credentials（localized text）localized text，
 * localized text NextAuth localized text（session / csrf localized text）localized text。
 *
 * ⚠️ NextAuth localized text signIn() localized text { url } localized text，
 *    localized text JSON localized text signIn() localized text new URL(data.url) localized text。
 *    localized text NextAuth localized text：{ url: "...?error=RateLimited" }
 */
async function handlePost(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
    const { nextauth: segments } = await ctx.params
    const isCredentialsCallback =
        segments.length >= 2
        && segments[0] === 'callback'
        && segments[1] === 'credentials'

    if (isCredentialsCallback) {
        const ip = getClientIp(req)
        const rateResult = await checkRateLimit('auth:login', ip, AUTH_LOGIN_LIMIT)
        if (rateResult.limited) {
            logAuthAction('LOGIN', 'unknown', { error: 'Rate limited', ip })
            // back NextAuth localized text，signIn() localized text URL localized text error localized text
            const origin = req.nextUrl.origin
            return NextResponse.json(
                { url: `${origin}/auth/signin?error=RateLimited` },
                {
                    status: 429,
                    headers: { 'Retry-After': String(rateResult.retryAfterSeconds) },
                },
            )
        }
    }

    return nextAuthHandler(req, ctx)
}

function handleGet(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
    return nextAuthHandler(req, ctx)
}

export { handleGet as GET, handlePost as POST }
