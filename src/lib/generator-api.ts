import { logInfo as _ulogInfo } from '@/lib/logging/core'
/**
 * localized text（localized text）
 * 
 * support：
 * - localized text model_key（provider::modelId）
 * - localized text（localized text）
 * - localized text
 */

import { createAudioGenerator, createImageGenerator, createVideoGenerator } from './generators/factory'
import type { GenerateResult } from './generators/base'
import { getProviderConfig, getProviderKey, resolveModelSelection } from './api-config'
import {
    generateImageViaOpenAICompat,
    generateImageViaOpenAICompatTemplate,
    generateVideoViaOpenAICompat,
    generateVideoViaOpenAICompatTemplate,
    resolveModelGatewayRoute,
} from './model-gateway'
import { generateBailianAudio, generateBailianImage, generateBailianVideo } from './providers/bailian'
import { generateSiliconFlowAudio, generateSiliconFlowImage, generateSiliconFlowVideo } from './providers/siliconflow'

const OFFICIAL_ONLY_PROVIDER_KEYS = new Set(['bailian', 'siliconflow'])

/**
 * localized text aspectRatio localized text OpenAI localized text size
 */
function aspectRatioToOpenAISize(aspectRatio: string | undefined): string | undefined {
    if (!aspectRatio) return undefined
    const ratio = aspectRatio.trim()
    // OpenAI localized text: 1024x1024, 1792x1024, 1024x1792, 1536x1024, 1024x1536
    const mapping: Record<string, string> = {
        '1:1': '1024x1024',
        '16:9': '1792x1024',
        '9:16': '1024x1792',
        '3:2': '1536x1024',
        '2:3': '1024x1536',
    }
    return mapping[ratio] || undefined
}

/**
 * localized text（localized text）
 * 
 * @param userId localized text ID
 * @param modelKey localized text（provider::modelId）
 * @param prompt localized text
 * @param options localized text
 */
export async function generateImage(
    userId: string,
    modelKey: string,
    prompt: string,
    options?: {
        referenceImages?: string[]
        aspectRatio?: string
        resolution?: string
        outputFormat?: string
        keepOriginalAspectRatio?: boolean  // 🔥 localized text
        size?: string  // 🔥 localized text "5016x3344"（localized text aspectRatio）
    }
): Promise<GenerateResult> {
    const selection = await resolveModelSelection(userId, modelKey, 'image')
    _ulogInfo(`[generateImage] resolved model selection: ${selection.modelKey}`)
    const providerConfig = await getProviderConfig(userId, selection.provider)
    const providerKey = getProviderKey(selection.provider).toLowerCase()
    if (providerKey === 'bailian') {
        return await generateBailianImage({
            userId,
            prompt,
            referenceImages: options?.referenceImages,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    if (providerKey === 'siliconflow') {
        return await generateSiliconFlowImage({
            userId,
            prompt,
            referenceImages: options?.referenceImages,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    const defaultGatewayRoute = resolveModelGatewayRoute(selection.provider)
    let gatewayRoute = OFFICIAL_ONLY_PROVIDER_KEYS.has(providerKey)
        ? 'official'
        : (providerConfig.gatewayRoute || defaultGatewayRoute)
    if (providerKey === 'gemini-compatible') {
        // DEPRECATED: historical rows persisted gemini-compatible as openai-compat by default.
        // Runtime now resolves route by apiMode to avoid requiring data migration SQL.
        gatewayRoute = providerConfig.apiMode === 'openai-official' ? 'openai-compat' : 'official'
    }

    // localized text（localized text referenceImages localized text，localized text options）
    const { referenceImages, ...generatorOptions } = options || {}
    if (gatewayRoute === 'openai-compat') {
        const compatTemplate = selection.compatMediaTemplate
        if (providerKey === 'openai-compatible' && !compatTemplate) {
            throw new Error(`MODEL_COMPAT_MEDIA_TEMPLATE_REQUIRED: ${selection.modelKey}`)
        }
        if (compatTemplate) {
            return await generateImageViaOpenAICompatTemplate({
                userId,
                providerId: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
                prompt,
                referenceImages,
                options: {
                    ...generatorOptions,
                    provider: selection.provider,
                    modelId: selection.modelId,
                    modelKey: selection.modelKey,
                },
                profile: 'openai-compatible',
                template: compatTemplate,
            })
        }

        // OpenAI localized text：localized text aspectRatio localized text size
        let openaiCompatOptions = { ...generatorOptions }
        if (openaiCompatOptions.aspectRatio) {
            const mappedSize = aspectRatioToOpenAISize(openaiCompatOptions.aspectRatio)
            if (mappedSize && !openaiCompatOptions.size) {
                openaiCompatOptions = { ...openaiCompatOptions, size: mappedSize }
            }
            // localized text aspectRatio
            delete openaiCompatOptions.aspectRatio
        }

        return await generateImageViaOpenAICompat({
            userId,
            providerId: selection.provider,
            modelId: selection.modelId,
            prompt,
            referenceImages,
            options: {
                ...openaiCompatOptions,
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
            profile: 'openai-compatible',
        })
    }

    const generator = createImageGenerator(selection.provider, selection.modelId)
    return await generator.generate({
        userId,
        prompt,
        referenceImages,
        options: {
            ...generatorOptions,
            provider: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
        }
    })
}

/**
 * localized text（localized text）
 * 
 * @param userId localized text ID
 * @param modelKey localized text（provider::modelId）
 * @param imageUrl localized text URL
 * @param options localized text
 */
export async function generateVideo(
    userId: string,
    modelKey: string,
    imageUrl: string,
    options?: {
        prompt?: string
        duration?: number
        fps?: number
        resolution?: string      // '720p' | '1080p'
        aspectRatio?: string     // '16:9' | '9:16'
        generateAudio?: boolean  // localized text Seedance 1.5 Pro support
        lastFrameImageUrl?: string  // localized text
        [key: string]: string | number | boolean | undefined
    }
): Promise<GenerateResult> {
    const selection = await resolveModelSelection(userId, modelKey, 'video')
    _ulogInfo(`[generateVideo] resolved model selection: ${selection.modelKey}`)
    const providerKey = getProviderKey(selection.provider).toLowerCase()
    if (providerKey === 'bailian') {
        return await generateBailianVideo({
            userId,
            imageUrl,
            prompt: options?.prompt,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    if (providerKey === 'siliconflow') {
        return await generateSiliconFlowVideo({
            userId,
            imageUrl,
            prompt: options?.prompt,
            options: {
                ...(options || {}),
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    const providerConfig = await getProviderConfig(userId, selection.provider)
    const defaultGatewayRoute = resolveModelGatewayRoute(selection.provider)
    const gatewayRoute = OFFICIAL_ONLY_PROVIDER_KEYS.has(providerKey)
        ? 'official'
        : (providerConfig.gatewayRoute || defaultGatewayRoute)

    const { prompt, ...providerOptions } = options || {}
    if (gatewayRoute === 'openai-compat') {
        const compatTemplate = selection.compatMediaTemplate
        if (providerKey === 'openai-compatible' && !compatTemplate) {
            throw new Error(`MODEL_COMPAT_MEDIA_TEMPLATE_REQUIRED: ${selection.modelKey}`)
        }
        if (compatTemplate) {
            return await generateVideoViaOpenAICompatTemplate({
                userId,
                providerId: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
                imageUrl,
                prompt: prompt || '',
                options: {
                    ...providerOptions,
                    provider: selection.provider,
                    modelId: selection.modelId,
                    modelKey: selection.modelKey,
                },
                profile: 'openai-compatible',
                template: compatTemplate,
            })
        }

        return await generateVideoViaOpenAICompat({
            userId,
            providerId: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
            imageUrl,
            prompt: prompt || '',
            options: {
                ...providerOptions,
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
            profile: 'openai-compatible',
        })
    }

    const generator = createVideoGenerator(selection.provider)
    return await generator.generate({
        userId,
        imageUrl,
        prompt,
        options: {
            ...providerOptions,
            provider: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
        }
    })
}

/**
 * localized text
 */
export async function generateAudio(
    userId: string,
    modelKey: string,
    text: string,
    options?: {
        voice?: string
        rate?: number
    }
): Promise<GenerateResult> {
    const selection = await resolveModelSelection(userId, modelKey, 'audio')
    const providerKey = getProviderKey(selection.provider).toLowerCase()
    if (providerKey === 'bailian') {
        return await generateBailianAudio({
            userId,
            text,
            voice: options?.voice,
            rate: options?.rate,
            options: {
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    if (providerKey === 'siliconflow') {
        return await generateSiliconFlowAudio({
            userId,
            text,
            voice: options?.voice,
            rate: options?.rate,
            options: {
                provider: selection.provider,
                modelId: selection.modelId,
                modelKey: selection.modelKey,
            },
        })
    }
    const generator = createAudioGenerator(selection.provider)

    return generator.generate({
        userId,
        text,
        voice: options?.voice,
        rate: options?.rate,
        options: {
            provider: selection.provider,
            modelId: selection.modelId,
            modelKey: selection.modelKey,
        },
    })
}
