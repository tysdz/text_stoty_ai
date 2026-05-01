/**
 * 🔧 localized text
 * localized text，localized text
 */

export function getPublicBaseUrl(): string {
    return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

/**
 * localized text baseUrl。
 * localized text、localized text fetch localized text API、localized text /api/files localized text。
 */
export function getInternalBaseUrl(): string {
    return process.env.INTERNAL_APP_URL
        || process.env.INTERNAL_TASK_API_BASE_URL
        || process.env.NEXTAUTH_URL
        || 'http://localhost:3000'
}

/**
 * localized text：localized text getBaseUrl localized text，localized text。
 */
export function getBaseUrl(): string {
    return getInternalBaseUrl()
}

/**
 * localized text API URL
 * @param path API localized text，localized text '/api/user/balance'
 */
export function getApiUrl(path: string): string {
    const baseUrl = getInternalBaseUrl()
    // localized text path localized text / localized text
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${normalizedPath}`
}
