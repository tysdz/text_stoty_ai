import { logInfo as _ulogInfo } from '@/lib/logging/core'
import type { UnifiedErrorCode } from '@/lib/errors/codes'
import { getUserMessageByCode } from '@/lib/errors/user-messages'
import { normalizeAnyError } from '@/lib/errors/normalize'

/**
 * localized text/localized text fetch localized text
 * localized text
 */
export function isAbortError(error: unknown): boolean {
    if (!error) return false

    // check AbortError
    if (error instanceof DOMException && error.name === 'AbortError') {
        return true
    }

    // check fetch localized text
    if (error instanceof Error) {
        const message = error.message.toLowerCase()
        if (
            message.includes('abort') ||
            message.includes('cancelled') ||
            message.includes('canceled') ||
            message.includes('failed to fetch') ||
            message.includes('network request failed') ||
            message.includes('load failed') ||
            message.includes('the operation was aborted')
        ) {
            return true
        }
    }

    // check TypeError (localized text)
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return true
    }

    return false
}

export function resolveClientError(error: unknown, fallbackCode: UnifiedErrorCode = 'INTERNAL_ERROR'): {
    code: UnifiedErrorCode
    message: string
    rawMessage: string
} {
    const normalized = normalizeAnyError(error, {
        context: 'api',
        fallbackCode,
    })

    return {
        code: normalized.code,
        message: getUserMessageByCode(normalized.code),
        rawMessage: normalized.message,
    }
}

/**
 * localized text
 * localized text，localized text
 */
export function safeAlert(message: string, error?: unknown): void {
    // localized text，localized text
    if (error && isAbortError(error)) {
        _ulogInfo('[Info] localized text（localized text）:', message)
        return
    }

    if (error) {
        const resolved = resolveClientError(error)
        alert(message || resolved.message)
        return
    }

    alert(message)
}

/**
 * localized text
 * localized text（localized text false）
 */
export function shouldShowError(error: unknown): boolean {
    return !isAbortError(error)
}
