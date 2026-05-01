import { resolveUnifiedErrorCode } from './codes'
import { getUserMessageByCode } from './user-messages'
import { normalizeAnyError } from './normalize'

/** localized text */
function extractProviderDetail(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  // localized text JSON localized text "message" localized text（ARK / OpenRouter / localized text OpenAI localized text API）
  const jsonMatch = raw.match(/\{.*"message"\s*:\s*"([^"]+)"/)
  if (jsonMatch?.[1]) return jsonMatch[1]
  // localized text：localized text "[ARK Image] localized text: " ，localized text
  const cleaned = raw
    .replace(/^\[[\w\s]+\]\s*/g, '')           // [ARK Image]
    .replace(/^[\w\s]+failed:\s*/g, '')           // localized text:
    .replace(/^\d{3}\s*-\s*/g, '')              // 400 -
    .trim()
  return cleaned || null
}

export function resolveErrorDisplay(input?: {
  code?: string | null
  message?: string | null
} | null) {
  if (!input) return null
  // code localized text message localized text，localized text，localized text null
  // localized text，normalizeAnyError localized text INTERNAL_ERROR，localized text
  if (!input.code && !input.message) return null

  const code = resolveUnifiedErrorCode(input.code)
  if (code && code !== 'INTERNAL_ERROR') {
    const userMessage = getUserMessageByCode(code)
    if (code === 'VIDEO_API_FORMAT_UNSUPPORTED') {
      return {
        code,
        message: userMessage,
      }
    }
    // localized text message localized text API localized text
    const detail = extractProviderDetail(input.message)
    return {
      code,
      message: detail ? `${userMessage}\n${detail}` : userMessage,
    }
  }

  // localized text code localized text INTERNAL_ERROR localized text code localized text，localized text message localized text
  // localized text"localized text"、"insufficient balance"、"localized text"localized text
  const normalized = normalizeAnyError(
    { code: input.code || undefined, message: input.message || undefined },
    { context: 'api' },
  )
  if (normalized?.code) {
    const userMessage = getUserMessageByCode(normalized.code)
    const detail = extractProviderDetail(input.message)
    return {
      code: normalized.code,
      message: detail ? `${userMessage}\n${detail}` : userMessage,
    }
  }

  return null
}
