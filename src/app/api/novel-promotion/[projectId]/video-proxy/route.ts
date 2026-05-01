import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { NextRequest } from 'next/server'
import { getSignedUrl, toFetchableUrl } from '@/lib/storage'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * localized text
 * localized text COS localized text
 */
export const GET = apiHandler(async (
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await context.params
    const { searchParams } = new URL(request.url)
    const videoKey = searchParams.get('key')

    if (!videoKey) {
        throw new ApiError('INVALID_PARAMS')
    }

    // 🔐 localized text
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult

    // localized text URL localized text
    let fetchUrl: string
    if (videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
        fetchUrl = videoKey
    } else {
        fetchUrl = toFetchableUrl(getSignedUrl(videoKey, 3600))
    }

    _ulogInfo(`[localized text] download: ${fetchUrl.substring(0, 100)}...`)

    const response = await fetch(fetchUrl)
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`)
    }

    // localized text
    const contentType = response.headers.get('content-type') || 'video/mp4'
    const contentLength = response.headers.get('content-length')

    // localized text
    const headers: HeadersInit = {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
    }
    if (contentLength) {
        headers['Content-Length'] = contentLength
    }

    return new Response(response.body, { headers })
})
