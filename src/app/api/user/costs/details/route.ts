import { NextRequest, NextResponse } from 'next/server'
import { getUserCostDetails } from '@/lib/billing'
import { BILLING_CURRENCY } from '@/lib/billing/currency'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'

/**
 * GET /api/user/costs/details
 * localized text（localized text）
 */
export const GET = apiHandler(async (request: NextRequest) => {
    // 🔐 localized text
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getUserCostDetails(session.user.id, page, pageSize)

    return NextResponse.json({
        success: true,
        currency: BILLING_CURRENCY,
        ...result
    })
})
