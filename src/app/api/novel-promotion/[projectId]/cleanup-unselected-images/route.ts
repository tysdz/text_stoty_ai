import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteObject } from '@/lib/storage'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { requireProjectAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'

/**
 * POST - localized text
 * localized text
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

  let deletedCount = 0

  // 1. localized text
  const appearances = await prisma.characterAppearance.findMany({
    where: { character: { novelPromotionProjectId: novelData.id } },
    include: { character: true }
  })

  for (const appearance of appearances) {
    if (appearance.selectedIndex === null) continue

    try {
      const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
      if (imageUrls.length <= 1) continue

      // localized text
      for (let i = 0; i < imageUrls.length; i++) {
        if (i !== appearance.selectedIndex && imageUrls[i]) {
          try {
            const key = await resolveStorageKeyFromMediaValue(imageUrls[i]!)
            if (key) {
              await deleteObject(key)
              _ulogInfo(`✓ Deleted: ${key}`)
              deletedCount++
            }
          } catch { }
        }
      }

      // localized text
      const selectedUrl = imageUrls[appearance.selectedIndex]
      if (!selectedUrl) continue
      await prisma.characterAppearance.update({
        where: { id: appearance.id },
        data: {
          imageUrls: encodeImageUrls([selectedUrl]),
          selectedIndex: 0
        }
      })
    } catch { }
  }

  // 2. localized text
  const locations = await prisma.novelPromotionLocation.findMany({
    where: { novelPromotionProjectId: novelData.id },
    include: { images: true }
  })

  for (const location of locations) {
    const selectedImage = location.selectedImageId
      ? location.images.find(img => img.id === location.selectedImageId)
      : location.images.find(img => img.isSelected)
    if (!selectedImage) continue

    // localized text
    for (const img of location.images) {
      if (!img.isSelected && img.imageUrl) {
        try {
          const key = await resolveStorageKeyFromMediaValue(img.imageUrl)
          if (key) {
            await deleteObject(key)
            _ulogInfo(`✓ Deleted: ${key}`)
            deletedCount++
          }
        } catch { }

        // localized text
        await prisma.locationImage.delete({ where: { id: img.id } })
      }
    }

    // localized text0
    await prisma.locationImage.update({
      where: { id: selectedImage.id },
      data: { imageIndex: 0 }
    })

    await prisma.novelPromotionLocation.update({
      where: { id: location.id },
      data: { selectedImageId: selectedImage.id }
    })
  }

  return NextResponse.json({ success: true, deletedCount })
})
