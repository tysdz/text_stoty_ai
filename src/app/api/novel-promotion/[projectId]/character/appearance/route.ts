import { logInfo as _ulogInfo, logWarn as _ulogWarn } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteObject } from '@/lib/storage'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * POST - localized text
 * Body: { characterId, changeReason, description }
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
  const { characterId, changeReason, description } = body

  if (!characterId || !changeReason || !description) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const character = await prisma.novelPromotionCharacter.findUnique({
    where: { id: characterId },
    include: {
      appearances: { orderBy: { appearanceIndex: 'asc' } },
      novelPromotionProject: true
    }
  })

  if (!character) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text
  if (character.novelPromotionProject.projectId !== projectId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text appearanceIndex
  const maxIndex = character.appearances.reduce(
    (max, app) => Math.max(max, app.appearanceIndex),
    0
  )
  const newIndex = maxIndex + 1

  // localized text
  const newAppearance = await prisma.characterAppearance.create({
    data: {
      characterId,
      appearanceIndex: newIndex,
      changeReason: changeReason.trim(),
      description: description.trim(),
      descriptions: JSON.stringify([description.trim()]),
      imageUrls: encodeImageUrls([]),
      previousImageUrls: encodeImageUrls([])}
  })

  _ulogInfo(`✓ localized text: ${character.name} - ${changeReason} (index: ${newIndex})`)

  return NextResponse.json({
    success: true,
    appearance: newAppearance
  })
})

/**
 * PATCH - localized text
 * Body: { characterId, appearanceId, description, descriptionIndex }
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
  const { characterId, appearanceId, description, descriptionIndex } = body

  if (!characterId || !appearanceId || !description) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: appearanceId },
    include: { character: { include: { novelPromotionProject: true } } }
  })

  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  if (appearance.characterId !== characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  if (appearance.character.novelPromotionProject.projectId !== projectId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const trimmedDesc = description.trim()

  // update descriptions localized text
  let descriptions: string[] = []
  try {
    descriptions = appearance.descriptions ? JSON.parse(appearance.descriptions) : []
  } catch {
    descriptions = []
  }

  // localized text descriptionIndex，localized text；localized text/localized text
  const idx = typeof descriptionIndex === 'number' ? descriptionIndex : 0
  if (idx >= 0 && idx < descriptions.length) {
    descriptions[idx] = trimmedDesc
  } else {
    descriptions.push(trimmedDesc)
  }

  await prisma.characterAppearance.update({
    where: { id: appearanceId },
    data: {
      description: trimmedDesc,
      descriptions: JSON.stringify(descriptions)
    }
  })

  _ulogInfo(`✓ localized text: ${appearance.character.name} - ${appearance.changeReason || 'localized text' + appearance.appearanceIndex}`)

  return NextResponse.json({
    success: true
  })
})

/**
 * DELETE - localized text
 * Query params: characterId, appearanceId
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
  const characterId = searchParams.get('characterId')
  const appearanceId = searchParams.get('appearanceId')

  if (!characterId || !appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: appearanceId },
    include: { character: true }
  })

  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  if (appearance.characterId !== characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const appearanceCount = await prisma.characterAppearance.count({
    where: { characterId }
  })

  if (appearanceCount <= 1) {
    throw new ApiError('INVALID_PARAMS')
  }

  // delete COS localized text
  const deletedImages: string[] = []

  // localized text
  if (appearance.imageUrl) {
    const key = await resolveStorageKeyFromMediaValue(appearance.imageUrl)
    if (key) {
      try {
        await deleteObject(key)
        deletedImages.push(key)
      } catch {
        _ulogWarn('Failed to delete COS image:', key)
      }
    }
  }

  // localized text
  try {
    const urls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
    for (const url of urls) {
      if (url) {
        const key = await resolveStorageKeyFromMediaValue(url)
        if (key && !deletedImages.includes(key)) {
          try {
            await deleteObject(key)
            deletedImages.push(key)
          } catch {
            _ulogWarn('Failed to delete COS image:', key)
          }
        }
      }
    }
  } catch {
    // contract violation is surfaced by migration/validation scripts; keep delete idempotent
  }

  // localized text
  await prisma.characterAppearance.delete({
    where: { id: appearanceId }
  })

  // localized text appearanceIndex
  const remainingAppearances = await prisma.characterAppearance.findMany({
    where: { characterId },
    orderBy: { appearanceIndex: 'asc' }
  })

  for (let i = 0; i < remainingAppearances.length; i++) {
    if (remainingAppearances[i].appearanceIndex !== i) {
      await prisma.characterAppearance.update({
        where: { id: remainingAppearances[i].id },
        data: { appearanceIndex: i }
      })
    }
  }

  _ulogInfo(`✓ localized text: ${appearance.character.name} - ${appearance.changeReason || 'localized text' + appearance.appearanceIndex}`)
  _ulogInfo(`✓ localized text ${deletedImages.length} localized text COS localized text`)

  return NextResponse.json({
    success: true,
    deletedImages: deletedImages.length
  })
})
