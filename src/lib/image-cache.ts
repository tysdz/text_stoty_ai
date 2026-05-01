import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { toFetchableUrl } from '@/lib/storage'
import { LRUCache } from 'lru-cache'
/**
 * 🔥 localized text
 * 
 * localized text：localized text，localized text
 * 
 * localized text：
 * - localized text LRU localized text Promise
 * - localized text URL localized text Promise
 * - localized text TTL，localized text
 */

// localized text
interface CacheEntry {
    promise: Promise<string>  // Base64 localized text Promise
    expiresAt: number         // localized text
    size?: number             // localized text（localized text）
}

// localized text
const CACHE_TTL_MS = 5 * 60 * 1000  // 5 localized text TTL
const MAX_CACHE_SIZE = 100          // localized text 100 localized text
const CLEANUP_INTERVAL_MS = 60 * 1000  // localized text

// localized text
const imageCache = new LRUCache<string, CacheEntry>({
    max: MAX_CACHE_SIZE,
    ttl: CACHE_TTL_MS,
    ttlAutopurge: true,
})

// localized text
let cacheHits = 0
let cacheMisses = 0
let totalDownloadTime = 0

/**
 * localized text Base64（localized text）
 * 
 * @param imageUrl localized text URL（http/https）localized text base64
 * @param options localized text
 * @returns Base64 localized text（data:image/...;base64,...）
 */
export async function getImageBase64Cached(
    imageUrl: string,
    options: {
        logPrefix?: string
        forceRefresh?: boolean
    } = {}
): Promise<string> {
    const { logPrefix = '[localized text]', forceRefresh = false } = options

    // localized text base64，localized text
    if (imageUrl.startsWith('data:')) {
        return imageUrl
    }

    let fullUrl = imageUrl
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        throw new Error(`localized text URL: ${imageUrl.substring(0, 50)}...`)
    }
    fullUrl = toFetchableUrl(fullUrl)

    const cacheKey = imageUrl

    // localized text
    if (!forceRefresh) {
        const cached = imageCache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) {
            cacheHits++
            _ulogInfo(`${logPrefix} ✅ localized text (${cacheHits}/${cacheHits + cacheMisses})`)
            return cached.promise
        }
    }

    cacheMisses++

    // localized text Promise（localized text）
    const downloadPromise = downloadImageAsBase64(fullUrl, logPrefix)

    // localized text
    imageCache.set(cacheKey, {
        promise: downloadPromise,
        expiresAt: Date.now() + CACHE_TTL_MS
    })

    // localized text
    downloadPromise.then(base64 => {
        const entry = imageCache.get(cacheKey)
        if (entry) {
            entry.size = base64.length
        }
    }).catch(() => {
        // localized text，localized text
        imageCache.delete(cacheKey)
    })

    return downloadPromise
}

/**
 * localized text Base64
 */
async function downloadImageAsBase64(imageUrl: string, logPrefix: string): Promise<string> {
    const startTime = Date.now()
    _ulogInfo(`${logPrefix} localized text: ${imageUrl.substring(0, 80)}...`)

    try {
        const response = await fetch(toFetchableUrl(imageUrl), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ImageDownloader/1.0)'
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const contentType = response.headers.get('content-type') || 'image/png'

        const duration = Date.now() - startTime
        totalDownloadTime += duration
        const sizeKB = Math.round(buffer.byteLength / 1024)

        _ulogInfo(`${logPrefix} ✅ localized text: ${sizeKB}KB, ${duration}ms`)

        return `data:${contentType};base64,${base64}`
    } catch (error: unknown) {
        const duration = Date.now() - startTime
        const message =
            error instanceof Error
                ? error.message
                : (typeof error === 'object' && error !== null && typeof (error as { message?: unknown }).message === 'string')
                    ? (error as { message: string }).message
                    : 'localized text'
        _ulogError(`${logPrefix} ❌ localized text (${duration}ms): ${message}`)
        throw error
    }
}

/**
 * localized text（localized text，localized text）
 * 
 * @param imageUrls localized text URL localized text
 * @param options localized text
 * @returns Base64 localized text（localized text）
 */
export async function preloadImagesParallel(
    imageUrls: string[],
    options: {
        logPrefix?: string
        maxConcurrency?: number
    } = {}
): Promise<string[]> {
    const { logPrefix = '[localized text]' } = options

    // localized text（support http URL localized text /api/files/...）
    const uniqueUrls = [...new Set(imageUrls.filter(url => url && (url.startsWith('http') || url.startsWith('/'))))]

    if (uniqueUrls.length === 0) {
        return imageUrls.map(url => url?.startsWith('data:') ? url : '')
    }

    _ulogInfo(`${logPrefix} localized text ${uniqueUrls.length} localized text (localized text: ${imageUrls.length} localized text)`)

    const startTime = Date.now()

    // localized text
    const downloadPromises = uniqueUrls.map(url =>
        getImageBase64Cached(url, { logPrefix })
    )

    // localized text
    const results = await Promise.allSettled(downloadPromises)

    // localized text URL -> Base64 localized text
    const urlToBase64 = new Map<string, string>()
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            urlToBase64.set(uniqueUrls[index], result.value)
        }
    })

    const duration = Date.now() - startTime
    const successCount = results.filter(r => r.status === 'fulfilled').length
    _ulogInfo(`${logPrefix} localized text: ${successCount}/${uniqueUrls.length} success, ${duration}ms`)

    // localized text
    return imageUrls.map(url => {
        if (!url) return ''
        if (url.startsWith('data:')) return url
        return urlToBase64.get(url) || ''
    })
}

/**
 * localized text
 */
function cleanupExpiredCache() {
    const before = imageCache.size
    imageCache.purgeStale()
    const cleaned = before - imageCache.size

    if (cleaned > 0) {
        _ulogInfo(`[localized text] localized text ${cleaned} localized text，localized text ${imageCache.size} localized text`)
    }
}

/**
 * localized text
 */
export function getImageCacheStats() {
    const now = Date.now()
    let validCount = 0
    let totalSize = 0

    for (const entry of imageCache.values()) {
        if (entry.expiresAt > now) {
            validCount++
            totalSize += entry.size || 0
        }
    }

    return {
        cacheSize: imageCache.size,
        validEntries: validCount,
        totalSizeKB: Math.round(totalSize / 1024),
        cacheHits,
        cacheMisses,
        hitRate: cacheHits + cacheMisses > 0
            ? Math.round(cacheHits / (cacheHits + cacheMisses) * 100)
            : 0,
        totalDownloadTimeMs: totalDownloadTime
    }
}

/**
 * localized text
 */
export function clearImageCache() {
    imageCache.clear()
    cacheHits = 0
    cacheMisses = 0
    totalDownloadTime = 0
    _ulogInfo('[localized text] localized text')
}

// localized text
setInterval(cleanupExpiredCache, CLEANUP_INTERVAL_MS)
