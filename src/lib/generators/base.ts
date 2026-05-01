import { logWarn as _ulogWarn } from '@/lib/logging/core'
/**
 * localized text
 * 
 * localized text：localized text
 */

// ============================================================
// localized text
// ============================================================

export interface GenerateOptions {
    aspectRatio?: string      // localized text，localized text '16:9', '3:4'
    resolution?: string        // localized text，localized text '2K', '4K'
    outputFormat?: string      // localized text，localized text 'png', 'jpg'
    duration?: number          // localized text（localized text）
    fps?: number              // localized text
    [key: string]: unknown        // localized text
}

export interface GenerateResult {
    success: boolean
    imageUrl?: string         // localized text URL（localized text，localized text）
    imageUrls?: string[]      // localized text URL localized text（localized text）
    imageBase64?: string      // localized text base64（localized text，localized text）
    videoUrl?: string         // localized text URL
    audioUrl?: string         // localized text URL
    error?: string           // localized text
    requestId?: string       // localized text ID（localized text，localized text）
    async?: boolean          // localized text
    endpoint?: string        // localized text（localized text）
    externalId?: string      // 🔥 localized text（localized text FAL:IMAGE:fal-ai/nano-banana-pro:requestId）
}

// ============================================================
// localized text
// ============================================================

export interface ImageGenerateParams {
    userId: string
    prompt: string
    referenceImages?: string[]  // localized text URLs localized text base64
    options?: GenerateOptions
}

export interface ImageGenerator {
    /**
     * localized text
     */
    generate(params: ImageGenerateParams): Promise<GenerateResult>
}

// ============================================================
// localized text
// ============================================================

export interface VideoGenerateParams {
    userId: string
    imageUrl: string           // localized text
    prompt?: string            // localized text（localized text）
    options?: GenerateOptions
}

export interface VideoGenerator {
    /**
     * localized text
     */
    generate(params: VideoGenerateParams): Promise<GenerateResult>
}

// ============================================================
// localized text
// ============================================================

export interface AudioGenerateParams {
    userId: string
    text: string              // localized text
    voice?: string            // localized text
    rate?: number             // localized text
    options?: GenerateOptions
}

export interface AudioGenerator {
    /**
     * localized text
     */
    generate(params: AudioGenerateParams): Promise<GenerateResult>
}

// ============================================================
// localized text（localized text，localized text）
// ============================================================

export abstract class BaseImageGenerator implements ImageGenerator {
    /**
     * localized text（localized text）
     */
    async generate(params: ImageGenerateParams): Promise<GenerateResult> {
        const maxRetries = 2
        let lastError: unknown = null

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.doGenerate(params)
            } catch (error: unknown) {
                lastError = error
                const message = error instanceof Error ? error.message : String(error)
                _ulogWarn(`[Generator] localized text ${attempt}/${maxRetries} failed: ${message}`)

                // localized text，localized text
                if (attempt === maxRetries) {
                    break
                }

                // localized text
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            }
        }

        return {
            success: false,
            error: lastError instanceof Error ? lastError.message : 'localized text'
        }
    }

    /**
     * localized text
     */
    protected abstract doGenerate(params: ImageGenerateParams): Promise<GenerateResult>
}

export abstract class BaseVideoGenerator implements VideoGenerator {
    async generate(params: VideoGenerateParams): Promise<GenerateResult> {
        const maxRetries = 2
        let lastError: unknown = null

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.doGenerate(params)
            } catch (error: unknown) {
                lastError = error
                const message = error instanceof Error ? error.message : String(error)
                _ulogWarn(`[Video Generator] localized text ${attempt}/${maxRetries} failed: ${message}`)
                if (attempt === maxRetries) break
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            }
        }

        return {
            success: false,
            error: lastError instanceof Error ? lastError.message : 'localized text'
        }
    }

    protected abstract doGenerate(params: VideoGenerateParams): Promise<GenerateResult>
}

export abstract class BaseAudioGenerator implements AudioGenerator {
    async generate(params: AudioGenerateParams): Promise<GenerateResult> {
        try {
            return await this.doGenerate(params)
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'localized text'
            }
        }
    }

    protected abstract doGenerate(params: AudioGenerateParams): Promise<GenerateResult>
}
