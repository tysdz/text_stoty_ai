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
 * Body: { characterId, appearanceId }
 * 
 * localized text：
 * 1. localized text（selectedIndex localized text null）
 * 2. delete imageUrls localized text（localized text COS localized text）
 * 3. localized text
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
  const { characterId, appearanceId } = body

  if (!characterId || !appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text - localized text UUID localized text
  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: appearanceId },
    include: { character: true }
  })

  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text
  if (appearance.selectedIndex === null || appearance.selectedIndex === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')

  if (imageUrls.length <= 1) {
    // localized text，localized text
    return NextResponse.json({
      success: true,
      message: 'localized text',
      deletedCount: 0
    })
  }

  const selectedIndex = appearance.selectedIndex
  const selectedImageUrl = imageUrls[selectedIndex]

  if (!selectedImageUrl) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text
  const deletedImages: string[] = []
  for (let i = 0; i < imageUrls.length; i++) {
    if (i !== selectedIndex && imageUrls[i]) {
      const key = await resolveStorageKeyFromMediaValue(imageUrls[i]!)
      if (key) {
        try {
          await deleteObject(key)
          deletedImages.push(key)
        } catch {
          _ulogWarn('Failed to delete COS image:', key)
        }
      }
    }
  }

  // localized text descriptions，localized text
  let descriptions: string[] = []
  if (appearance.descriptions) {
    try {
      descriptions = JSON.parse(appearance.descriptions)
    } catch { }
  }
  const selectedDescription = descriptions[selectedIndex] || appearance.description || ''

  // localized text：localized text
  await prisma.characterAppearance.update({
    where: { id: appearance.id },
    data: {
      imageUrl: selectedImageUrl,
      imageUrls: encodeImageUrls([selectedImageUrl]),  // localized text
      selectedIndex: 0,  // localized text，localized text0
      description: selectedDescription,
      descriptions: JSON.stringify([selectedDescription])
    }
  })

  _ulogInfo(`✓ localized text: ${appearance.character.name} - ${appearance.changeReason}`)
  _ulogInfo(`✓ localized text ${deletedImages.length} localized text`)

  return NextResponse.json({
    success: true,
    message: 'localized text，localized text',
    deletedCount: deletedImages.length
  })
})
