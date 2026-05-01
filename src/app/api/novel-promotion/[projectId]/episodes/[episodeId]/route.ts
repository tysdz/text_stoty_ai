import { logError as _ulogError } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { attachMediaFieldsToProject } from '@/lib/media/attach'
import { resolveMediaRefFromLegacyValue } from '@/lib/media/service'

/**
 * GET - localized text
 */
export const GET = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string; episodeId: string }> }
) => {
  const { projectId, episodeId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  // localized text
  const episode = await prisma.novelPromotionEpisode.findUnique({
    where: { id: episodeId },
    include: {
      clips: {
        orderBy: { createdAt: 'asc' }
      },
      storyboards: {
        include: {
          clip: true,
          panels: { orderBy: { panelIndex: 'asc' } }
        },
        orderBy: { createdAt: 'asc' }
      },
      shots: {
        orderBy: { shotId: 'asc' }
      },
      voiceLines: {
        orderBy: { lineIndex: 'asc' }
      }
    }
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  // localized textID（localized text，localized text）
  prisma.novelPromotionProject.update({
    where: { projectId },
    data: { lastEpisodeId: episodeId }
  }).catch(err => _ulogError('update lastEpisodeId failed:', err))

  // localized text URL（localized text）
  const episodeWithSignedUrls = await attachMediaFieldsToProject(episode)

  return NextResponse.json({ episode: episodeWithSignedUrls })
})

/**
 * PATCH - localized text
 */
export const PATCH = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string; episodeId: string }> }
) => {
  const { projectId, episodeId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json()
  const { name, description, novelText, audioUrl, srtContent } = body

  const updateData: Prisma.NovelPromotionEpisodeUncheckedUpdateInput = {}
  if (name !== undefined) updateData.name = name.trim()
  if (description !== undefined) updateData.description = description?.trim() || null
  if (novelText !== undefined) updateData.novelText = novelText
  if (audioUrl !== undefined) {
    updateData.audioUrl = audioUrl
    const media = await resolveMediaRefFromLegacyValue(audioUrl)
    updateData.audioMediaId = media?.id || null
  }
  if (srtContent !== undefined) updateData.srtContent = srtContent

  const episode = await prisma.novelPromotionEpisode.update({
    where: { id: episodeId },
    data: updateData
  })

  return NextResponse.json({ episode })
})

/**
 * DELETE - localized text
 */
export const DELETE = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string; episodeId: string }> }
) => {
  const { projectId, episodeId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  // localized text（localized text）
  await prisma.novelPromotionEpisode.delete({
    where: { id: episodeId }
  })

  // localized text，update lastEpisodeId
  const novelPromotionProject = await prisma.novelPromotionProject.findUnique({
    where: { projectId }
  })

  if (novelPromotionProject?.lastEpisodeId === episodeId) {
    // localized text
    const anotherEpisode = await prisma.novelPromotionEpisode.findFirst({
      where: { novelPromotionProjectId: novelPromotionProject.id },
      orderBy: { episodeNumber: 'asc' }
    })

    await prisma.novelPromotionProject.update({
      where: { id: novelPromotionProject.id },
      data: { lastEpisodeId: anotherEpisode?.id || null }
    })
  }

  return NextResponse.json({ success: true })
})
