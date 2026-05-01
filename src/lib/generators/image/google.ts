import { logInfo as _ulogInfo, logWarn as _ulogWarn } from '@/lib/logging/core'
/**
 * Google AI localized text
 * 
 * support：
 * - Gemini 3 Pro Image (localized text)
 * - Gemini 2.5 Flash Image (localized text)
 * - Imagen 4
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai'
import { getInternalBaseUrl } from '@/lib/env'
import { BaseImageGenerator, ImageGenerateParams, GenerateResult } from '../base'
import { getProviderConfig } from '@/lib/api-config'
import { getImageBase64Cached } from '@/lib/image-cache'
import { setProxy } from '../../../../lib/prompts/proxy'

type ContentPart = { inlineData: { mimeType: string; data: string } } | { text: string }

interface ImagenResponse {
    generatedImages?: Array<{
        image?: {
            imageBytes?: string
        }
    }>
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'object' && error !== null) {
        const candidate = (error as { message?: unknown }).message
        if (typeof candidate === 'string') return candidate
    }
    return 'localized text'
}

export class GoogleGeminiImageGenerator extends BaseImageGenerator {
    private modelId: string

    constructor(modelId: string = 'gemini-3-pro-image-preview') {
        super()
        this.modelId = modelId
    }

    protected async doGenerate(params: ImageGenerateParams): Promise<GenerateResult> {
        const { userId, prompt, referenceImages = [], options = {} } = params

        const { apiKey } = await getProviderConfig(userId, 'google')
        const {
            aspectRatio,
            resolution
        } = options as {
            aspectRatio?: string
            resolution?: string
            provider?: string
            modelId?: string
            modelKey?: string
        }

        const allowedOptionKeys = new Set([
            'provider',
            'modelId',
            'modelKey',
            'aspectRatio',
            'resolution',
        ])
        for (const [key, value] of Object.entries(options)) {
            if (value === undefined) continue
            if (!allowedOptionKeys.has(key)) {
                throw new Error(`GOOGLE_IMAGE_OPTION_UNSUPPORTED: ${key}`)
            }
        }

        await setProxy()
        const ai = new GoogleGenAI({ apiKey })

        // localized text
        const contentParts: ContentPart[] = []

        // localized text（localized text 14 localized text）
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
                } catch (e) {
                    _ulogWarn(`localized text ${i + 1} failed:`, e)
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

        // localized text（localized text）
        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]

        // localized text API
        const response = await ai.models.generateContent({
            model: this.modelId,
            contents: [{ parts: contentParts }],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                safetySettings,
                ...(aspectRatio || resolution
                    ? {
                        imageConfig: {
                            ...(aspectRatio ? { aspectRatio } : {}),
                            ...(resolution ? { imageSize: resolution } : {}),
                        },
                    }
                    : {})
            }
        })

        // localized text
        const candidate = response.candidates?.[0]
        const parts = candidate?.content?.parts || []

        for (const part of parts) {
            if (part.inlineData) {
                const imageBase64 = part.inlineData.data
                if (imageBase64) {
                    const mimeType = part.inlineData.mimeType || 'image/png'
                    return {
                        success: true,
                        imageBase64,
                        imageUrl: `data:${mimeType};base64,${imageBase64}`
                    }
                }
            }
        }

        // localized text
        const finishReason = candidate?.finishReason
        if (finishReason === 'IMAGE_SAFETY' || finishReason === 'SAFETY') {
            throw new Error('localized text')
        }

        throw new Error('Gemini localized text')
    }
}

/**
 * Google Imagen 4 localized text
 * 
 * localized text Imagen 4 API（localized text Gemini localized text API）
 * support：imagen-4.0-generate-001, imagen-4.0-fast-generate-001, imagen-4.0-ultra-generate-001
 */
export class GoogleImagenGenerator extends BaseImageGenerator {
    private modelId: string

    constructor(modelId: string = 'imagen-4.0-generate-001') {
        super()
        this.modelId = modelId
    }

    protected async doGenerate(params: ImageGenerateParams): Promise<GenerateResult> {
        const { userId, prompt, options = {} } = params

        const { apiKey } = await getProviderConfig(userId, 'google')
        const {
            aspectRatio,
        } = options

        await setProxy()
        const ai = new GoogleGenAI({ apiKey })

        try {
            // localized text Imagen API（localized text Gemini generateContent）
            const response = await ai.models.generateImages({
                model: this.modelId,
                prompt,
                config: {
                    numberOfImages: 1,
                    ...(aspectRatio ? { aspectRatio } : {}),
                }
            })

            // localized text
            const generatedImages = (response as ImagenResponse).generatedImages
            if (generatedImages && generatedImages.length > 0) {
                const imageBytes = generatedImages[0].image?.imageBytes
                if (imageBytes) {
                    return {
                        success: true,
                        imageBase64: imageBytes,
                        imageUrl: `data:image/png;base64,${imageBytes}`
                    }
                }
            }

            throw new Error('Imagen localized text')
        } catch (error: unknown) {
            const message = getErrorMessage(error)
            // localized text
            if (message.includes('SAFETY') || message.includes('blocked')) {
                throw new Error('localized text')
            }
            throw error
        }
    }
}

/**
 * Google Gemini Batch localized text（localized text）
 * 
 * localized text ai.batches.create() localized text
 * localized text API localized text 50%，localized text 24 localized text
 */
export class GoogleGeminiBatchImageGenerator extends BaseImageGenerator {
    protected async doGenerate(params: ImageGenerateParams): Promise<GenerateResult> {
        const { userId, prompt, referenceImages = [], options = {} } = params

        const { apiKey } = await getProviderConfig(userId, 'google')
        const {
            aspectRatio,
            resolution
        } = options as {
            aspectRatio?: string
            resolution?: string
            provider?: string
            modelId?: string
            modelKey?: string
        }

        // localized text Batch API localized text
        const { submitGeminiBatch } = await import('@/lib/gemini-batch-utils')
        await setProxy()

        const result = await submitGeminiBatch(apiKey, prompt, {
            referenceImages,
            ...(aspectRatio ? { aspectRatio } : {}),
            ...(resolution ? { resolution } : {}),
        })

        if (!result.success || !result.batchName) {
            return {
                success: false,
                error: result.error || 'Gemini Batch localized text'
            }
        }

        // localized text
        _ulogInfo(`[Gemini Batch Generator] ✅ localized text: ${result.batchName}`)
        return {
            success: true,
            async: true,
            requestId: result.batchName,  // localized text，localized text: batches/xxx
            externalId: `GEMINI:BATCH:${result.batchName}`  // 🔥 localized text
        }
    }
}
