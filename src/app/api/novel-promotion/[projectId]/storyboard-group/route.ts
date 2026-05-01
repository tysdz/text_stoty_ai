import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * POST /api/novel-promotion/[projectId]/storyboard-group
 * localized text（localized text Clip + Storyboard + localized text Panel）
 */
export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json()
  const { episodeId, insertIndex } = body

  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text clips
  const episode = await prisma.novelPromotionEpisode.findUnique({
    where: { id: episodeId },
    include: {
      clips: { orderBy: { createdAt: 'asc' } }
    }
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const existingClips = episode.clips
  const insertAt = insertIndex !== undefined ? insertIndex : existingClips.length

  // localized text clip localized text createdAt localized text，localized text
  let newCreatedAt: Date

  if (existingClips.length === 0) {
    // localized text clips，localized text
    newCreatedAt = new Date()
  } else if (insertAt === 0) {
    // localized text，localized text clip localized text
    const firstClip = existingClips[0]
    newCreatedAt = new Date(firstClip.createdAt.getTime() - 1000) // localized text1localized text
  } else if (insertAt >= existingClips.length) {
    // localized text，localized text clip localized text
    const lastClip = existingClips[existingClips.length - 1]
    newCreatedAt = new Date(lastClip.createdAt.getTime() + 1000) // localized text1localized text
  } else {
    // localized text，localized text clip localized text
    const prevClip = existingClips[insertAt - 1]
    const nextClip = existingClips[insertAt]
    const midTime = (prevClip.createdAt.getTime() + nextClip.createdAt.getTime()) / 2
    newCreatedAt = new Date(midTime)
  }

  // localized text Clip + Storyboard + Panel
  const result = await prisma.$transaction(async (tx) => {
    // 1. localized text Clip（localized text）
    const newClip = await tx.novelPromotionClip.create({
      data: {
        episodeId,
        summary: 'localized text',
        content: '',
        location: null,
        characters: null,
        createdAt: newCreatedAt
      }
    })

    // 2. localized text Storyboard
    const newStoryboard = await tx.novelPromotionStoryboard.create({
      data: {
        episodeId,
        clipId: newClip.id,
        panelCount: 1
      }
    })

    // 3. localized text Panel
    const newPanel = await tx.novelPromotionPanel.create({
      data: {
        storyboardId: newStoryboard.id,
        panelIndex: 0,
        panelNumber: 1,
        shotType: 'localized text',
        cameraMove: 'localized text',
        description: 'localized text',
        characters: '[]'
      }
    })

    return { clip: newClip, storyboard: newStoryboard, panel: newPanel }
  })

  _ulogInfo(`[localized text] episodeId=${episodeId}, clipId=${result.clip.id}, storyboardId=${result.storyboard.id}, insertAt=${insertAt}`)

  return NextResponse.json({
    success: true,
    clip: result.clip,
    storyboard: result.storyboard,
    panel: result.panel
  })
})

/**
 * PUT /api/novel-promotion/[projectId]/storyboard-group
 * localized text（localized text clip localized text createdAt）
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
  const { episodeId, clipId, direction } = body // direction: 'up' | 'down'

  if (!episodeId || !clipId || !direction) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text clips（localized text createdAt localized text）
  const episode = await prisma.novelPromotionEpisode.findUnique({
    where: { id: episodeId },
    include: {
      clips: { orderBy: { createdAt: 'asc' } }
    }
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const clips = episode.clips
  const currentIndex = clips.findIndex(c => c.id === clipId)

  if (currentIndex === -1) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  // localized text
  if (targetIndex < 0 || targetIndex >= clips.length) {
    throw new ApiError('INVALID_PARAMS')
  }

  const currentClip = clips[currentIndex]
  const targetClip = clips[targetIndex]

  // localized text clip localized text createdAt（localized text）
  const tempTime = currentClip.createdAt.getTime()
  const targetTime = targetClip.createdAt.getTime()

  // localized text
  await prisma.$transaction(async (tx) => {
    // localized text clip localized text
    await tx.novelPromotionClip.update({
      where: { id: currentClip.id },
      data: { createdAt: new Date(0) } // localized text
    })

    // localized text clip localized text
    await tx.novelPromotionClip.update({
      where: { id: targetClip.id },
      data: { createdAt: new Date(tempTime) }
    })

    // localized text clip localized text
    await tx.novelPromotionClip.update({
      where: { id: currentClip.id },
      data: { createdAt: new Date(targetTime) }
    })
  })

  _ulogInfo(`[localized text] clipId=${clipId}, direction=${direction}, ${currentIndex} -> ${targetIndex}`)

  return NextResponse.json({ success: true })
})

/**
 * DELETE /api/novel-promotion/[projectId]/storyboard-group
 * localized text（Clip + Storyboard + localized text Panels）
 */
export const DELETE = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const { searchParams } = new URL(request.url)
  const storyboardId = searchParams.get('storyboardId')

  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text storyboard localized text clip
  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: storyboardId },
    include: {
      panels: true,
      clip: true
    }
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text（Prisma localized text cascade localized text，localized text）
  await prisma.$transaction(async (tx) => {
    // 1. localized text Panels
    await tx.novelPromotionPanel.deleteMany({
      where: { storyboardId }
    })

    // 2. delete Storyboard
    await tx.novelPromotionStoryboard.delete({
      where: { id: storyboardId }
    })

    // 3. localized text Clip（localized text）
    if (storyboard.clipId) {
      await tx.novelPromotionClip.delete({
        where: { id: storyboard.clipId }
      })
    }
  })

  _ulogInfo(`[localized text] storyboardId=${storyboardId}, clipId=${storyboard.clipId}, panelCount=${storyboard.panels.length}`)

  return NextResponse.json({ success: true })
})
