import { logInfo as _ulogInfo } from '@/lib/logging/core'
/**
 * localized text API
 * localized text，localized text AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logUserAction } from '@/lib/logging/semantic'
import { detectEpisodeMarkers, splitByMarkers } from '@/lib/episode-marker-detector'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

export const POST = apiHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) => {
    _ulogInfo('[Split-By-Markers API] ========== localized text ==========')

    const { projectId } = await params

    // 🔐 localized text
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult
    const session = authResult.session

    const userId = session.user.id
    const username = session.user.name || session.user.email || 'unknown'
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
        throw new ApiError('INVALID_PARAMS')
    }

    if (content.length < 100) {
        throw new ApiError('INVALID_PARAMS')
    }

    // localized text
    const project = await prisma.novelPromotionProject.findFirst({
        where: { projectId },
        include: { project: true }
    })

    if (!project) {
        throw new ApiError('NOT_FOUND')
    }

    const projectName = project.project?.name || projectId

    // localized text
    const markerResult = detectEpisodeMarkers(content)

    if (!markerResult.hasMarkers || markerResult.matches.length < 2) {
        throw new ApiError('INVALID_PARAMS')
    }

    // localized text
    const episodes = splitByMarkers(content, markerResult)

    // localized text
    logUserAction(
        'EPISODE_SPLIT_BY_MARKERS',
        userId,
        username,
        `localized text - ${episodes.length}  episode，localized text: ${markerResult.markerType}`,
        {
            markerType: markerResult.markerType,
            confidence: markerResult.confidence,
            episodeCount: episodes.length,
            totalWords: episodes.reduce((sum, ep) => sum + ep.wordCount, 0)
        },
        projectId,
        projectName
    )

    return NextResponse.json({
        success: true,
        method: 'markers',
        markerType: markerResult.markerType,
        episodes
    })
})
