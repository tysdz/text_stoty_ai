/**
 * Gemini Batch localized text
 * 
 * localized text Google Gemini Batch API localized text
 * localized text: https://ai.google.dev/gemini-api/docs/batch-api
 * 
 * localized text：
 * - localized text API localized text 50%
 * - localized text 24 localized text
 */

import { GoogleGenAI } from '@google/genai'
import { getInternalBaseUrl } from '@/lib/env'
import { getImageBase64Cached } from './image-cache'
import { logInternal } from './logging/semantic'

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

interface GeminiBatchClient {
  batches: {
    create(args: {
      model: string
      src: unknown[]
      config: { displayName: string }
    }): Promise<unknown>
    get(args: { name: string }): Promise<unknown>
  }
}

/**
 * submit Gemini Batch localized text
 * 
 * localized text ai.batches.create() localized text
 * 
 * @param apiKey Google AI API Key
 * @param prompt localized text
 * @param options localized text
 * @returns back batchName（localized text batches/xxx）localized text
 */
export async function submitGeminiBatch(
  apiKey: string,
  prompt: string,
  options?: {
    referenceImages?: string[]
    aspectRatio?: string
    resolution?: string
  }
): Promise<{
  success: boolean
  batchName?: string
  error?: string
}> {
  if (!apiKey) {
    return { success: false, error: 'localized text Google AI API Key' }
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    // localized text content parts
    const contentParts: UnknownRecord[] = []

    // localized text（localized text 14 localized text）
    const referenceImages = options?.referenceImages || []
    for (let i = 0; i < Math.min(referenceImages.length, 14); i++) {
      const imageData = referenceImages[i]

      if (imageData.startsWith('data:')) {
        // Base64 localized text
        const base64Start = imageData.indexOf(';base64,')
        if (base64Start !== -1) {
          const mimeType = imageData.substring(5, base64Start)
          const data = imageData.substring(base64Start + 8)
          contentParts.push({ inlineData: { mimeType, data } })
        }
      } else if (imageData.startsWith('http') || imageData.startsWith('/')) {
        // URL localized text（localized text /api/files/...）：localized text base64
        try {
          // 🔧 localized text：localized text URL
          let fullUrl = imageData
          if (imageData.startsWith('/')) {
            const baseUrl = getInternalBaseUrl()
            fullUrl = `${baseUrl}${imageData}`
          }
          const base64DataUrl = await getImageBase64Cached(fullUrl)
          const base64Start = base64DataUrl.indexOf(';base64,')
          if (base64Start !== -1) {
            const mimeType = base64DataUrl.substring(5, base64Start)
            const data = base64DataUrl.substring(base64Start + 8)
            contentParts.push({ inlineData: { mimeType, data } })
          }
        } catch (e: unknown) {
          logInternal('GeminiBatch', 'WARN', `localized text ${i + 1} failed`, { error: getErrorMessage(e) })
        }
      } else {
        // localized text base64
        contentParts.push({
          inlineData: { mimeType: 'image/png', data: imageData }
        })
      }
    }

    // localized text
    contentParts.push({ text: prompt })

    // localized text（Inline Requests）
    // 🔥 add imageConfig localized text
    const imageConfig: UnknownRecord = {}
    if (options?.aspectRatio) {
      imageConfig.aspectRatio = options.aspectRatio
    }
    if (options?.resolution) {
      imageConfig.imageSize = options.resolution  // 'HD', '4K' localized text
    }

    const inlinedRequests = [
      {
        contents: [{ parts: contentParts }],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],  // 🔥 localized text IMAGE
          ...(Object.keys(imageConfig).length > 0 && { imageConfig })  // 🔥 localized text
        }
      }
    ]

    // 🔥 localized text ai.batches.create localized text
    const batchClient = ai as unknown as GeminiBatchClient
    const batchJob = await batchClient.batches.create({
      model: 'gemini-3-pro-image-preview',
      src: inlinedRequests,
      config: {
        displayName: `image-gen-${Date.now()}`
      }
    })

    const batchName = asRecord(batchJob)?.name  // localized text: batches/xxx

    if (typeof batchName !== 'string' || !batchName) {
      return { success: false, error: 'localized text batch name' }
    }

    logInternal('GeminiBatch', 'INFO', `✅ localized text: ${batchName}`)
    return { success: true, batchName }

  } catch (error: unknown) {
    const message = getErrorMessage(error)
    logInternal('GeminiBatch', 'ERROR', 'localized text', { error: message })
    return { success: false, error: `localized text: ${message}` }
  }
}

/**
 * localized text Gemini Batch localized text
 * 
 * localized text ai.batches.get() localized text
 * 
 * @param batchName localized text（localized text batches/xxx）
 * @param apiKey Google AI API Key
 */
export async function queryGeminiBatchStatus(batchName: string, apiKey: string): Promise<{
  status: string
  completed: boolean
  failed: boolean
  imageBase64?: string
  imageUrl?: string
  error?: string
}> {
  if (!apiKey) {
    return { status: 'error', completed: false, failed: true, error: 'localized text Google AI API Key' }
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    // 🔥 localized text ai.batches.get localized text
    const batchClient = ai as unknown as GeminiBatchClient
    const batchJob = await batchClient.batches.get({ name: batchName })
    const batchRecord = asRecord(batchJob) || {}

    const state = typeof batchRecord.state === 'string' ? batchRecord.state : 'UNKNOWN'
    logInternal('GeminiBatch', 'INFO', `localized text: ${batchName} -> ${state}`)

    // localized text
    const completedStates = new Set([
      'JOB_STATE_SUCCEEDED'
    ])
    const failedStates = new Set([
      'JOB_STATE_FAILED',
      'JOB_STATE_CANCELLED',
      'JOB_STATE_EXPIRED'
    ])

    if (completedStates.has(state)) {
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

            logInternal('GeminiBatch', 'INFO', `✅ localized text，MIME localized text: ${mimeType}`, { batchName })
            return {
              status: 'completed',
              completed: true,
              failed: false,
              imageBase64,
              imageUrl: `data:${mimeType};base64,${imageBase64}`
            }
          }
        }
      }

      // localized text
      return {
        status: 'completed_no_image',
        completed: false,
        failed: true,
        error: 'localized text（localized text）'
      }
    }

    if (failedStates.has(state)) {
      return {
        status: state,
        completed: false,
        failed: true,
        error: `localized text: ${state}`
      }
    }

    // localized text (PENDING, RUNNING localized text)
    return { status: state, completed: false, failed: false }

  } catch (error: unknown) {
    const message = getErrorMessage(error)
    logInternal('GeminiBatch', 'ERROR', 'localized text', { batchName, error: message })
    return { status: 'error', completed: false, failed: false, error: `localized text: ${message}` }
  }
}
