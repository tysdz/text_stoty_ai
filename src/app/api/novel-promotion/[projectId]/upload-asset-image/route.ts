import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadObject, generateUniqueKey } from '@/lib/storage'
import sharp from 'sharp'
import { initializeFonts, createLabelSVG } from '@/lib/fonts'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

interface CharacterAppearanceRecord {
  id: string
  imageUrls: string | null
  selectedIndex: number | null
}

interface LocationImageRecord {
  id: string
  imageIndex: number
}

interface LocationRecord {
  selectedImageId: string | null
  images?: LocationImageRecord[]
}

interface UploadAssetImageDb {
  characterAppearance: {
    findUnique(args: Record<string, unknown>): Promise<CharacterAppearanceRecord | null>
    update(args: Record<string, unknown>): Promise<unknown>
  }
  novelPromotionLocation: {
    findUnique(args: Record<string, unknown>): Promise<LocationRecord | null>
    update(args: Record<string, unknown>): Promise<unknown>
  }
  locationImage: {
    update(args: Record<string, unknown>): Promise<{ id: string }>
    create(args: Record<string, unknown>): Promise<{ id: string }>
  }
}

/**
 * POST /api/novel-promotion/[projectId]/upload-asset-image
 * localized text
 */
export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  const db = prisma as unknown as UploadAssetImageDb

  // localized text（localized text Vercel localized text）
  await initializeFonts()

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  // localized text
  const formData = await request.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string // 'character' | 'location'
  const id = formData.get('id') as string // characterId localized text locationId
  const appearanceId = formData.get('appearanceId') as string | null  // UUID
  const imageIndex = formData.get('imageIndex') as string | null
  const labelText = formData.get('labelText') as string // localized text

  if (!file || !type || !id || !labelText) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // localized text
  const meta = await sharp(buffer).metadata()
  const w = meta.width || 2160
  const h = meta.height || 2160
  const fontSize = Math.floor(h * 0.04)
  const pad = Math.floor(fontSize * 0.5)
  const barH = fontSize + pad * 2

  // localized textSVGlocalized text
  const svg = await createLabelSVG(w, barH, fontSize, pad, labelText)

  // localized text
  const processed = await sharp(buffer)
    .extend({ top: barH, bottom: 0, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()

  // localized textkeylocalized text
  const keyPrefix = type === 'character'
    ? `char-${id}-${appearanceId}-upload`
    : `loc-${id}-upload`
  const key = generateUniqueKey(keyPrefix, 'jpg')
  await uploadObject(processed, key)

  // localized text
  if (type === 'character' && appearanceId !== null) {
    // localized text - localized text UUID localized text
    const appearance = await db.characterAppearance.findUnique({
      where: { id: appearanceId }
    })

    if (!appearance) {
      throw new ApiError('NOT_FOUND')
    }

    // localized text
    const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')

    // localized textimageIndex，localized text
    const targetIndex = imageIndex !== null ? parseInt(imageIndex) : imageUrls.length

    // localized text
    while (imageUrls.length <= targetIndex) {
      imageUrls.push('')
    }

    imageUrls[targetIndex] = key

    // localized text imageUrl
    // localized text，localized text
    const selectedIndex = appearance.selectedIndex
    const shouldUpdateImageUrl =
      selectedIndex === targetIndex ||  // localized text
      (selectedIndex === null && targetIndex === 0) ||  // localized text，localized text
      imageUrls.filter(u => !!u).length === 1  // localized text

    const updateData: Record<string, unknown> = {
      imageUrls: encodeImageUrls(imageUrls)
    }

    if (shouldUpdateImageUrl) {
      updateData.imageUrl = key
    }

    // localized text
    await db.characterAppearance.update({
      where: { id: appearance.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      imageKey: key,
      imageIndex: targetIndex
    })

  } else if (type === 'location') {
    // localized text
    const location = await db.novelPromotionLocation.findUnique({
      where: { id },
      include: { images: { orderBy: { imageIndex: 'asc' } } }
    })

    if (!location) {
      throw new ApiError('NOT_FOUND')
    }

    // localized textimageIndex，localized text
    if (imageIndex !== null) {
      const targetImageIndex = parseInt(imageIndex)
      const existingImage = location.images?.find((img) => img.imageIndex === targetImageIndex)

      if (existingImage) {
        const updated = await db.locationImage.update({
          where: { id: existingImage.id },
          data: { imageUrl: key }
        })
        if (!location.selectedImageId) {
          await prisma.novelPromotionLocation.update({
            where: { id },
            data: { selectedImageId: updated.id }
          })
        }
      } else {
        const created = await db.locationImage.create({
          data: {
            locationId: id,
            imageIndex: targetImageIndex,
            imageUrl: key,
            description: labelText,
            isSelected: targetImageIndex === 0
          }
        })
        if (!location.selectedImageId) {
          await prisma.novelPromotionLocation.update({
            where: { id },
            data: { selectedImageId: created.id }
          })
        }
      }

      return NextResponse.json({
        success: true,
        imageKey: key,
        imageIndex: targetImageIndex
      })
    } else {
      // localized text
      const maxIndex = location.images?.length || 0
      const created = await db.locationImage.create({
        data: {
          locationId: id,
          imageIndex: maxIndex,
          imageUrl: key,
          description: labelText,
          isSelected: maxIndex === 0
        }
      })
      if (!location.selectedImageId) {
        await prisma.novelPromotionLocation.update({
          where: { id },
          data: { selectedImageId: created.id }
        })
      }

      return NextResponse.json({
        success: true,
        imageKey: key,
        imageIndex: maxIndex
      })
    }
  }

  throw new ApiError('INVALID_PARAMS')
})
