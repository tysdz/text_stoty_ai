import { getInternalBaseUrl } from '@/lib/env'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
/**
 * localized text API localized text
 * 
 * localized text：Vercel（localized text）→ localized text（localized text）localized text
 * 
 * localized text：
 * - 60localized text（Vercel Pro localized text）
 * - localized text（localized text3localized text，localized text）
 * - localized text
 */

const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'

// localized text
const DEFAULT_TIMEOUT_MS = 60 * 1000  // 60localized text
const MAX_RETRIES = 3
const RETRY_DELAY_BASE_MS = 2000  // 2localized text

function normalizeError(error: unknown): {
    name?: string
    message: string
    cause?: string
    status?: number
} {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            cause: error.cause ? String(error.cause) : undefined,
        }
    }
    if (typeof error === 'object' && error !== null) {
        const e = error as {
            name?: unknown
            message?: unknown
            cause?: unknown
            status?: unknown
        }
        return {
            name: typeof e.name === 'string' ? e.name : undefined,
            message: typeof e.message === 'string' ? e.message : 'Unknown error',
            cause: e.cause ? String(e.cause) : undefined,
            status: typeof e.status === 'number' ? e.status : undefined,
        }
    }
    return { message: 'Unknown error' }
}

interface ArkImageGenerationRequest {
    model: string
    prompt: string
    response_format?: 'url' | 'b64_json'
    size?: string  // support '1K' | '2K' | '4K' localized text '2560x1440'
    aspect_ratio?: string  // localized text '3:2', '16:9', '1:1'
    watermark?: boolean
    image?: string[]  // localized text
    sequential_image_generation?: 'enabled' | 'disabled'
    stream?: boolean
}

interface ArkImageGenerationResponse {
    data: Array<{
        url?: string
        b64_json?: string
    }>
}

interface ArkVideoTaskRequest {
    model: string
    content: Array<{
        type: 'image_url' | 'text' | 'draft_task'
        image_url?: { url: string }
        text?: string
        role?: 'first_frame' | 'last_frame' | 'reference_image'
        draft_task?: { id: string }
    }>
    resolution?: '480p' | '720p' | '1080p'
    ratio?: string
    duration?: number
    frames?: number
    seed?: number
    camera_fixed?: boolean
    watermark?: boolean
    return_last_frame?: boolean
    service_tier?: 'default' | 'flex'
    execution_expires_after?: number
    generate_audio?: boolean
    draft?: boolean
}

interface ArkVideoTaskResponse {
    id: string
    model: string
    status: 'processing' | 'succeeded' | 'failed'
    content?: Array<{
        type: 'video_url'
        video_url: { url: string }
    }>
    error?: {
        code: string
        message: string
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0
}

function isInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value)
}

function validateArkVideoTaskRequest(request: ArkVideoTaskRequest) {
    const allowedTopLevelKeys = new Set([
        'model',
        'content',
        'resolution',
        'ratio',
        'duration',
        'frames',
        'seed',
        'camera_fixed',
        'watermark',
        'return_last_frame',
        'service_tier',
        'execution_expires_after',
        'generate_audio',
        'draft',
    ])
    for (const key of Object.keys(request)) {
        if (!allowedTopLevelKeys.has(key)) {
            throw new Error(`ARK_VIDEO_REQUEST_FIELD_UNSUPPORTED: ${key}`)
        }
    }

    if (!isNonEmptyString(request.model)) {
        throw new Error('ARK_VIDEO_REQUEST_INVALID: model is required')
    }
    if (!Array.isArray(request.content) || request.content.length === 0) {
        throw new Error('ARK_VIDEO_REQUEST_INVALID: content must be a non-empty array')
    }

    const allowedRatios = new Set(['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'])
    if (request.ratio !== undefined && !allowedRatios.has(request.ratio)) {
        throw new Error(`ARK_VIDEO_REQUEST_INVALID: ratio=${request.ratio}`)
    }

    if (request.resolution !== undefined && request.resolution !== '480p' && request.resolution !== '720p' && request.resolution !== '1080p') {
        throw new Error(`ARK_VIDEO_REQUEST_INVALID: resolution=${request.resolution}`)
    }

    if (request.duration !== undefined) {
        if (!isInteger(request.duration)) {
            throw new Error('ARK_VIDEO_REQUEST_INVALID: duration must be integer')
        }
        if (request.duration !== -1 && (request.duration < 2 || request.duration > 12)) {
            throw new Error(`ARK_VIDEO_REQUEST_INVALID: duration=${request.duration}`)
        }
    }

    if (request.frames !== undefined) {
        if (!isInteger(request.frames)) {
            throw new Error('ARK_VIDEO_REQUEST_INVALID: frames must be integer')
        }
        if (request.frames < 29 || request.frames > 289 || (request.frames - 25) % 4 !== 0) {
            throw new Error(`ARK_VIDEO_REQUEST_INVALID: frames=${request.frames}`)
        }
    }

    if (request.seed !== undefined) {
        if (!isInteger(request.seed)) {
            throw new Error('ARK_VIDEO_REQUEST_INVALID: seed must be integer')
        }
        if (request.seed < -1 || request.seed > 4294967295) {
            throw new Error(`ARK_VIDEO_REQUEST_INVALID: seed=${request.seed}`)
        }
    }

    if (request.execution_expires_after !== undefined) {
        if (!isInteger(request.execution_expires_after)) {
            throw new Error('ARK_VIDEO_REQUEST_INVALID: execution_expires_after must be integer')
        }
        if (request.execution_expires_after < 3600 || request.execution_expires_after > 259200) {
            throw new Error(`ARK_VIDEO_REQUEST_INVALID: execution_expires_after=${request.execution_expires_after}`)
        }
    }

    if (
        request.service_tier !== undefined
        && request.service_tier !== 'default'
        && request.service_tier !== 'flex'
    ) {
        throw new Error(`ARK_VIDEO_REQUEST_INVALID: service_tier=${String(request.service_tier)}`)
    }

    if (request.draft === true) {
        if (request.resolution !== undefined && request.resolution !== '480p') {
            throw new Error('ARK_VIDEO_REQUEST_INVALID: draft only supports 480p')
        }
        if (request.return_last_frame === true) {
            throw new Error('ARK_VIDEO_REQUEST_INVALID: return_last_frame is not supported when draft=true')
        }
        if (request.service_tier === 'flex') {
            throw new Error('ARK_VIDEO_REQUEST_INVALID: service_tier=flex is not supported when draft=true')
        }
    }

    for (let index = 0; index < request.content.length; index += 1) {
        const item = request.content[index]
        const path = `content[${index}]`
        if (!isRecord(item)) {
            throw new Error(`ARK_VIDEO_REQUEST_INVALID: ${path} must be object`)
        }

        if (item.type === 'text') {
            if (!isNonEmptyString(item.text)) {
                throw new Error(`ARK_VIDEO_REQUEST_INVALID: ${path}.text is required`)
            }
            continue
        }

        if (item.type === 'image_url') {
            if (!isRecord(item.image_url) || !isNonEmptyString(item.image_url.url)) {
                throw new Error(`ARK_VIDEO_REQUEST_INVALID: ${path}.image_url.url is required`)
            }
            if (
                item.role !== undefined
                && item.role !== 'first_frame'
                && item.role !== 'last_frame'
                && item.role !== 'reference_image'
            ) {
                throw new Error(`ARK_VIDEO_REQUEST_INVALID: ${path}.role=${String(item.role)}`)
            }
            continue
        }

        if (item.type === 'draft_task') {
            if (!isRecord(item.draft_task) || !isNonEmptyString(item.draft_task.id)) {
                throw new Error(`ARK_VIDEO_REQUEST_INVALID: ${path}.draft_task.id is required`)
            }
            continue
        }

        throw new Error(`ARK_VIDEO_REQUEST_INVALID: ${path}.type=${String((item as { type?: unknown }).type)}`)
    }
}

/**
 * localized text fetch localized text
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // 🔧 localized text：localized text URL
    let fullUrl = url
    if (url.startsWith('/')) {
        // localized text fetch localized text URL，localized text localhost:3000 localized text
        const baseUrl = getInternalBaseUrl()
        fullUrl = `${baseUrl}${url}`
    }

    try {
        const response = await fetch(fullUrl, {
            ...options,
            signal: controller.signal
        })
        return response
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * localized text fetch localized text
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = MAX_RETRIES,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    logPrefix: string = '[Ark API]'
): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            _ulogInfo(`${logPrefix} Episode  ${attempt}/${maxRetries} localized text`)

            const response = await fetchWithTimeout(url, options, timeoutMs)

            // localized text
            if (response.ok) {
                if (attempt > 1) {
                    _ulogInfo(`${logPrefix} Episode  ${attempt} localized text`)
                }
                return response
            }

            // HTTP error，localized text，localized text
            const errorText = await response.text()
            _ulogError(`${logPrefix} HTTP ${response.status}: ${errorText}`)

            // localized text（localized text 400 localized text、403 localized text）
            if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
                // localized text Response
                return new Response(errorText, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                })
            }

            lastError = new Error(`HTTP ${response.status}: ${errorText}`)
        } catch (error: unknown) {
            const normalized = normalizeError(error)
            lastError = error instanceof Error ? error : new Error(normalized.message)

            // localized text
            const errorDetails = {
                attempt,
                maxRetries,
                errorName: normalized.name,
                errorMessage: normalized.message,
                errorCause: normalized.cause,
                isAbortError: normalized.name === 'AbortError',
                isTimeoutError: normalized.name === 'AbortError' || normalized.message.includes('timeout'),
                isNetworkError: normalized.message.includes('fetch failed') || normalized.name === 'TypeError'
            }

            _ulogError(`${logPrefix} Episode  ${attempt}/${maxRetries} localized text:`, JSON.stringify(errorDetails, null, 2))
        }

        // localized text，localized text
        if (attempt < maxRetries) {
            const delayMs = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1)  // localized text：2s, 4s, 8s
            _ulogInfo(`${logPrefix} localized text ${delayMs / 1000} localized text...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
        }
    }

    // localized text
    throw lastError || new Error(`${logPrefix} localized text ${maxRetries} localized text`)
}

/**
 * localized text API
 */
export async function arkImageGeneration(
    request: ArkImageGenerationRequest,
    options?: {
        apiKey: string  // localized text API Key
        timeoutMs?: number
        maxRetries?: number
        logPrefix?: string
    }
): Promise<ArkImageGenerationResponse> {
    if (!options?.apiKey) {
        throw new Error('localized text API Key')
    }

    const {
        apiKey,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        maxRetries = MAX_RETRIES,
        logPrefix = '[Ark Image]'
    } = options

    const url = `${ARK_BASE_URL}/images/generations`

    _ulogInfo(`${logPrefix} localized text, localized text: ${request.model}`)
    _ulogInfo(`${logPrefix} localized text:`, JSON.stringify({
        model: request.model,
        size: request.size,
        aspect_ratio: request.aspect_ratio,
        watermark: request.watermark,
        imageCount: request.image?.length || 0,
        promptLength: request.prompt?.length || 0
    }))

    const response = await fetchWithRetry(
        url,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(request)
        },
        maxRetries,
        timeoutMs,
        logPrefix
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${logPrefix} localized text: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    _ulogInfo(`${logPrefix} localized text`)
    return data
}

/**
 * localized text API
 */
export async function arkCreateVideoTask(
    request: ArkVideoTaskRequest,
    options: {
        apiKey: string  // localized text API Key
        timeoutMs?: number
        maxRetries?: number
        logPrefix?: string
    }
): Promise<{ id: string; [key: string]: unknown }> {
    if (!options.apiKey) {
        throw new Error('localized text API Key')
    }
    validateArkVideoTaskRequest(request)

    const {
        apiKey,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        maxRetries = MAX_RETRIES,
        logPrefix = '[Ark Video]'
    } = options

    const url = `${ARK_BASE_URL}/contents/generations/tasks`

    _ulogInfo(`${logPrefix} localized text, localized text: ${request.model}`)

    const response = await fetchWithRetry(
        url,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(request)
        },
        maxRetries,
        timeoutMs,
        logPrefix
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${logPrefix} localized text: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const taskId = data.id
    _ulogInfo(`${logPrefix} localized text, taskId: ${taskId}`)
    return { id: taskId, ...data }
}

/**
 * localized text API
 */
export async function arkQueryVideoTask(
    taskId: string,
    options: {
        apiKey: string  // localized text API Key
        timeoutMs?: number
        maxRetries?: number
        logPrefix?: string
    }
): Promise<ArkVideoTaskResponse> {
    if (!options.apiKey) {
        throw new Error('localized text API Key')
    }

    const {
        apiKey,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        maxRetries = MAX_RETRIES,
        logPrefix = '[Ark Video]'
    } = options

    const url = `${ARK_BASE_URL}/contents/generations/tasks/${taskId}`

    const response = await fetchWithRetry(
        url,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        },
        maxRetries,
        timeoutMs,
        logPrefix
    )

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`${logPrefix} localized text: ${response.status} - ${errorText}`)
    }

    return await response.json()
}

/**
 * localized text fetch localized text
 * localized text、localized text
 */
export async function fetchWithTimeoutAndRetry(
    url: string,
    options?: RequestInit & {
        timeoutMs?: number
        maxRetries?: number
        logPrefix?: string
    }
): Promise<Response> {
    const {
        timeoutMs = DEFAULT_TIMEOUT_MS,
        maxRetries = MAX_RETRIES,
        logPrefix = '[Fetch]',
        ...fetchOptions
    } = options || {}

    return fetchWithRetry(url, fetchOptions, maxRetries, timeoutMs, logPrefix)
}

// localized text，localized text
export const ARK_API_TIMEOUT_MS = DEFAULT_TIMEOUT_MS
export const ARK_API_MAX_RETRIES = MAX_RETRIES
