import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { serializeStructuredJsonField } from '@/lib/novel-promotion/panel-ai-data-sync'

function parseNullableNumberField(value: unknown): number | null {
  if (value === null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  throw new ApiError('INVALID_PARAMS')
}

function toStructuredJsonField(value: unknown, fieldName: string): string | null {
  try {
    return serializeStructuredJsonField(value, fieldName)
  } catch (error) {
    const message = error instanceof Error ? error.message : `${fieldName} must be valid JSON`
    throw new ApiError('INVALID_PARAMS', { message })
  }
}

/**
 * POST /api/novel-promotion/[projectId]/panel
 * localized text Panel
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
  const panelModel = prisma.novelPromotionPanel as unknown as {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
  const {
    storyboardId,
    shotType,
    cameraMove,
    description,
    location,
    characters,
    props,
    srtStart,
    srtEnd,
    duration,
    videoPrompt,
    firstLastFramePrompt,
  } = body

  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text storyboard localized text，localized text panels localized text panelIndex
  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: storyboardId },
    include: {
      panels: {
        orderBy: { panelIndex: 'desc' },
        take: 1
      }
    }
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text panelIndex（localized text + 1，localized text）
  const maxPanelIndex = storyboard.panels.length > 0 ? storyboard.panels[0].panelIndex : -1
  const newPanelIndex = maxPanelIndex + 1
  const newPanelNumber = newPanelIndex + 1

  // localized text Panel localized text
  const newPanel = await panelModel.create({
    data: {
      storyboardId,
      panelIndex: newPanelIndex,
      panelNumber: newPanelNumber,
      shotType: shotType ?? null,
      cameraMove: cameraMove ?? null,
      description: description ?? null,
      location: location ?? null,
      characters: characters ?? null,
      props: props ?? null,
      srtStart: srtStart ?? null,
      srtEnd: srtEnd ?? null,
      duration: duration ?? null,
      videoPrompt: videoPrompt ?? null,
      firstLastFramePrompt: firstLastFramePrompt ?? null,
    }
  })

  // update panelCount
  const panelCount = await prisma.novelPromotionPanel.count({
    where: { storyboardId }
  })

  await prisma.novelPromotionStoryboard.update({
    where: { id: storyboardId },
    data: { panelCount }
  })

  return NextResponse.json({ success: true, panel: newPanel })
})

/**
 * DELETE /api/novel-promotion/[projectId]/panel
 * localized text Panel
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
  const panelId = searchParams.get('panelId')

  if (!panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text Panel info
  const panel = await prisma.novelPromotionPanel.findUnique({
    where: { id: panelId }
  })

  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }

  const storyboardId = panel.storyboardId

  // localized text
  // localized text SQL localized text
  await prisma.$transaction(async (tx) => {
    // 1. delete Panel
    await tx.novelPromotionPanel.delete({
      where: { id: panelId }
    })

    // 2. localized text SQL localized text panels
    // localized text panel localized text，localized text
    const deletedPanelIndex = panel.panelIndex

    // localized text Prisma localized text，localized text
    const maxPanel = await tx.novelPromotionPanel.findFirst({
      where: { storyboardId },
      orderBy: { panelIndex: 'desc' },
      select: { panelIndex: true }
    })
    const maxPanelIndex = maxPanel?.panelIndex ?? -1
    const offset = maxPanelIndex + 1000

    // stage1：localized text，localized text
    await tx.novelPromotionPanel.updateMany({
      where: {
        storyboardId,
        panelIndex: { gt: deletedPanelIndex }
      },
      data: {
        panelIndex: { increment: offset },
        panelNumber: { increment: offset }
      }
    })

    // stage2：localized text（localized text -offset -1）
    await tx.novelPromotionPanel.updateMany({
      where: {
        storyboardId,
        panelIndex: { gt: deletedPanelIndex + offset }
      },
      data: {
        panelIndex: { decrement: offset + 1 },
        panelNumber: { decrement: offset + 1 }
      }
    })

    // 3. localized text panel localized text
    const panelCount = await tx.novelPromotionPanel.count({
      where: { storyboardId }
    })

    // 4. update storyboard localized text panelCount
    await tx.novelPromotionStoryboard.update({
      where: { id: storyboardId },
      data: { panelCount }
    })
  }, {
    maxWait: 15000, // localized text：15 localized text
    timeout: 30000  // localized text：30 localized text (localized text panels localized text)
  })

  return NextResponse.json({ success: true })
})

/**
 * PATCH /api/novel-promotion/[projectId]/panel
 * localized text Panel localized text（localized text）
 * localized text：
 * 1. localized text panelId localized text（recommended，localized text）
 * 2. localized text storyboardId + panelIndex update（localized text）
 */
export const PATCH = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json()
  const panelModel = prisma.novelPromotionPanel as unknown as {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
  const { panelId, storyboardId, panelIndex, videoPrompt, firstLastFramePrompt } = body

  // 🔥 localized text1：localized text panelId localized text（localized text）
  if (panelId) {
    const panel = await prisma.novelPromotionPanel.findUnique({
      where: { id: panelId }
    })

    if (!panel) {
      throw new ApiError('NOT_FOUND')
    }

    // localized text
    const updateData: {
      videoPrompt?: string | null
      firstLastFramePrompt?: string | null
    } = {}
    if (videoPrompt !== undefined) updateData.videoPrompt = videoPrompt
    if (firstLastFramePrompt !== undefined) updateData.firstLastFramePrompt = firstLastFramePrompt

    await prisma.novelPromotionPanel.update({
      where: { id: panelId },
      data: updateData
    })

    return NextResponse.json({ success: true })
  }

  // 🔥 localized text2：localized text storyboardId + panelIndex update（localized text）
  if (!storyboardId || panelIndex === undefined) {
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
  const updateData: {
    videoPrompt?: string | null
    firstLastFramePrompt?: string | null
  } = {}
  if (videoPrompt !== undefined) {
    updateData.videoPrompt = videoPrompt
  }
  if (firstLastFramePrompt !== undefined) {
    updateData.firstLastFramePrompt = firstLastFramePrompt
  }

  // localized text Panel
  const updatedPanel = await prisma.novelPromotionPanel.updateMany({
    where: {
      storyboardId,
      panelIndex
    },
    data: updateData
  })

  // localized text Panel localized text，localized text（Panel localized text）
  if (updatedPanel.count === 0) {
    // localized text Panel localized text
    await panelModel.create({
      data: {
        storyboardId,
        panelIndex,
        panelNumber: panelIndex + 1,
        imageUrl: null,
        videoPrompt: videoPrompt ?? null,
        firstLastFramePrompt: firstLastFramePrompt ?? null,
      }
    })
  }

  return NextResponse.json({ success: true })
})

/**
 * PUT /api/novel-promotion/[projectId]/panel
 * localized text Panel localized text（localized text）
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
  const panelModel = prisma.novelPromotionPanel as unknown as {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  }
  const {
    storyboardId,
    panelIndex,
    panelNumber,
    shotType,
    cameraMove,
    description,
    location,
    characters,
    props,
    srtStart,
    srtEnd,
    duration,
    videoPrompt,
    firstLastFramePrompt,
    actingNotes,  // localized text
    photographyRules,  // localized text
  } = body

  if (!storyboardId || panelIndex === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text storyboard localized text
  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: storyboardId }
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text - localized text
  const updateData: {
    panelNumber?: number | null
    shotType?: string | null
    cameraMove?: string | null
    description?: string | null
    location?: string | null
    characters?: string | null
    props?: string | null
    srtStart?: number | null
    srtEnd?: number | null
    duration?: number | null
    videoPrompt?: string | null
    firstLastFramePrompt?: string | null
    actingNotes?: string | null
    photographyRules?: string | null
  } = {}
  if (panelNumber !== undefined) updateData.panelNumber = panelNumber
  if (shotType !== undefined) updateData.shotType = shotType
  if (cameraMove !== undefined) updateData.cameraMove = cameraMove
  if (description !== undefined) updateData.description = description
  if (location !== undefined) updateData.location = location
  if (characters !== undefined) updateData.characters = characters
  if (props !== undefined) updateData.props = props
  if (srtStart !== undefined) updateData.srtStart = parseNullableNumberField(srtStart)
  if (srtEnd !== undefined) updateData.srtEnd = parseNullableNumberField(srtEnd)
  if (duration !== undefined) updateData.duration = parseNullableNumberField(duration)
  if (videoPrompt !== undefined) updateData.videoPrompt = videoPrompt
  if (firstLastFramePrompt !== undefined) updateData.firstLastFramePrompt = firstLastFramePrompt
  // JSON localized text JSON localized text
  if (actingNotes !== undefined) {
    updateData.actingNotes = toStructuredJsonField(actingNotes, 'actingNotes')
  }
  if (photographyRules !== undefined) {
    updateData.photographyRules = toStructuredJsonField(photographyRules, 'photographyRules')
  }

  // localized text Panel
  const existingPanel = await prisma.novelPromotionPanel.findUnique({
    where: {
      storyboardId_panelIndex: {
        storyboardId,
        panelIndex
      }
    }
  })

  if (existingPanel) {
    // localized text Panel
    await prisma.novelPromotionPanel.update({
      where: { id: existingPanel.id },
      data: updateData
    })
  } else {
    // localized text Panel localized text
    await panelModel.create({
      data: {
        storyboardId,
        panelIndex,
        panelNumber: panelNumber ?? panelIndex + 1,
        shotType: shotType ?? null,
        cameraMove: cameraMove ?? null,
        description: description ?? null,
        location: location ?? null,
        characters: characters ?? null,
        props: props ?? null,
        srtStart: srtStart ?? null,
        srtEnd: srtEnd ?? null,
        duration: duration ?? null,
        videoPrompt: videoPrompt ?? null,
        firstLastFramePrompt: firstLastFramePrompt ?? null,
        actingNotes: actingNotes !== undefined ? toStructuredJsonField(actingNotes, 'actingNotes') : null,
        photographyRules: photographyRules !== undefined ? toStructuredJsonField(photographyRules, 'photographyRules') : null,
      }
    })
  }

  // Panel localized text，localized text storyboardTextJson
  // localized text panelCount localized text
  const panelCount = await prisma.novelPromotionPanel.count({
    where: { storyboardId }
  })

  await prisma.novelPromotionStoryboard.update({
    where: { id: storyboardId },
    data: { panelCount }
  })

  return NextResponse.json({ success: true })
})
