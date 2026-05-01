import { logError as _ulogError } from '@/lib/logging/core'
/**
 * localized text
 * localized text/localized text
 */

import sharp from 'sharp'
import { uploadObject, getSignedUrl, generateUniqueKey, toFetchableUrl } from '@/lib/storage'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { initializeFonts, createLabelSVG } from '@/lib/fonts'

/**
 * localized text（localized text + localized text）
 * 
 * @param imageUrl - localized text URL localized text COS key
 * @param newLabelText - localized text
 * @param options - localized text
 * @returns localized text COS key
 */
export async function updateImageLabel(
    imageUrl: string,
    newLabelText: string,
    options?: {
        /** localized text key（localized text key） */
        generateNewKey?: boolean
        /** localized text key localized text（localized text generateNewKey=true localized text） */
        keyPrefix?: string
    }
): Promise<string> {
    await initializeFonts()

    const originalKey = await resolveStorageKeyFromMediaValue(imageUrl)
    if (!originalKey) {
        throw new Error(`localized text key: ${imageUrl}`)
    }
    const signedUrl = getSignedUrl(originalKey, 3600)

    // localized text
    const response = await fetch(toFetchableUrl(signedUrl))
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())

    // localized text
    const meta = await sharp(buffer).metadata()
    const w = meta.width || 2160
    const h = meta.height || 2160

    // localized text（localized text：localized text 4%）
    const fontSize = Math.floor(h * 0.04)
    const pad = Math.floor(fontSize * 0.5)
    const barH = fontSize + pad * 2

    // localized text
    const croppedBuffer = await sharp(buffer)
        .extract({ left: 0, top: barH, width: w, height: h - barH })
        .toBuffer()

    // localized text SVG localized text
    const svg = await createLabelSVG(w, barH, fontSize, pad, newLabelText)

    // localized text
    const processed = await sharp(croppedBuffer)
        .extend({ top: barH, bottom: 0, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .composite([{ input: svg, top: 0, left: 0 }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer()

    // localized text key localized text key
    const finalKey = options?.generateNewKey
        ? generateUniqueKey(options.keyPrefix || 'labeled-image', 'jpg')
        : originalKey

    await uploadObject(processed, finalKey)
    return finalKey
}

/**
 * localized text
 * localized text
 */
export async function updateCharacterAppearanceLabels(
    appearances: Array<{
        imageUrl: string | null
        imageUrls: string
        changeReason: string
    }>,
    characterName: string
): Promise<Array<{ imageUrl: string | null; imageUrls: string }>> {
    const results: Array<{ imageUrl: string | null; imageUrls: string }> = []

    for (const appearance of appearances) {
        try {
            // localized text URLs
            let imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'appearance.imageUrls')
            if (imageUrls.length === 0 && appearance.imageUrl) {
                imageUrls = [appearance.imageUrl]
            }

            if (imageUrls.length === 0) {
                results.push({ imageUrl: null, imageUrls: encodeImageUrls([]) })
                continue
            }

            // localized text
            const newLabelText = `${characterName} - ${appearance.changeReason}`
            const newImageUrls: string[] = await Promise.all(
                imageUrls.map(async (url) => {
                    if (!url) return ''
                    try {
                        // localized text key，localized text
                        return await updateImageLabel(url, newLabelText, {
                            generateNewKey: true,
                            keyPrefix: `project-char-copy`
                        })
                    } catch (e) {
                        _ulogError(`Failed to update label for image:`, e)
                        return url // localized text URL
                    }
                })
            )

            const firstUrl = newImageUrls.find((u) => !!u) || null
            results.push({
                imageUrl: firstUrl,
                imageUrls: encodeImageUrls(newImageUrls)
            })
        } catch (e) {
            _ulogError('Failed to update appearance labels:', e)
            results.push({ imageUrl: appearance.imageUrl, imageUrls: appearance.imageUrls })
        }
    }

    return results
}

/**
 * localized text
 * localized text
 */
export async function updateLocationImageLabels(
    images: Array<{
        imageUrl: string | null
    }>,
    locationName: string
): Promise<Array<{ imageUrl: string | null }>> {
    const results: Array<{ imageUrl: string | null }> = []

    for (const image of images) {
        if (!image.imageUrl) {
            results.push({ imageUrl: null })
            continue
        }

        try {
            // localized text key，localized text
            const newImageUrl = await updateImageLabel(image.imageUrl, locationName, {
                generateNewKey: true,
                keyPrefix: `project-loc-copy`
            })
            results.push({ imageUrl: newImageUrl })
        } catch (e) {
            _ulogError('Failed to update location image label:', e)
            results.push({ imageUrl: image.imageUrl })
        }
    }

    return results
}
