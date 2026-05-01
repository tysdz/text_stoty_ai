import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { buildFalQueueUrl } from '@/lib/providers/fal/base-url'
/**
 * localized text
 * 
 * localized text：
 * 1. localized text（FAL/Ark）
 * 2. localized text
 * 3. localized text
 */

// localized text：API Key localized text，localized text

// ==================== FAL localized text ====================

/**
 * submitFALlocalized text
 * @param endpoint FALlocalized text，localized text 'wan/v2.6/image-to-video'
 * @param input localized text
 * @param apiKey FAL API Key
 * @returns request_id
 */
export async function submitFalTask(endpoint: string, input: Record<string, unknown>, apiKey: string): Promise<string> {
    if (!apiKey) {
        throw new Error('localized text FAL API Key')
    }

    const response = await fetch(buildFalQueueUrl(endpoint), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${apiKey}`
        },
        body: JSON.stringify(input)
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`FALlocalized text (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const requestId = data.request_id

    if (!requestId) {
        throw new Error('FALlocalized textrequest_id')
    }

    _ulogInfo(`[FAL Queue] localized text: ${requestId}`)
    return requestId
}

/**
 * localized text FAL localized text ID
 * localized text，localized text: owner/alias/path
 * localized text: fal-ai/veo3.1/fast/image-to-video
 *   -> owner = fal-ai
 *   -> alias = veo3.1
 *   -> path = fast/image-to-video (localized text)
 */
function parseFalEndpointId(endpoint: string): { owner: string; alias: string; path?: string } {
    const parts = endpoint.split('/')
    return {
        owner: parts[0],
        alias: parts[1],
        path: parts.slice(2).join('/') || undefined
    }
}

/**
 * localized textFALlocalized text
 * @param endpoint FALlocalized text
 * @param requestId localized textID
 * @param apiKey FAL API Key
 */
export async function queryFalStatus(endpoint: string, requestId: string, apiKey: string): Promise<{
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    completed: boolean
    failed: boolean
    resultUrl?: string
    error?: string
}> {
    if (!apiKey) {
        throw new Error('localized text FAL API Key')
    }

    // 🔥 localized text FAL localized text ID
    // localized text: owner/alias/path (path localized text)
    // localized text: fal-ai/veo3.1/fast/image-to-video -> fal-ai/veo3.1
    const parsed = parseFalEndpointId(endpoint)
    const baseEndpoint = `${parsed.owner}/${parsed.alias}`

    if (parsed.path) {
        _ulogInfo(`[FAL Status] localized text ${endpoint} -> ${baseEndpoint} (localized text: ${parsed.path})`)
    }

    const statusUrl = buildFalQueueUrl(`${baseEndpoint}/requests/${requestId}/status?logs=0`)

    // FAL localized text GET localized text
    const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Key ${apiKey}`
        }
    })

    if (!response.ok) {
        return {
            status: 'IN_PROGRESS',
            completed: false,
            failed: false
        }
    }

    const data = await response.json()
    const status = data.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

    // 🔥 localized text：localized text FAL localized text
    _ulogInfo(`[FAL Status] requestId=${requestId.slice(0, 16)}... localized text=${status}`)

    if (status === 'COMPLETED') {
        // 🔥 localized text
        // localized text response_url，localized text URL
        // localized text：localized text（localized text /edit localized text），localized text baseEndpoint
        // localized text FAL localized text，localized text 422 error（missing image_urls localized text）
        const resultUrl = data.response_url || buildFalQueueUrl(`${endpoint}/requests/${requestId}`)
        _ulogInfo(`[FAL Status] localized text，localized text: ${resultUrl}`)

        const resultResponse = await fetch(resultUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Accept': 'application/json'
            }
        })

        if (resultResponse.ok) {
            const resultData = await resultResponse.json()

            // localized textURL
            const videoUrl = resultData.video?.url
            const audioUrl = resultData.audio?.url
            const imageUrl = resultData.images?.[0]?.url

            _ulogInfo(`[FAL Status] localized text: video=${!!videoUrl}, audio=${!!audioUrl}, image=${!!imageUrl}`)

            return {
                status: 'COMPLETED',
                completed: true,
                failed: false,
                resultUrl: videoUrl || audioUrl || imageUrl
            }
        } else {
            // 🔥 localized text，localized text
            const errorText = await resultResponse.text()
            _ulogError(`[FAL Status] localized text (${resultResponse.status}): ${errorText.slice(0, 300)}`)

            // localized text 422 error，localized text
            if (resultResponse.status === 422) {
                // localized text
                let errorMessage = 'localized text'
                try {
                    const errorJson = JSON.parse(errorText)
                    const errorType = errorJson.detail?.[0]?.type
                    if (errorType === 'content_policy_violation') {
                        errorMessage = '⚠️ localized text：localized text'
                    } else if (errorType) {
                        errorMessage = `FAL error: ${errorType}`
                    }
                } catch { }

                _ulogError(`[FAL Status] 422 error: ${errorMessage}`)
                return {
                    status: 'COMPLETED',
                    completed: true,
                    failed: true,
                    error: errorMessage
                }
            }

            // 🔥 500 localized text，localized text，localized text
            if (resultResponse.status === 500) {
                // localized text
                let errorDetail = 'localized text'
                try {
                    const errorJson = JSON.parse(errorText)
                    if (errorJson.detail?.[0]?.type === 'downstream_service_error') {
                        errorDetail = 'FAL localized text：localized text'
                    }
                } catch { }

                _ulogError(`[FAL Status] 500 error，localized text: ${errorDetail}`)
                return {
                    status: 'COMPLETED',
                    completed: true,
                    failed: true,
                    error: errorDetail
                }
            }

            // localized text，localized text，localized text
            return {
                status: 'IN_PROGRESS',
                completed: false,
                failed: false
            }
        }
    }

    if (status === 'FAILED') {
        return {
            status: 'FAILED',
            completed: false,
            failed: true,
            error: data.error || 'localized text'
        }
    }

    return {
        status,
        completed: false,
        failed: false
    }
}

// ==================== Ark localized text ====================

/**
 * localized textArklocalized text
 * @param taskId Arklocalized textID
 * @param apiKey ARK API Key
 */
export async function queryArkVideoStatus(taskId: string, apiKey: string): Promise<{
    status: string
    completed: boolean
    failed: boolean
    resultUrl?: string
    error?: string
}> {
    if (!apiKey) {
        throw new Error('localized text API Key')
    }

    const response = await fetch(
        `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        }
    )

    if (!response.ok) {
        return {
            status: 'unknown',
            completed: false,
            failed: false
        }
    }

    const data = await response.json()
    const status = data.status

    if (status === 'succeeded') {
        return {
            status: 'succeeded',
            completed: true,
            failed: false,
            resultUrl: data.content?.video_url
        }
    }

    if (status === 'failed') {
        const errorObj = data.error || {}
        let errorMessage = errorObj.message || 'localized text'

        // localized text
        if (errorObj.code === 'OutputVideoSensitiveContentDetected') {
            errorMessage = 'localized text：localized text'
        } else if (errorObj.code === 'InputImageSensitiveContentDetected') {
            errorMessage = 'localized text：localized text'
        }

        return {
            status: 'failed',
            completed: false,
            failed: true,
            error: errorMessage
        }
    }

    return {
        status,
        completed: false,
        failed: false
    }
}

// ==================== localized text ====================

export type AsyncTaskProvider = 'fal' | 'ark'
export type AsyncTaskType = 'video' | 'image' | 'tts' | 'lipsync'

/**
 * localized text
 * @param provider localized text
 * @param taskId localized textID
 * @param apiKey API Key
 * @param endpoint FALlocalized text（localized textFALlocalized text）
 */
export async function queryAsyncTaskStatus(
    provider: AsyncTaskProvider,
    taskId: string,
    apiKey: string,
    endpoint?: string
): Promise<{
    status: string
    completed: boolean
    failed: boolean
    resultUrl?: string
    error?: string
}> {
    if (provider === 'fal' && endpoint) {
        return queryFalStatus(endpoint, taskId, apiKey)
    } else if (provider === 'ark') {
        return queryArkVideoStatus(taskId, apiKey)
    }

    return {
        status: 'unknown',
        completed: false,
        failed: false
    }
}
