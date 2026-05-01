import { logInfo as _ulogInfo, logWarn as _ulogWarn } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteObject } from '@/lib/storage'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * POST - localized text
 * Body: { locationId }
 * 
 * localized text：
 * 1. localized text（localized text isSelected localized text）
 * 2. localized text（localized text COS localized text）
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
  const { locationId } = body

  if (!locationId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const location = await prisma.novelPromotionLocation.findUnique({
    where: { id: locationId },
    include: { images: { orderBy: { imageIndex: 'asc' } } }
  })

  if (!location) {
    throw new ApiError('NOT_FOUND')
  }

  const images = location.images || []

  if (images.length <= 1) {
    // localized text，localized text
    return NextResponse.json({
      success: true,
      message: 'localized text',
      deletedCount: 0
    })
  }

  // localized text
  const selectedImage = location.selectedImageId
    ? images.find((img) => img.id === location.selectedImageId)
    : images.find((img) => img.isSelected)
  if (!selectedImage) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const deletedImages: string[] = []
  const imagesToDelete = images.filter((img) => img.id !== selectedImage.id)

  for (const img of imagesToDelete) {
    if (img.imageUrl) {
      const key = await resolveStorageKeyFromMediaValue(img.imageUrl)
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

  // localized text
  await prisma.$transaction(async (tx) => {
    // localized text（localized text ID）
    await tx.locationImage.deleteMany({
      where: {
        locationId,
        id: { not: selectedImage.id }
      }
    })

    // localized text 0
    await tx.locationImage.update({
      where: { id: selectedImage.id },
      data: { imageIndex: 0 }
    })

    await tx.novelPromotionLocation.update({
      where: { id: locationId },
      data: { selectedImageId: selectedImage.id }
    })
  })

  _ulogInfo(`✓ localized text: ${location.name}`)
  _ulogInfo(`✓ localized text ${deletedImages.length} localized text`)

  return NextResponse.json({
    success: true,
    message: 'localized text，localized text',
    deletedCount: deletedImages.length
  })
})
