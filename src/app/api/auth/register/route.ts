import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { logAuthAction } from '@/lib/logging/semantic'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp, AUTH_REGISTER_LIMIT } from '@/lib/rate-limit'

export const POST = apiHandler(async (request: NextRequest) => {
  // 🛡️ IP localized text
  const ip = getClientIp(request)
  const rateResult = await checkRateLimit('auth:register', ip, AUTH_REGISTER_LIMIT)
  if (rateResult.limited) {
    logAuthAction('REGISTER', 'unknown', { error: 'Rate limited', ip })
    return NextResponse.json(
      { success: false, message: `localized text，localized text ${rateResult.retryAfterSeconds} localized text` },
      {
        status: 429,
        headers: { 'Retry-After': String(rateResult.retryAfterSeconds) },
      },
    )
  }

  let name = 'unknown'
  const body = await request.json()
  name = body.name || 'unknown'
  const { password } = body

  // localized text
  if (!name || !password) {
    logAuthAction('REGISTER', name, { error: 'Missing credentials' })
    throw new ApiError('INVALID_PARAMS')
  }

  if (password.length < 6) {
    logAuthAction('REGISTER', name, { error: 'Password too short' })
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const existingUser = await prisma.user.findUnique({
    where: { name }
  })

  if (existingUser) {
    logAuthAction('REGISTER', name, { error: 'Phone number already exists' })
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const hashedPassword = await bcrypt.hash(password, 12)

  // localized text（localized text）
  const user = await prisma.$transaction(async (tx) => {
    // localized text
    const newUser = await tx.user.create({
      data: {
        name,
        password: hashedPassword
      }
    })

    // 💰 localized text（localized text0）
    await tx.userBalance.create({
      data: {
        userId: newUser.id,
        balance: 0,
        frozenAmount: 0,
        totalSpent: 0
      }
    })

    return newUser
  })

  logAuthAction('REGISTER', name, { userId: user.id, success: true })

  return NextResponse.json(
    {
      message: "localized text",
      user: {
        id: user.id,
        name: user.name
      }
    },
    { status: 201 }
  )
})
