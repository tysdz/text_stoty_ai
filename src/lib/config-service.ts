/**
 * localized text
 *
 * localized text API localized text，localized text。
 *
 * localized text：localized text > localized text > null
 */

import { prisma } from '@/lib/prisma'
import {
  type CapabilitySelections,
  type CapabilityValue,
  composeModelKey as composeStrictModelKey,
  parseModelKeyStrict,
} from '@/lib/model-config-contract'
import { findBuiltinCapabilities } from '@/lib/model-capabilities/catalog'
import { resolveGenerationOptionsForModel } from '@/lib/model-capabilities/lookup'
import {
  type WorkflowConcurrencyConfig,
  normalizeWorkflowConcurrencyConfig,
} from '@/lib/workflow-concurrency'

export type ParsedModelKey = { provider: string, modelId: string }

/**
 * localized text Key（localized text，localized text provider::modelId）
 */
export function parseModelKey(key: string | null | undefined): ParsedModelKey | null {
  const parsed = parseModelKeyStrict(key)
  if (!parsed) return null
  return {
    provider: parsed.provider,
    modelId: parsed.modelId,
  }
}

/**
 * localized text provider localized text modelId localized text。
 */
export function composeModelKey(provider: string, modelId: string): string {
  return composeStrictModelKey(provider, modelId)
}

/**
 * localized text Key localized text modelId（localized text API localized text）
 */
export function extractModelId(key: string | null | undefined): string | null {
  const parsed = parseModelKey(key)
  return parsed?.modelId || null
}

/**
 * localized text modelKey（provider::modelId）
 */
export function extractModelKey(key: string | null | undefined): string | null {
  const parsed = parseModelKey(key)
  if (!parsed?.provider || !parsed?.modelId) return null
  return composeModelKey(parsed.provider, parsed.modelId)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isCapabilityValue(value: unknown): value is CapabilityValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function normalizeCapabilitySelections(raw: unknown): CapabilitySelections {
  if (!isRecord(raw)) return {}

  const normalized: CapabilitySelections = {}
  for (const [modelKey, rawSelection] of Object.entries(raw)) {
    if (!isRecord(rawSelection)) continue

    const selection: Record<string, CapabilityValue> = {}
    for (const [field, value] of Object.entries(rawSelection)) {
      if (field === 'aspectRatio') continue
      if (!isCapabilityValue(value)) continue
      selection[field] = value
    }

    if (Object.keys(selection).length > 0) {
      normalized[modelKey] = selection
    }
  }

  return normalized
}

function parseCapabilitySelections(raw: string | null | undefined): CapabilitySelections {
  if (!raw) return {}
  try {
    return normalizeCapabilitySelections(JSON.parse(raw) as unknown)
  } catch {
    return {}
  }
}

export interface ProjectModelConfig {
  analysisModel: string | null
  characterModel: string | null
  locationModel: string | null
  storyboardModel: string | null
  editModel: string | null
  videoModel: string | null
  audioModel: string | null
  videoRatio: string | null
  artStyle: string | null
  capabilityDefaults: CapabilitySelections
  capabilityOverrides: CapabilitySelections
}

export interface UserModelConfig {
  analysisModel: string | null
  characterModel: string | null
  locationModel: string | null
  storyboardModel: string | null
  editModel: string | null
  videoModel: string | null
  audioModel: string | null
  capabilityDefaults: CapabilitySelections
}

export async function getUserWorkflowConcurrencyConfig(
  userId: string,
): Promise<WorkflowConcurrencyConfig> {
  const userPref = await prisma.userPreference.findUnique({
    where: { userId },
    select: {
      analysisConcurrency: true,
      imageConcurrency: true,
      videoConcurrency: true,
    },
  })

  return normalizeWorkflowConcurrencyConfig({
    analysis: userPref?.analysisConcurrency,
    image: userPref?.imageConcurrency,
    video: userPref?.videoConcurrency,
  })
}

/**
 * localized text
 */
export async function getProjectModelConfig(
  projectId: string,
  userId: string,
): Promise<ProjectModelConfig> {
  const [projectData, userPref] = await Promise.all([
    prisma.novelPromotionProject.findUnique({ where: { projectId } }),
    prisma.userPreference.findUnique({ where: { userId } }),
  ])

  return {
    analysisModel: extractModelKey(projectData?.analysisModel) || extractModelKey(userPref?.analysisModel) || null,
    characterModel: extractModelKey(projectData?.characterModel) || null,
    locationModel: extractModelKey(projectData?.locationModel) || null,
    storyboardModel: extractModelKey(projectData?.storyboardModel) || null,
    editModel: extractModelKey(projectData?.editModel) || null,
    videoModel: extractModelKey(projectData?.videoModel) || null,
    audioModel: extractModelKey(projectData?.audioModel) || extractModelKey(userPref?.audioModel) || null,
    videoRatio: projectData?.videoRatio || '16:9',
    artStyle: projectData?.artStyle || null,
    capabilityDefaults: parseCapabilitySelections(userPref?.capabilityDefaults),
    capabilityOverrides: parseCapabilitySelections(projectData?.capabilityOverrides),
  }
}

/**
 * localized text（localized text）
 */
export async function getUserModelConfig(userId: string): Promise<UserModelConfig> {
  const userPref = await prisma.userPreference.findUnique({
    where: { userId },
  })

  return {
    analysisModel: extractModelKey(userPref?.analysisModel) || null,
    characterModel: extractModelKey(userPref?.characterModel) || null,
    locationModel: extractModelKey(userPref?.locationModel) || null,
    storyboardModel: extractModelKey(userPref?.storyboardModel) || null,
    editModel: extractModelKey(userPref?.editModel) || null,
    videoModel: extractModelKey(userPref?.videoModel) || null,
    audioModel: extractModelKey(userPref?.audioModel) || null,
    capabilityDefaults: parseCapabilitySelections(userPref?.capabilityDefaults),
  }
}

export function resolveModelCapabilityGenerationOptions(input: {
  modelType: 'llm' | 'image' | 'video'
  modelKey: string
  capabilityDefaults?: CapabilitySelections
  capabilityOverrides?: CapabilitySelections
  runtimeSelections?: Record<string, CapabilityValue>
}): Record<string, CapabilityValue> {
  const parsed = parseModelKeyStrict(input.modelKey)
  if (!parsed) {
    throw new Error(`MODEL_KEY_INVALID: ${input.modelKey}`)
  }

  const capabilities = findBuiltinCapabilities(input.modelType, parsed.provider, parsed.modelId)
  const resolved = resolveGenerationOptionsForModel({
    modelType: input.modelType,
    modelKey: input.modelKey,
    capabilities,
    capabilityDefaults: input.capabilityDefaults,
    capabilityOverrides: input.capabilityOverrides,
    runtimeSelections: input.runtimeSelections,
    requireAllFields: input.modelType !== 'llm',
  })

  if (resolved.issues.length > 0) {
    const first = resolved.issues[0]
    throw new Error(`${first.code}: ${first.field} ${first.message}`)
  }

  return resolved.options
}

export async function resolveProjectModelCapabilityGenerationOptions(input: {
  projectId: string
  userId: string
  modelType: 'llm' | 'image' | 'video'
  modelKey: string
  runtimeSelections?: Record<string, CapabilityValue>
}): Promise<Record<string, CapabilityValue>> {
  const config = await getProjectModelConfig(input.projectId, input.userId)
  return resolveModelCapabilityGenerationOptions({
    modelType: input.modelType,
    modelKey: input.modelKey,
    capabilityDefaults: config.capabilityDefaults,
    capabilityOverrides: config.capabilityOverrides,
    runtimeSelections: input.runtimeSelections,
  })
}

/**
 * localized text
 */
export function checkRequiredModels(
  config: Partial<ProjectModelConfig | UserModelConfig>,
  requiredFields: (keyof ProjectModelConfig | keyof UserModelConfig)[],
): string[] {
  const missing: string[] = []
  const configValues = config as Record<string, unknown>

  const fieldNames: Record<string, string> = {
    analysisModel: 'AIlocalized text',
    characterModel: 'localized text',
    locationModel: 'localized text',
    storyboardModel: 'localized text',
    editModel: 'localized text/localized text',
    videoModel: 'localized text',
    audioModel: 'localized text',
  }

  for (const field of requiredFields) {
    if (!configValues[field]) {
      missing.push(fieldNames[field] || field)
    }
  }

  return missing
}

/**
 * localized text
 */
export function getMissingConfigError(missingFields: string[]): string {
  if (missingFields.length === 0) return ''
  if (missingFields.length === 1) {
    return `localized text"${missingFields[0]}"`
  }
  return `localized text：${missingFields.join('、')}`
}

/**
 * localized text billingPayload（localized text，async）
 *
 * localized text：localized text resolution。
 * resolution localized text billingPayload.generationOptions（localized text）
 * localized text task payload（worker localized text API localized text imageSize localized text）。
 */
export async function buildImageBillingPayload(input: {
  projectId: string
  userId: string
  imageModel: string | null
  basePayload: Record<string, unknown>
}): Promise<Record<string, unknown>> {
  const { projectId, userId, imageModel, basePayload } = input
  if (!imageModel) return basePayload

  let capabilityOptions: Record<string, CapabilityValue> = {}
  try {
    capabilityOptions = await resolveProjectModelCapabilityGenerationOptions({
      projectId,
      userId,
      modelType: 'image',
      modelKey: imageModel,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image model capability not configured'
    throw Object.assign(new Error(message), { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return {
    ...basePayload,
    imageModel,
    ...(Object.keys(capabilityOptions).length > 0 ? { generationOptions: capabilityOptions } : {}),
  }
}

/**
 * localized text billingPayload（localized text，sync）
 *
 * localized text asset-hub localized text projectId Location，localized text userModelConfig。
 */
export function buildImageBillingPayloadFromUserConfig(input: {
  userModelConfig: UserModelConfig
  imageModel: string | null
  basePayload: Record<string, unknown>
}): Record<string, unknown> {
  const { userModelConfig, imageModel, basePayload } = input
  if (!imageModel) return basePayload

  let capabilityOptions: Record<string, CapabilityValue> = {}
  try {
    capabilityOptions = resolveModelCapabilityGenerationOptions({
      modelType: 'image',
      modelKey: imageModel,
      capabilityDefaults: userModelConfig.capabilityDefaults,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image model capability not configured'
    throw Object.assign(new Error(message), { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return {
    ...basePayload,
    imageModel,
    ...(Object.keys(capabilityOptions).length > 0 ? { generationOptions: capabilityOptions } : {}),
  }
}
