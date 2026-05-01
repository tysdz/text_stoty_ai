import type { UnifiedErrorCode } from './codes'

export const USER_ERROR_MESSAGES_ZH: Record<UnifiedErrorCode, string> = {
  UNAUTHORIZED: 'localized text。',
  FORBIDDEN: 'localized text。',
  NOT_FOUND: 'localized text。',
  INVALID_PARAMS: 'localized text，localized text。',
  MISSING_CONFIG: 'localized text，localized text。',
  CONFLICT: 'localized text，localized text。',
  TASK_NOT_READY: 'localized text，localized text。',
  NO_RESULT: 'localized text，localized text。',
  RATE_LIMIT: 'localized text，localized text。',
  MODEL_NOT_OPEN: 'localized text。localized text https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement?LLM=%7B%7D&advancedActiveKey=model ，localized text「localized text」。',
  MODEL_NOT_REGISTERED: 'localized text，localized text。',
  MODEL_NOT_CONFIGURED: 'localized text，localized text。',
  QUOTA_EXCEEDED: 'localized text，localized text。',
  EXTERNAL_ERROR: 'localized text，localized text。',
  NETWORK_ERROR: 'localized text，localized text。',
  EMPTY_RESPONSE: 'localized text（localized text），localized text。',
  INSUFFICIENT_BALANCE: 'insufficient balance，localized text。',
  SENSITIVE_CONTENT: 'localized text，localized text。',
  GENERATION_TIMEOUT: 'localized text，please retry。',
  VIDEO_API_FORMAT_UNSUPPORTED: 'localized text。',
  GENERATION_FAILED: 'localized text，localized text。',
  WATCHDOG_TIMEOUT: 'localized text，localized text。',
  WORKER_EXECUTION_ERROR: 'localized text，localized text。',
  INTERNAL_ERROR: 'localized text，localized text。',
}

export function getUserMessageByCode(code: UnifiedErrorCode) {
  return USER_ERROR_MESSAGES_ZH[code]
}
