import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireProjectAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * GET - localized text
 */
export const GET = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { novelData } = authResult

  const episodes = await prisma.novelPromotionEpisode.findMany({
    where: { novelPromotionProjectId: novelData.id },
    orderBy: { episodeNumber: 'asc' }
  })

  return NextResponse.json({ episodes })
})

/**
 * POST - localized text
 */
export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { novelData } = authResult

  const body = await request.json()
  const { name, description, novelText } = body

  if (!name || name.trim().length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const lastEpisode = await prisma.novelPromotionEpisode.findFirst({
    where: { novelPromotionProjectId: novelData.id },
    orderBy: { episodeNumber: 'desc' }
  })
  const nextEpisodeNumber = (lastEpisode?.episodeNumber || 0) + 1

  // localized text
  const createData: Prisma.NovelPromotionEpisodeUncheckedCreateInput = {
    novelPromotionProjectId: novelData.id,
    episodeNumber: nextEpisodeNumber,
    name: name.trim(),
    description: description?.trim() || null,
  }
  if (typeof novelText === 'string') {
    createData.novelText = novelText
  }

  const episode = await prisma.novelPromotionEpisode.create({
    data: createData,
  })

  // localized textID
  await prisma.novelPromotionProject.update({
    where: { id: novelData.id },
    data: { lastEpisodeId: episode.id }
  })

  return NextResponse.json({ episode }, { status: 201 })
})
