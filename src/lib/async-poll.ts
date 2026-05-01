import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

/**
 * localized text
 * 
 * 🔥 localized text：PROVIDER:TYPE:REQUEST_ID
 * 
 * localized text：
 * - FAL:VIDEO:fal-ai/wan/v2.6:abc123
 * - FAL:IMAGE:fal-ai/nano-banana-pro:def456
 * - ARK:VIDEO:task_789
 * - ARK:IMAGE:task_xyz
 * - GEMINI:BATCH:batches/ghi012
 * 
 * localized text：
 * - localized text externalId（localized text）
 */

import { queryFalStatus } from './async-submit'
import { queryGeminiBatchStatus, querySeedanceVideoStatus, queryGoogleVideoStatus } from './async-task-utils'
import { getProviderConfig, getUserModels } from './api-config'
import { buildRenderedTemplateRequest, buildTemplateVariables, normalizeResponseJson, readJsonPath } from './openai-compat-template-runtime'
import { composeModelKey } from './model-config-contract'

const OPENAI_COMPAT_PROVIDER_PREFIX = 'openai-compatible:'
const PROVIDER_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface PollResult {
    status: 'pending' | 'completed' | 'failed'
    resultUrl?: string
    imageUrl?: string
    videoUrl?: string
    downloadHeaders?: Record<string, string>
    error?: string
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'object' && error !== null) {
        const candidate = (error as { message?: unknown }).message
        if (typeof candidate === 'string') return candidate
    }
    return 'localized text'
}

/**
 * localized text externalId localized text provider、type localized text
 */
export function parseExternalId(externalId: string): {
    provider: 'FAL' | 'ARK' | 'GEMINI' | 'GOOGLE' | 'MINIMAX' | 'VIDU' | 'OPENAI' | 'OCOMPAT' | 'BAILIAN' | 'SILICONFLOW' | 'UNKNOWN'
    type: 'VIDEO' | 'IMAGE' | 'BATCH' | 'UNKNOWN'
    endpoint?: string
    requestId: string
    providerToken?: string
    modelKeyToken?: string
} {
    // localized text：PROVIDER:TYPE:...
    if (externalId.startsWith('FAL:')) {
        const parts = externalId.split(':')

        if (parts[1] === 'VIDEO' || parts[1] === 'IMAGE') {
            if (parts.length < 4) {
                throw new Error(`localized text FAL externalId: "${externalId}"，localized text FAL:TYPE:endpoint:requestId`)
            }
            const endpoint = parts.slice(2, -1).join(':')
            const requestId = parts[parts.length - 1]
            if (!endpoint || !requestId) {
                throw new Error(`localized text FAL externalId: "${externalId}"，missing endpoint localized text requestId`)
            }
            return {
                provider: 'FAL',
                type: parts[1] as 'VIDEO' | 'IMAGE',
                endpoint,
                requestId,
            }
        }
        throw new Error(`localized text FAL externalId: "${externalId}"，TYPE localized text VIDEO/IMAGE`)
    }

    if (externalId.startsWith('ARK:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const requestId = parts.slice(2).join(':')
        if ((type !== 'VIDEO' && type !== 'IMAGE') || !requestId) {
            throw new Error(`localized text ARK externalId: "${externalId}"，localized text ARK:TYPE:requestId`)
        }
        return {
            provider: 'ARK',
            type: type as 'VIDEO' | 'IMAGE',
            requestId,
        }
    }

    if (externalId.startsWith('GEMINI:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const requestId = parts.slice(2).join(':')
        if (type !== 'BATCH' || !requestId) {
            throw new Error(`localized text GEMINI externalId: "${externalId}"，localized text GEMINI:BATCH:batchName`)
        }
        return {
            provider: 'GEMINI',
            type: 'BATCH',
            requestId,
        }
    }

    if (externalId.startsWith('GOOGLE:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const requestId = parts.slice(2).join(':')
        if (type !== 'VIDEO' || !requestId) {
            throw new Error(`localized text GOOGLE externalId: "${externalId}"，localized text GOOGLE:VIDEO:operationName`)
        }
        return {
            provider: 'GOOGLE',
            type: 'VIDEO',
            requestId,
        }
    }

    if (externalId.startsWith('MINIMAX:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const requestId = parts.slice(2).join(':')
        if ((type !== 'VIDEO' && type !== 'IMAGE') || !requestId) {
            throw new Error(`localized text MINIMAX externalId: "${externalId}"，localized text MINIMAX:TYPE:taskId`)
        }
        return {
            provider: 'MINIMAX',
            type: type as 'VIDEO' | 'IMAGE',
            requestId,
        }
    }

    if (externalId.startsWith('VIDU:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const requestId = parts.slice(2).join(':')
        if ((type !== 'VIDEO' && type !== 'IMAGE') || !requestId) {
            throw new Error(`localized text VIDU externalId: "${externalId}"，localized text VIDU:TYPE:taskId`)
        }
        return {
            provider: 'VIDU',
            type: type as 'VIDEO' | 'IMAGE',
            requestId,
        }
    }

    if (externalId.startsWith('OPENAI:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const providerToken = parts[2]
        const requestId = parts.slice(3).join(':')
        if (type !== 'VIDEO' || !providerToken || !requestId) {
            throw new Error(`localized text OPENAI externalId: "${externalId}"，localized text OPENAI:VIDEO:providerToken:videoId`)
        }
        return {
            provider: 'OPENAI',
            type: 'VIDEO',
            providerToken,
            requestId,
        }
    }

    if (externalId.startsWith('OCOMPAT:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const providerToken = parts[2]
        const modelKeyToken = parts[3]
        const requestId = parts.slice(4).join(':')
        if ((type !== 'VIDEO' && type !== 'IMAGE') || !providerToken || !modelKeyToken || !requestId) {
            throw new Error(`localized text OCOMPAT externalId: "${externalId}"，localized text OCOMPAT:TYPE:providerToken:modelKeyToken:taskId`)
        }
        return {
            provider: 'OCOMPAT',
            type: type as 'VIDEO' | 'IMAGE',
            providerToken,
            modelKeyToken,
            requestId,
        }
    }

    if (externalId.startsWith('BAILIAN:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const requestId = parts.slice(2).join(':')
        if ((type !== 'VIDEO' && type !== 'IMAGE') || !requestId) {
            throw new Error(`localized text BAILIAN externalId: "${externalId}"，localized text BAILIAN:TYPE:requestId`)
        }
        return {
            provider: 'BAILIAN',
            type: type as 'VIDEO' | 'IMAGE',
            requestId,
        }
    }

    if (externalId.startsWith('SILICONFLOW:')) {
        const parts = externalId.split(':')
        const type = parts[1]
        const requestId = parts.slice(2).join(':')
        if ((type !== 'VIDEO' && type !== 'IMAGE') || !requestId) {
            throw new Error(`localized text SILICONFLOW externalId: "${externalId}"，localized text SILICONFLOW:TYPE:requestId`)
        }
        return {
            provider: 'SILICONFLOW',
            type: type as 'VIDEO' | 'IMAGE',
            requestId,
        }
    }

    throw new Error(
        `localized text externalId localized text: "${externalId}". ` +
        `localized text: FAL:TYPE:endpoint:requestId, ARK:TYPE:requestId, GEMINI:BATCH:batchName, GOOGLE:VIDEO:operationName, MINIMAX:TYPE:taskId, VIDU:TYPE:taskId, OPENAI:VIDEO:providerToken:videoId, OCOMPAT:TYPE:providerToken:modelKeyToken:taskId, BAILIAN:TYPE:requestId, SILICONFLOW:TYPE:requestId`
    )
}

/**
 * localized text
 * localized text externalId localized text
 */
export async function pollAsyncTask(
    externalId: string,
    userId: string
): Promise<PollResult> {
    if (!userId) {
        throw new Error('localized textID，localized text API Key')
    }

    const parsed = parseExternalId(externalId)
    _ulogInfo(`[Poll] localized text ${externalId.slice(0, 30)}... → provider=${parsed.provider}, type=${parsed.type}`)

    switch (parsed.provider) {
        case 'FAL':
            return await pollFalTask(parsed.endpoint!, parsed.requestId, userId)
        case 'ARK':
            return await pollArkTask(parsed.requestId, userId)
        case 'GEMINI':
            return await pollGeminiTask(parsed.requestId, userId)
        case 'GOOGLE':
            return await pollGoogleVideoTask(parsed.requestId, userId)
        case 'MINIMAX':
            return await pollMinimaxTask(parsed.requestId, userId)
        case 'VIDU':
            return await pollViduTask(parsed.requestId, userId)
        case 'OPENAI':
            return await pollOpenAIVideoTask(parsed.requestId, userId, parsed.providerToken)
        case 'OCOMPAT':
            return await pollOCompatTask(parsed.type, parsed.requestId, userId, parsed.providerToken, parsed.modelKeyToken)
        case 'BAILIAN':
            return await pollBailianTask(parsed.requestId, userId)
        case 'SILICONFLOW':
            return await pollSiliconFlowTask(parsed.requestId)
        default:
            // 🔥 remove fallback：localized text provider localized text
            throw new Error(`localized text Provider: ${parsed.provider}`)
    }
}

function decodeProviderId(token: string): string {
    const value = token.trim()
    if (!value) {
        throw new Error('OPENAI_PROVIDER_TOKEN_INVALID')
    }
    if (value.startsWith('u_')) {
        const uuid = value.slice(2).trim()
        if (!PROVIDER_UUID_PATTERN.test(uuid)) {
            throw new Error('OPENAI_PROVIDER_TOKEN_INVALID')
        }
        return `${OPENAI_COMPAT_PROVIDER_PREFIX}${uuid.toLowerCase()}`
    }
    if (PROVIDER_UUID_PATTERN.test(value)) {
        return `${OPENAI_COMPAT_PROVIDER_PREFIX}${value.toLowerCase()}`
    }
    const encoded = value.startsWith('b64_') ? value.slice(4) : value
    try {
        const decoded = Buffer.from(encoded, 'base64url').toString('utf8').trim()
        if (!decoded) {
            throw new Error('OPENAI_PROVIDER_TOKEN_INVALID')
        }
        return decoded
    } catch {
        throw new Error('OPENAI_PROVIDER_TOKEN_INVALID')
    }
}

function decodeModelKey(token: string): string {
    try {
        return Buffer.from(token, 'base64url').toString('utf8')
    } catch {
        throw new Error('OCOMPAT_MODEL_KEY_TOKEN_INVALID')
    }
}

function resolveOCompatModelKey(providerId: string, token: string): string {
    const decoded = decodeModelKey(token).trim()
    if (!decoded) {
        throw new Error('OCOMPAT_MODEL_KEY_TOKEN_INVALID')
    }
    if (decoded.includes('::')) {
        return decoded
    }
    const composed = composeModelKey(providerId, decoded)
    if (!composed) {
        throw new Error('OCOMPAT_MODEL_KEY_TOKEN_INVALID')
    }
    return composed
}

async function pollOCompatTask(
    type: 'VIDEO' | 'IMAGE' | 'BATCH' | 'UNKNOWN',
    taskId: string,
    userId: string,
    providerToken?: string,
    modelKeyToken?: string,
): Promise<PollResult> {
    if (!providerToken) throw new Error('OCOMPAT_PROVIDER_TOKEN_MISSING')
    if (!modelKeyToken) throw new Error('OCOMPAT_MODEL_KEY_TOKEN_MISSING')
    const providerId = decodeProviderId(providerToken)
    const modelKey = resolveOCompatModelKey(providerId, modelKeyToken)
    const config = await getProviderConfig(userId, providerId)
    if (!config.baseUrl) throw new Error(`PROVIDER_BASE_URL_MISSING: ${providerId}`)

    const models = await getUserModels(userId)
    const model = models.find((item) => item.modelKey === modelKey)
    if (!model || !model.compatMediaTemplate) {
        throw new Error(`OCOMPAT_TEMPLATE_NOT_FOUND: ${modelKey}`)
    }
    const template = model.compatMediaTemplate
    if (template.mode !== 'async' || !template.status) {
        throw new Error(`OCOMPAT_TEMPLATE_NOT_ASYNC: ${modelKey}`)
    }

    const variables = buildTemplateVariables({
        model: model.modelId,
        prompt: '',
        taskId,
    })
    const statusRequest = await buildRenderedTemplateRequest({
        baseUrl: config.baseUrl,
        endpoint: template.status,
        variables,
        defaultAuthHeader: `Bearer ${config.apiKey}`,
    })
    const response = await fetch(statusRequest.endpointUrl, {
        method: statusRequest.method,
        headers: statusRequest.headers,
    })
    const rawText = await response.text().catch(() => '')
    if (!response.ok) {
        return {
            status: 'failed',
            error: `OCOMPAT status request failed: ${response.status}`,
        }
    }
    const payload = normalizeResponseJson(rawText)
    const statusRaw = readJsonPath(payload, template.response.statusPath)
    const status = typeof statusRaw === 'string' ? statusRaw.trim().toLowerCase() : ''
    if (!status) {
        return {
            status: 'failed',
            error: 'OCOMPAT status path resolve failed',
        }
    }
    const doneStates = (template.polling?.doneStates || []).map((item) => item.toLowerCase())
    const failStates = (template.polling?.failStates || []).map((item) => item.toLowerCase())
    if (doneStates.includes(status)) {
        const outputUrl = readJsonPath(payload, template.response.outputUrlPath)
        if (typeof outputUrl === 'string' && outputUrl.trim()) {
            return {
                status: 'completed',
                resultUrl: outputUrl.trim(),
                ...(type === 'VIDEO'
                    ? { videoUrl: outputUrl.trim() }
                    : { imageUrl: outputUrl.trim() }),
            }
        }
        if (template.content) {
            const contentRequest = await buildRenderedTemplateRequest({
                baseUrl: config.baseUrl,
                endpoint: template.content,
                variables,
                defaultAuthHeader: `Bearer ${config.apiKey}`,
            })
            return {
                status: 'completed',
                resultUrl: contentRequest.endpointUrl,
                ...(type === 'VIDEO'
                    ? { videoUrl: contentRequest.endpointUrl }
                    : { imageUrl: contentRequest.endpointUrl }),
                downloadHeaders: {
                    ...contentRequest.headers,
                },
            }
        }
        return {
            status: 'failed',
            error: 'OCOMPAT completed but output URL missing',
        }
    }
    if (failStates.includes(status)) {
        const errorRaw = readJsonPath(payload, template.response.errorPath)
        return {
            status: 'failed',
            error: typeof errorRaw === 'string' && errorRaw.trim() ? errorRaw.trim() : `OCOMPAT task failed: ${status}`,
        }
    }
    return { status: 'pending' }
}

async function pollOpenAIVideoTask(
    videoId: string,
    userId: string,
    providerToken?: string,
): Promise<PollResult> {
    if (!providerToken) {
        throw new Error('OPENAI_PROVIDER_TOKEN_MISSING')
    }
    const providerId = decodeProviderId(providerToken)
    const config = await getProviderConfig(userId, providerId)
    if (!config.baseUrl) {
        throw new Error(`PROVIDER_BASE_URL_MISSING: ${config.id}`)
    }

    // Use raw fetch instead of SDK to handle varying response formats across gateways
    const baseUrl = config.baseUrl.replace(/\/+$/, '')
    const pollUrl = `${baseUrl}/videos/${encodeURIComponent(videoId)}`
    const response = await fetch(pollUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${config.apiKey}` },
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`OPENAI_VIDEO_POLL_FAILED: ${response.status} ${text.slice(0, 200)}`)
    }

    const task = await response.json() as Record<string, unknown>
    const status = typeof task.status === 'string' ? task.status : ''

    // Pending statuses: OpenAI uses "queued"/"in_progress", some gateways use "processing"
    if (status === 'queued' || status === 'in_progress' || status === 'processing') {
        return { status: 'pending' }
    }

    if (status === 'failed') {
        const errorObj = task.error as Record<string, unknown> | undefined
        const message = (typeof errorObj?.message === 'string' ? errorObj.message : '')
            || (typeof task.error === 'string' ? task.error : '')
            || `OpenAI video task failed: ${videoId}`
        return { status: 'failed', error: message }
    }

    if (status !== 'completed') {
        // Unknown status, treat as pending
        return { status: 'pending' }
    }

    // Completed: prefer video_url from response body (some gateways provide it directly)
    const videoUrl = typeof task.video_url === 'string' ? task.video_url.trim() : ''
    if (videoUrl) {
        return {
            status: 'completed',
            videoUrl,
            resultUrl: videoUrl,
        }
    }

    // Fallback: OpenAI standard /videos/:id/content endpoint
    const taskId = typeof task.id === 'string' ? task.id : videoId
    const contentUrl = `${baseUrl}/videos/${encodeURIComponent(taskId)}/content`
    return {
        status: 'completed',
        videoUrl: contentUrl,
        resultUrl: contentUrl,
        downloadHeaders: {
            Authorization: `Bearer ${config.apiKey}`,
        },
    }
}

/**
 * FAL localized text
 */
async function pollFalTask(
    endpoint: string,
    requestId: string,
    userId: string
): Promise<PollResult> {
    const { apiKey } = await getProviderConfig(userId, 'fal')
    const result = await queryFalStatus(endpoint, requestId, apiKey)

    return {
        status: result.completed ? (result.failed ? 'failed' : 'completed') : 'pending',
        resultUrl: result.resultUrl,
        imageUrl: result.resultUrl,
        videoUrl: result.resultUrl,
        error: result.error
    }
}

/**
 * Ark localized text
 */
async function pollArkTask(
    taskId: string,
    userId: string
): Promise<PollResult> {
    const { apiKey } = await getProviderConfig(userId, 'ark')
    const result = await querySeedanceVideoStatus(taskId, apiKey)

    return {
        status: result.status,
        videoUrl: result.videoUrl,
        resultUrl: result.videoUrl,
        error: result.error
    }
}

/**
 * Gemini Batch localized text
 */
async function pollGeminiTask(
    batchName: string,
    userId: string
): Promise<PollResult> {
    const { apiKey } = await getProviderConfig(userId, 'google')
    const result = await queryGeminiBatchStatus(batchName, apiKey)

    return {
        status: result.status,
        imageUrl: result.imageUrl,
        resultUrl: result.imageUrl,
        error: result.error
    }
}

/**
 * Google Veo localized text
 */
async function pollGoogleVideoTask(
    operationName: string,
    userId: string
): Promise<PollResult> {
    const { apiKey } = await getProviderConfig(userId, 'google')
    const result = await queryGoogleVideoStatus(operationName, apiKey)

    return {
        status: result.status,
        videoUrl: result.videoUrl,
        resultUrl: result.videoUrl,
        error: result.error
    }
}

/**
 * MiniMax localized text
 */
async function pollMinimaxTask(
    taskId: string,
    userId: string
): Promise<PollResult> {
    const { apiKey } = await getProviderConfig(userId, 'minimax')
    const result = await queryMinimaxTaskStatus(taskId, apiKey)

    return {
        status: result.status,
        videoUrl: result.videoUrl,
        imageUrl: result.imageUrl,
        resultUrl: result.videoUrl || result.imageUrl,
        error: result.error
    }
}

/**
 * localized text MiniMax localized text
 */
async function queryMinimaxTaskStatus(
    taskId: string,
    apiKey: string
): Promise<{ status: 'pending' | 'completed' | 'failed'; videoUrl?: string; imageUrl?: string; error?: string }> {
    const logPrefix = '[MiniMax Query]'

    try {
        const response = await fetch(`https://api.minimaxi.com/v1/query/video_generation?task_id=${taskId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            _ulogError(`${logPrefix} localized text:`, response.status, errorText)
            return {
                status: 'failed',
                error: `localized text: ${response.status}`
            }
        }

        const data = await response.json()

        // localized text
        if (data.base_resp?.status_code !== 0) {
            const errMsg = data.base_resp?.status_msg || 'localized text'
            _ulogError(`${logPrefix} task_id=${taskId} error:`, errMsg)
            return {
                status: 'failed',
                error: errMsg
            }
        }

        const status = data.status

        if (status === 'Success') {
            const fileId = data.file_id
            if (!fileId) {
                _ulogError(`${logPrefix} task_id=${taskId} localized textfile_id`)
                return {
                    status: 'failed',
                    error: 'localized text'
                }
            }

            // 🔥 localized text file_id localized textAPIlocalized textURL
            _ulogInfo(`${logPrefix} task_id=${taskId} localized text，localized textURL...`)
            try {
                const fileResponse = await fetch(`https://api.minimaxi.com/v1/files/retrieve?file_id=${fileId}`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                })

                if (!fileResponse.ok) {
                    const errorText = await fileResponse.text()
                    _ulogError(`${logPrefix} localized text:`, fileResponse.status, errorText)
                    return {
                        status: 'failed',
                        error: `localized text: ${fileResponse.status}`
                    }
                }

                const fileData = await fileResponse.json()
                const downloadUrl = fileData.file?.download_url

                if (!downloadUrl) {
                    _ulogError(`${logPrefix} localized textdownload_url:`, fileData)
                    return {
                        status: 'failed',
                        error: 'localized text'
                    }
                }

                _ulogInfo(`${logPrefix} localized textURLsuccess: ${downloadUrl.substring(0, 80)}...`)
                return {
                    status: 'completed',
                    videoUrl: downloadUrl
                }
            } catch (error: unknown) {
                const errorMessage = getErrorMessage(error)
                _ulogError(`${logPrefix} localized text:`, error)
                return {
                    status: 'failed',
                    error: `localized text: ${errorMessage}`
                }
            }
        } else if (status === 'Failed') {
            const errMsg = data.error_message || 'localized text'
            _ulogError(`${logPrefix} task_id=${taskId} failed:`, errMsg)
            return {
                status: 'failed',
                error: errMsg
            }
        } else {
            // Processing localized text pending
            return {
                status: 'pending'
            }
        }
    } catch (error: unknown) {
        const errorMessage = getErrorMessage(error)
        _ulogError(`${logPrefix} task_id=${taskId} localized text:`, error)
        return {
            status: 'failed',
            error: errorMessage
        }
    }
}

/**
 * Vidu localized text
 */
async function pollViduTask(
    taskId: string,
    userId: string
): Promise<PollResult> {
    _ulogInfo(`[Poll Vidu] localized text task_id=${taskId}, userId=${userId}`)

    const { apiKey } = await getProviderConfig(userId, 'vidu')
    _ulogInfo(`[Poll Vidu] API Key localized text: ${apiKey?.length || 0}`)

    const result = await queryViduTaskStatus(taskId, apiKey)
    _ulogInfo(`[Poll Vidu] localized text:`, result)

    return {
        status: result.status,
        videoUrl: result.videoUrl,
        resultUrl: result.videoUrl,
        error: result.error
    }
}

interface BailianTaskQueryResultItem {
    url?: string
    video_url?: string
    image_url?: string
}

interface BailianTaskQueryResponse {
    code?: string
    message?: string
    task_status?: string
    output?: {
        task_status?: string
        code?: string
        message?: string
        video_url?: string
        image_url?: string
        results?: BailianTaskQueryResultItem[]
    }
}

function readBailianTaskQueryMediaUrl(data: BailianTaskQueryResponse): {
    mediaUrl?: string
    videoUrl?: string
    imageUrl?: string
} {
    const output = data.output
    const videoUrl = typeof output?.video_url === 'string' ? output.video_url.trim() : ''
    if (videoUrl) {
        return { mediaUrl: videoUrl, videoUrl }
    }

    const imageUrl = typeof output?.image_url === 'string' ? output.image_url.trim() : ''
    if (imageUrl) {
        return { mediaUrl: imageUrl, imageUrl }
    }

    const firstResult = Array.isArray(output?.results) ? output.results[0] : undefined
    if (!firstResult || typeof firstResult !== 'object') {
        return {}
    }
    const firstVideoUrl = typeof firstResult.video_url === 'string' ? firstResult.video_url.trim() : ''
    if (firstVideoUrl) {
        return { mediaUrl: firstVideoUrl, videoUrl: firstVideoUrl }
    }
    const firstImageUrl = typeof firstResult.image_url === 'string' ? firstResult.image_url.trim() : ''
    if (firstImageUrl) {
        return { mediaUrl: firstImageUrl, imageUrl: firstImageUrl }
    }
    const firstUrl = typeof firstResult.url === 'string' ? firstResult.url.trim() : ''
    if (firstUrl) {
        return { mediaUrl: firstUrl }
    }

    return {}
}

async function pollBailianTask(requestId: string, userId: string): Promise<PollResult> {
    const logPrefix = '[Bailian Query]'

    try {
        const { apiKey } = await getProviderConfig(userId, 'bailian')
        const response = await fetch(
            `https://dashscope.aliyuncs.com/api/v1/tasks/${encodeURIComponent(requestId)}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            },
        )

        const raw = await response.text()
        let data: BailianTaskQueryResponse = {}
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as unknown
                if (parsed && typeof parsed === 'object') {
                    data = parsed as BailianTaskQueryResponse
                } else {
                    throw new Error('BAILIAN_TASK_QUERY_RESPONSE_INVALID')
                }
            } catch {
                throw new Error('BAILIAN_TASK_QUERY_RESPONSE_INVALID_JSON')
            }
        }

        const outputCode = typeof data.output?.code === 'string' ? data.output.code.trim() : ''
        const outputMessage = typeof data.output?.message === 'string' ? data.output.message.trim() : ''
        const topLevelCode = typeof data.code === 'string' ? data.code.trim() : ''
        const topLevelMessage = typeof data.message === 'string' ? data.message.trim() : ''
        const resolvedCode = outputCode || topLevelCode
        const resolvedMessage = outputMessage || topLevelMessage

        if (!response.ok) {
            return {
                status: 'failed',
                error: `Bailian: localized text ${response.status} ${resolvedCode || resolvedMessage}`.trim(),
            }
        }

        const taskStatus = (typeof data.output?.task_status === 'string'
            ? data.output.task_status
            : typeof data.task_status === 'string'
                ? data.task_status
                : '').trim().toUpperCase()

        if (taskStatus === 'FAILED' || taskStatus === 'CANCELED' || taskStatus === 'CANCELLED') {
            return {
                status: 'failed',
                error: `Bailian: ${resolvedCode || resolvedMessage || 'localized text'}`,
            }
        }

        if (taskStatus === 'SUCCEEDED' || taskStatus === 'SUCCESS') {
            const { mediaUrl, videoUrl, imageUrl } = readBailianTaskQueryMediaUrl(data)
            if (!mediaUrl) {
                return {
                    status: 'failed',
                    error: 'Bailian: localized textURL',
                }
            }
            return {
                status: 'completed',
                resultUrl: mediaUrl,
                videoUrl,
                imageUrl,
            }
        }

        return {
            status: 'pending',
        }
    } catch (error: unknown) {
        const errorMessage = getErrorMessage(error)
        _ulogError(`${logPrefix} task_id=${requestId} localized text:`, error)
        return {
            status: 'failed',
            error: `Bailian: ${errorMessage}`,
        }
    }
}

async function pollSiliconFlowTask(requestId: string): Promise<PollResult> {
    return {
        status: 'failed',
        error: `ASYNC_POLL_NOT_IMPLEMENTED: SILICONFLOW task polling not implemented (${requestId})`,
    }
}

/**
 * localized text Vidu localized text
 */
async function queryViduTaskStatus(
    taskId: string,
    apiKey: string
): Promise<{ status: 'pending' | 'completed' | 'failed'; videoUrl?: string; error?: string }> {
    const logPrefix = '[Vidu Query]'

    try {
        _ulogInfo(`${logPrefix} localized text task_id=${taskId}`)

        // 🔥 localized text：/tasks/{id}/creations
        const response = await fetch(`https://api.vidu.cn/ent/v2/tasks/${taskId}/creations`, {
            headers: {
                'Authorization': `Token ${apiKey}`
            }
        })

        _ulogInfo(`${logPrefix} HTTPlocalized text: ${response.status}`)

        if (!response.ok) {
            const errorText = await response.text()
            _ulogError(`${logPrefix} localized text:`, response.status, errorText)
            return {
                status: 'failed',
                error: `Vidu: localized text ${response.status}`
            }
        }

        const data = await response.json()
        _ulogInfo(`${logPrefix} localized text:`, JSON.stringify(data, null, 2))

        // localized text
        const state = data.state

        if (state === 'success') {
            // 🔥 localized text，localized text creations localized textURL
            const creations = data.creations
            if (!creations || creations.length === 0) {
                _ulogError(`${logPrefix} task_id=${taskId} localized text`)
                return {
                    status: 'failed',
                    error: 'Vidu: localized text'
                }
            }

            const videoUrl = creations[0].url
            if (!videoUrl) {
                _ulogError(`${logPrefix} task_id=${taskId} localized textURL`)
                return {
                    status: 'failed',
                    error: 'Vidu: localized textURL'
                }
            }

            _ulogInfo(`${logPrefix} task_id=${taskId} localized text，localized textURL: ${videoUrl.substring(0, 80)}...`)
            return {
                status: 'completed',
                videoUrl: videoUrl
            }
        } else if (state === 'failed') {
            // 🔥 localized text err_code localized text，add Vidu: localized text
            const errCode = data.err_code || 'Unknown'
            _ulogError(`${logPrefix} task_id=${taskId} failed: ${errCode}`)
            return {
                status: 'failed',
                error: `Vidu: ${errCode}`  // localized text
            }
        } else {
            // created, queueing, processing localized text pending
            return {
                status: 'pending'
            }
        }
    } catch (error: unknown) {
        const errorMessage = getErrorMessage(error)
        _ulogError(`${logPrefix} task_id=${taskId} localized text:`, error)
        return {
            status: 'failed',
            error: `Vidu: ${errorMessage}`  // localized text
        }
    }
}

// ==================== localized text ====================

/**
 * localized text externalId
 */
export function formatExternalId(
    provider: 'FAL' | 'ARK' | 'GEMINI' | 'GOOGLE' | 'MINIMAX' | 'VIDU' | 'OPENAI' | 'OCOMPAT' | 'BAILIAN' | 'SILICONFLOW',
    type: 'VIDEO' | 'IMAGE' | 'BATCH',
    requestId: string,
    endpoint?: string,
    providerToken?: string,
    modelKeyToken?: string,
): string {
    if (provider === 'FAL') {
        if (!endpoint) {
            throw new Error('FAL externalId requires endpoint')
        }
        return `FAL:${type}:${endpoint}:${requestId}`
    }
    if (provider === 'OPENAI') {
        if (!providerToken) {
            throw new Error('OPENAI externalId requires providerToken')
        }
        return `OPENAI:${type}:${providerToken}:${requestId}`
    }
    if (provider === 'OCOMPAT') {
        if (!providerToken) {
            throw new Error('OCOMPAT externalId requires providerToken')
        }
        if (!modelKeyToken) {
            throw new Error('OCOMPAT externalId requires modelKeyToken')
        }
        return `OCOMPAT:${type}:${providerToken}:${modelKeyToken}:${requestId}`
    }
    return `${provider}:${type}:${requestId}`
}
