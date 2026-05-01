import { logInfo as _ulogInfo } from '@/lib/logging/core'

export interface VoiceDesignInput {
  voicePrompt: string
  previewText: string
  preferredName?: string
  language?: 'vi' | 'en'
}

export interface VoiceDesignResult {
  success: boolean
  voiceId?: string
  targetModel?: string
  audioBase64?: string
  sampleRate?: number
  responseFormat?: string
  usageCount?: number
  requestId?: string
  error?: string
  errorCode?: string
}

export async function createVoiceDesign(
  input: VoiceDesignInput,
  apiKey: string,
): Promise<VoiceDesignResult> {
  if (!apiKey) {
    return {
      success: false,
      error: 'localized text API Key',
    }
  }

  const requestBody = {
    model: 'qwen-voice-design',
    input: {
      action: 'create',
      target_model: 'qwen3-tts-vd-2026-01-26',
      voice_prompt: input.voicePrompt,
      preview_text: input.previewText,
      preferred_name: input.preferredName || 'custom_voice',
      language: input.language || 'vi',
    },
    parameters: {
      sample_rate: 24000,
      response_format: 'wav',
    },
  }

  _ulogInfo('[VoiceDesign] localized text:', JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json() as {
      output?: {
        voice?: string
        target_model?: string
        preview_audio?: {
          data?: string
          sample_rate?: number
          response_format?: string
        }
      }
      usage?: { count?: number }
      request_id?: string
      code?: string
      message?: string
    }

    if (response.ok && data.output) {
      return {
        success: true,
        voiceId: data.output.voice,
        targetModel: data.output.target_model,
        audioBase64: data.output.preview_audio?.data,
        sampleRate: data.output.preview_audio?.sample_rate,
        responseFormat: data.output.preview_audio?.response_format,
        usageCount: data.usage?.count,
        requestId: data.request_id,
      }
    }

    return {
      success: false,
      error: data.message || 'localized text API localized text',
      errorCode: data.code,
      requestId: data.request_id,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'localized text'
    return {
      success: false,
      error: message || 'localized text',
    }
  }
}

export function validateVoicePrompt(voicePrompt: string): { valid: boolean; error?: string } {
  if (!voicePrompt || voicePrompt.trim().length === 0) {
    return { valid: false, error: 'localized text' }
  }
  if (voicePrompt.length > 500) {
    return { valid: false, error: 'localized text500localized text' }
  }
  return { valid: true }
}

export function validatePreviewText(previewText: string): { valid: boolean; error?: string } {
  if (!previewText || previewText.trim().length === 0) {
    return { valid: false, error: 'localized text' }
  }
  if (previewText.length < 5) {
    return { valid: false, error: 'localized text5localized text' }
  }
  if (previewText.length > 200) {
    return { valid: false, error: 'localized text200localized text' }
  }
  return { valid: true }
}
