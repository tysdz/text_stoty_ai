import { logError as _ulogError, logInfo as _ulogInfo } from '@/lib/logging/core'
import { getProviderKey, resolveModelSelectionOrSingle } from '@/lib/api-config'
import { preprocessLipSyncParams, type LipSyncProviderKey } from '@/lib/lipsync/preprocess'
import { submitBailianLipSync } from '@/lib/lipsync/providers/bailian'
import { submitFalLipSync } from '@/lib/lipsync/providers/fal'
import { submitViduLipSync } from '@/lib/lipsync/providers/vidu'
import type { LipSyncParams, LipSyncResult, LipSyncSubmitContext } from '@/lib/lipsync/types'

function createSubmitContext(
  userId: string,
  selection: { provider: string; modelId: string; modelKey: string },
): LipSyncSubmitContext {
  return {
    userId,
    providerId: selection.provider,
    modelId: selection.modelId,
    modelKey: selection.modelKey,
  }
}

function resolveProviderKey(value: string): LipSyncProviderKey {
  const providerKey = value.toLowerCase()
  if (providerKey === 'fal' || providerKey === 'vidu' || providerKey === 'bailian') {
    return providerKey
  }
  throw new Error(`LIPSYNC_PROVIDER_UNSUPPORTED: ${value}`)
}

export async function generateLipSync(
  params: LipSyncParams,
  userId: string,
  modelKey?: string,
): Promise<LipSyncResult> {
  _ulogInfo('[LipSync Async] localized text')

  try {
    const selection = await resolveModelSelectionOrSingle(userId, modelKey, 'lipsync')
    const context = createSubmitContext(userId, selection)
    const providerKey = resolveProviderKey(getProviderKey(selection.provider))
    const { params: preprocessedParams } = await preprocessLipSyncParams(params, { providerKey })

    if (providerKey === 'fal') {
      const result = await submitFalLipSync(preprocessedParams, context)
      _ulogInfo(`[LipSync Async] FAL localized text: ${result.requestId}`)
      return result
    }

    if (providerKey === 'vidu') {
      const result = await submitViduLipSync(preprocessedParams, context)
      _ulogInfo(`[LipSync Async] Vidu localized text: ${result.requestId}`)
      return result
    }

    if (providerKey === 'bailian') {
      const result = await submitBailianLipSync(preprocessedParams, context)
      _ulogInfo(`[LipSync Async] Bailian localized text: ${result.requestId}`)
      return result
    }

    throw new Error(`LIPSYNC_PROVIDER_UNSUPPORTED: ${selection.provider}`)
  } catch (error: unknown) {
    const errorObject =
      typeof error === 'object' && error !== null
        ? (error as { message?: unknown; body?: unknown })
        : null
    _ulogError('[LipSync Async] error:', error)
    let errorDetails = typeof errorObject?.message === 'string' ? errorObject.message : 'localized text'
    const body = (errorObject?.body && typeof errorObject.body === 'object')
      ? (errorObject.body as { detail?: unknown })
      : null
    if (body) {
      _ulogError('[LipSync Async] localized text:', JSON.stringify(body, null, 2))
      if (body.detail) {
        errorDetails = typeof body.detail === 'string'
          ? body.detail
          : JSON.stringify(body.detail)
      }
    }
    throw new Error(`localized text: ${errorDetails}`)
  }
}

export type { LipSyncParams, LipSyncResult } from '@/lib/lipsync/types'
