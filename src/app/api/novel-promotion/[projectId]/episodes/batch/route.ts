/**
 * localized text API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

interface BatchEpisode {
    name: string
    description?: string
    novelText: string
}

export const POST = apiHandler(async (
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await params

    // 🔐 localized text
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult
    const { episodes, clearExisting = false, importStatus } = await request.json()

    if (!episodes || !Array.isArray(episodes)) {
        throw new ApiError('INVALID_PARAMS')
    }

    // localized text
    const project = await prisma.novelPromotionProject.findFirst({
        where: { projectId }
    })

    if (!project) {
        throw new ApiError('NOT_FOUND')
    }

    // localized text
    if (clearExisting) {
        await prisma.novelPromotionEpisode.deleteMany({
            where: { novelPromotionProjectId: project.id }
        })
    }

    // localized text，localized text importStatus
    if (episodes.length === 0) {
        if (importStatus) {
            await prisma.novelPromotionProject.update({
                where: { id: project.id },
                data: { importStatus }
            })
        }
        return NextResponse.json({
            success: true,
            episodes: [],
            message: 'localized text'
        })
    }

    // localized text
    const lastEpisode = await prisma.novelPromotionEpisode.findFirst({
        where: { novelPromotionProjectId: project.id },
        orderBy: { episodeNumber: 'desc' }
    })

    const startNumber = clearExisting ? 1 : (lastEpisode?.episodeNumber || 0) + 1

    // localized text
    const createdEpisodes = await prisma.$transaction(
        (episodes as BatchEpisode[]).map((ep, idx) =>
            prisma.novelPromotionEpisode.create({
                data: {
                    novelPromotionProjectId: project.id,
                    episodeNumber: startNumber + idx,
                    name: ep.name,
                    description: ep.description || null,
                    novelText: ep.novelText
                }
            })
        )
    )

    // localized text lastEpisodeId localized text importStatus
    const updateData: { lastEpisodeId: string; importStatus?: string } = { lastEpisodeId: createdEpisodes[0].id }
    if (importStatus) {
        updateData.importStatus = importStatus
    }

    await prisma.novelPromotionProject.update({
        where: { id: project.id },
        data: updateData
    })

    return NextResponse.json({
        success: true,
        episodes: createdEpisodes.map(ep => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            name: ep.name
        }))
    })
})
