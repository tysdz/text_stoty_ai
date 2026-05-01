import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * PUT /api/novel-promotion/[projectId]/photography-plan
 * localized text
 */
export const PUT = apiHandler(async (
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await context.params

    // 🔐 localized text
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult

    const body = await request.json()
    const { storyboardId, photographyPlan } = body

    if (!storyboardId) {
        throw new ApiError('INVALID_PARAMS')
    }

    // localized text storyboard localized text
    const storyboard = await prisma.novelPromotionStoryboard.findUnique({
        where: { id: storyboardId }
    })

    if (!storyboard) {
        throw new ApiError('NOT_FOUND')
    }

    // localized text
    const photographyPlanJson = photographyPlan ? JSON.stringify(photographyPlan) : null

    await prisma.novelPromotionStoryboard.update({
        where: { id: storyboardId },
        data: { photographyPlan: photographyPlanJson }
    })

    _ulogInfo('[PUT /photography-plan] localized text, storyboardId:', storyboardId)

    return NextResponse.json({ success: true })
})
