import { logInfo as _ulogInfo, logWarn as _ulogWarn } from '@/lib/logging/core'
/**
 * 🎯 localized text
 * 
 * localized text：
 * - localized text（720p/1080p/4Klocalized text）localized text
 * - localized text
 * - localized text，localized text
 * 
 * localized text：
 * ```typescript
 * const resolution = adaptVideoResolution('minimax', '1080p')
 * // back: '1080P'
 * ```
 */

// ============================================================
// localized text
// ============================================================

export type VideoProvider = 'minimax' | 'fal' | 'ark' | 'vidu'

// ============================================================
// localized text
// ============================================================

/**
 * localized text
 * key: providerlocalized text
 * value: localized text
 */
const RESOLUTION_ADAPTERS: Record<VideoProvider, (input: string) => string> = {
    /**
     * MiniMax (localized text)
     * support：768P, 1080P
     * 
     * localized text：
     * - 720p/768p → 768P（localized text）
     * - 1080plocalized text → 1080P（localized text，localized text）
     */
    minimax: (input: string): string => {
        const normalized = input.toLowerCase().replace(/[^0-9kp]/g, '')

        // 720p localized text → 768P
        if (normalized.includes('720') || normalized.includes('768')) {
            return '768P'
        }

        // 1080p localized text 1080P（MiniMaxlocalized text）
        return '1080P'
    },

    /**
     * FAL localized text
     * support：720p, 1080p, 1440p, 4K
     * 
     * FALlocalized text，localized text，localized text
     */
    fal: (input: string): string => {
        const normalized = input.toLowerCase()

        if (normalized.includes('720')) return '720p'
        if (normalized.includes('1080')) return '1080p'
        if (normalized.includes('1440') || normalized.includes('2k')) return '1440p'
        if (normalized.includes('4k')) return '4K'

        return '1080p' // Default1080p
    },

    /**
     * Ark localized text (Seedancelocalized text)
     * support：720p, 1080p
     * 
     * localized text：
     * - 720plocalized text → 720p
     * - 1080plocalized text → 1080p
     */
    ark: (input: string): string => {
        const normalized = input.toLowerCase()

        if (normalized.includes('720')) return '720p'
        return '1080p' // localized text1080plocalized text1080p
    },

    /**
     * Vidu localized text（localized text，localized text）
     * support：720p, 1080p, 2K
     * 
     * localized text：
     * - 720p → 720p
     * - 1080p → 1080p
     * - 1440p/2K/4K → 2K
     */
    vidu: (input: string): string => {
        const normalized = input.toLowerCase()

        if (normalized.includes('720')) return '720p'
        if (normalized.includes('1440') || normalized.includes('2k') || normalized.includes('4k')) {
            return '2K'
        }
        return '1080p' // Default1080p
    }
}

// ============================================================
// localized textAPI
// ============================================================

/**
 * localized text
 * 
 * @param provider - localized text
 * @param inputResolution - localized text（localized text '720p', '1080p', '4K'）
 * @returns localized text（localized text）
 * 
 * @example
 * adaptVideoResolution('minimax', '720p')  // back: '768P'
 * adaptVideoResolution('minimax', '1080p') // back: '1080P'
 * adaptVideoResolution('fal', '1080p')     // back: '1080p'
 */
export function adaptVideoResolution(
    provider: string,
    inputResolution: string
): string {
    const adapter = RESOLUTION_ADAPTERS[provider as VideoProvider]

    if (!adapter) {
        _ulogWarn(`[localized text] localized textprovider: ${provider}，localized text: ${inputResolution}`)
        return inputResolution
    }

    const adapted = adapter(inputResolution)
    _ulogInfo(`[localized text] provider=${provider}, localized text=${inputResolution} → localized text=${adapted}`)
    return adapted
}

/**
 * localized text（localized textUIlocalized text）
 * 
 * @param provider - localized text
 * @returns localized text
 */
export function getSupportedResolutions(provider: string): string[] {
    const resolutionMap: Record<VideoProvider, string[]> = {
        minimax: ['768P', '1080P'],
        fal: ['720p', '1080p', '1440p', '4K'],
        ark: ['720p', '1080p'],
        vidu: ['720p', '1080p', '2K']
    }

    return resolutionMap[provider as VideoProvider] || ['720p', '1080p']
}

/**
 * localized text（localized text）
 * 
 * @param provider - localized text
 * @param resolution - localized text
 * @returns localized text
 */
export function isResolutionSupported(provider: string, resolution: string): boolean {
    const supported = getSupportedResolutions(provider)
    return supported.includes(resolution)
}
