import { logInfo as _ulogInfo } from '@/lib/logging/core'
// localized textID，localized text
// localized text，localized text
export const SERVER_BOOT_ID = `boot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

_ulogInfo(`[Server] Boot ID: ${SERVER_BOOT_ID}`)
