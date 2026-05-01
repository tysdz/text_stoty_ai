import { NextRequest, NextResponse } from 'next/server'
import { generateUniqueKey, getSignedUrl, uploadObject } from '@/lib/storage'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * POST /api/asset-hub/upload-temp
 * localized text（Base64），localized text URL
 * localized text
 */
export const POST = apiHandler(async (request: NextRequest) => {
    // 🔐 localized text
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
    const { session } = authResult

    const body = await request.json()
    const { imageBase64, base64, extension } = body

    // localized text：
    // 1. localized text：{ imageBase64: "data:image/..." }
    // 2. localized text：{ base64: "...", type: "audio/wav", extension: "wav" }

    let buffer: Buffer
    let ext: string

    if (imageBase64) {
        // localized text
        const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/)
        if (!matches) {
            throw new ApiError('INVALID_PARAMS')
        }
        ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
        buffer = Buffer.from(matches[2], 'base64')
    } else if (base64 && extension) {
        // localized text（localized text）
        buffer = Buffer.from(base64, 'base64')
        ext = extension
    } else {
        throw new ApiError('INVALID_PARAMS')
    }

    // localized text COS
    const key = generateUniqueKey(`temp-${session.user.id}-${Date.now()}`, ext)
    await uploadObject(buffer, key)

    // localized text URL（localized text 1 localized text）
    const signedUrl = getSignedUrl(key, 3600)

    return NextResponse.json({
        success: true,
        url: signedUrl,
        key
    })
})
