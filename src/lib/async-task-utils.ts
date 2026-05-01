/**
 * localized text
 * localized text AI localized text
 * 
 * localized text：API Key localized text，localized text
 */

import { logInternal } from './logging/semantic'
import { buildFalQueueUrl } from '@/lib/providers/fal/base-url'

export interface TaskStatus {
    status: 'pending' | 'completed' | 'failed'
    imageUrl?: string
    videoUrl?: string
    error?: string
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
    return value && typeof value === 'object' ? (value as UnknownRecord) : null
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    const record = asRecord(error)
    if (record && typeof record.message === 'string') return record.message
    return String(error)
}

function getErrorStatus(error: unknown): number | undefined {
    const record = asRecord(error)
    if (!record) return undefined
    return typeof record.status === 'number' ? record.status : undefined
}

interface GeminiBatchClient {
    batches: {
        get(args: { name: string }): Promise<unknown>
    }
}

/**
 * localized text FAL Banana localized text
 * @param requestId localized textID
 * @param apiKey FAL API Key
 */
export async function queryBananaTaskStatus(requestId: string, apiKey: string): Promise<TaskStatus> {
    if (!apiKey) {
        throw new Error('localized text FAL API Key')
    }

    try {
        const statusResponse = await fetch(
            buildFalQueueUrl(`fal-ai/nano-banana-pro/requests/${requestId}/status`),
            {
                headers: { 'Authorization': `Key ${apiKey}` },
                cache: 'no-store'
            }
        )

        if (!statusResponse.ok) {
            logInternal('Banana', 'ERROR', `Status query failed: ${statusResponse.status}`)
            return { status: 'pending' }
        }

        const data = await statusResponse.json()

        if (data.status === 'COMPLETED') {
            // localized text
            const resultResponse = await fetch(
                buildFalQueueUrl(`fal-ai/nano-banana-pro/requests/${requestId}`),
                {
                    headers: { 'Authorization': `Key ${apiKey}` },
                    cache: 'no-store'
                }
            )

            if (resultResponse.ok) {
                const result = await resultResponse.json()
                const imageUrl = result.images?.[0]?.url

                if (imageUrl) {
                    return { status: 'completed', imageUrl }
                }
            }

            return { status: 'failed', error: 'No image URL in result' }
        } else if (data.status === 'FAILED') {
            return { status: 'failed', error: data.error || 'Banana generation failed' }
        }

        return { status: 'pending' }
    } catch (error: unknown) {
        logInternal('Banana', 'ERROR', 'Query error', { error: getErrorMessage(error) })
        return { status: 'pending' }
    }
}

/**
 * localized text Gemini Batch localized text
 * localized text ai.batches.get() localized text
 * @param batchName localized text（localized text batches/xxx）
 * @param apiKey Google AI API Key
 */
export async function queryGeminiBatchStatus(batchName: string, apiKey: string): Promise<TaskStatus> {
    if (!apiKey) {
        throw new Error('localized text Google AI API Key')
    }

    try {
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey })

        // 🔥 localized text ai.batches.get localized text
        const batchClient = ai as unknown as GeminiBatchClient
        const batchJob = await batchClient.batches.get({ name: batchName })
        const batchRecord = asRecord(batchJob) || {}

        const state = typeof batchRecord.state === 'string' ? batchRecord.state : 'UNKNOWN'
        logInternal('GeminiBatch', 'INFO', `localized text: ${batchName} -> ${state}`)

        // localized text
        if (state === 'JOB_STATE_SUCCEEDED') {
            // localized text inlinedResponses localized text
            const dest = asRecord(batchRecord.dest)
            const responses = Array.isArray(dest?.inlinedResponses) ? dest.inlinedResponses : []

            if (responses.length > 0) {
                const firstResponse = asRecord(responses[0])
                const response = asRecord(firstResponse?.response)
                const candidates = Array.isArray(response?.candidates) ? response.candidates : []
                const firstCandidate = asRecord(candidates[0])
                const content = asRecord(firstCandidate?.content)
                const parts = Array.isArray(content?.parts) ? content.parts : []

                for (const part of parts) {
                    const partRecord = asRecord(part)
                    const inlineData = asRecord(partRecord?.inlineData)
                    if (typeof inlineData?.data === 'string') {
                        const imageBase64 = inlineData.data
                        const mimeType = typeof inlineData.mimeType === 'string' ? inlineData.mimeType : 'image/png'
                        const imageUrl = `data:${mimeType};base64,${imageBase64}`

                        logInternal('GeminiBatch', 'INFO', `✅ localized text，MIME localized text: ${mimeType}`, { batchName })
                        return { status: 'completed', imageUrl }
                    }
                }
            }

            return { status: 'failed', error: 'No image data in batch result' }
        } else if (state === 'JOB_STATE_FAILED' || state === 'JOB_STATE_CANCELLED' || state === 'JOB_STATE_EXPIRED') {
            return { status: 'failed', error: `Gemini Batch failed: ${state}` }
        }

        // localized text (PENDING, RUNNING localized text)
        return { status: 'pending' }
    } catch (error: unknown) {
        const message = getErrorMessage(error)
        const status = getErrorStatus(error)
        logInternal('GeminiBatch', 'ERROR', 'Query error', { batchName, error: message, status })
        // localized text 404 localized text，localized text（localized text）
        if (status === 404 || message.includes('404') || message.includes('not found') || message.includes('NOT_FOUND')) {
            return { status: 'failed', error: `Batch task not found` }
        }
        return { status: 'pending' }
    }
}

/**
 * localized text Google Veo localized text
 * @param operationName localized text（localized text operations/xxx）
 * @param apiKey Google AI API Key
 */
export async function queryGoogleVideoStatus(operationName: string, apiKey: string): Promise<TaskStatus> {
    if (!apiKey) {
        throw new Error('localized text Google AI API Key')
    }

    const logPrefix = '[Veo Query]'

    try {
        const { GoogleGenAI, GenerateVideosOperation } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey })
        const operation = new GenerateVideosOperation()
        operation.name = operationName
        const op = await ai.operations.getVideosOperation({ operation })

        // localized text
        logInternal('Veo', 'INFO', `${logPrefix} localized text`, {
            operationName,
            done: op.done,
            hasError: !!op.error,
            hasResponse: !!op.response,
            responseKeys: op.response ? Object.keys(op.response) : [],
            generatedVideosCount: op.response?.generatedVideos?.length ?? 0,
            raiFilteredCount: (op.response as Record<string, unknown>)?.raiMediaFilteredCount ?? null,
            raiFilteredReasons: (op.response as Record<string, unknown>)?.raiMediaFilteredReasons ?? null,
        })

        if (!op.done) {
            return { status: 'pending' }
        }

        // localized text
        if (op.error) {
            const errRecord = asRecord(op.error)
            const message = (typeof errRecord?.message === 'string' && errRecord.message)
                || (typeof errRecord?.statusMessage === 'string' && errRecord.statusMessage)
                || 'Veo localized text'
            logInternal('Veo', 'ERROR', `${logPrefix} localized text`, { operationName, error: op.error })
            return { status: 'failed', error: message }
        }

        const response = op.response
        if (!response) {
            logInternal('Veo', 'ERROR', `${logPrefix} done=true localized text response localized text`, { operationName })
            return { status: 'failed', error: 'Veo localized text' }
        }

        // check RAI localized text
        const responseRecord = asRecord(response) || {}
        const raiFilteredCount = responseRecord.raiMediaFilteredCount
        const raiFilteredReasons = responseRecord.raiMediaFilteredReasons

        if (typeof raiFilteredCount === 'number' && raiFilteredCount > 0) {
            const reasons = Array.isArray(raiFilteredReasons)
                ? raiFilteredReasons.join(', ')
                : 'localized text'
            logInternal('Veo', 'ERROR', `${logPrefix} localized text RAI localized text`, {
                operationName,
                raiFilteredCount,
                raiFilteredReasons: reasons,
            })
            return {
                status: 'failed',
                error: `Veo localized text (${raiFilteredCount} localized text, localized text: ${reasons})`,
            }
        }

        // localized text URL
        const generatedVideos = response.generatedVideos
        if (Array.isArray(generatedVideos) && generatedVideos.length > 0) {
            const first = generatedVideos[0]
            const videoUri = first?.video?.uri

            if (videoUri) {
                logInternal('Veo', 'INFO', `${logPrefix} localized text`, {
                    operationName,
                    videoUri: videoUri.substring(0, 80),
                })
                return { status: 'completed', videoUrl: videoUri }
            }

            // video localized text uri，localized text
            logInternal('Veo', 'ERROR', `${logPrefix} generatedVideos[0] localized text video.uri`, {
                operationName,
                firstVideo: JSON.stringify(first, null, 2),
            })
            return { status: 'failed', error: 'Veo localized text URI' }
        }

        // generatedVideos localized text，localized text response localized text
        logInternal('Veo', 'ERROR', `${logPrefix} none generatedVideos`, {
            operationName,
            responseKeys: Object.keys(responseRecord),
            fullResponse: JSON.stringify(responseRecord, null, 2).substring(0, 2000),
            raiFilteredCount: raiFilteredCount ?? 'N/A',
            raiFilteredReasons: raiFilteredReasons ?? 'N/A',
        })
        return { status: 'failed', error: 'Veo localized text (generatedVideos localized text)' }
    } catch (error: unknown) {
        const message = getErrorMessage(error)
        logInternal('Veo', 'ERROR', `${logPrefix} localized text`, { operationName, error: message })
        return { status: 'failed', error: message }
    }
}

/**
 * localized text Seedance localized text
 * @param taskId localized textID
 * @param apiKey localized text API Key
 */
export async function querySeedanceVideoStatus(taskId: string, apiKey: string): Promise<TaskStatus> {
    if (!apiKey) {
        throw new Error('localized text API Key')
    }

    try {
        const queryResponse = await fetch(
            `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                cache: 'no-store'
            }
        )

        if (!queryResponse.ok) {
            logInternal('Seedance', 'ERROR', `Status query failed: ${queryResponse.status}`)
            return { status: 'pending' }
        }

        const queryData = await queryResponse.json()
        const status = queryData.status

        if (status === 'succeeded') {
            const videoUrl = queryData.content?.video_url

            if (videoUrl) {
                return { status: 'completed', videoUrl }
            }

            return { status: 'failed', error: 'No video URL in response' }
        } else if (status === 'failed') {
            const errorObj = queryData.error || {}
            const errorMessage = errorObj.message || 'Unknown error'
            return { status: 'failed', error: errorMessage }
        }

        return { status: 'pending' }
    } catch (error: unknown) {
        logInternal('Seedance', 'ERROR', 'Query error', { error: getErrorMessage(error) })
        return { status: 'pending' }
    }
}
