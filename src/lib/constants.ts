/**
 * Main appearance index shared across character image flows.
 * Keep all primary/sub-appearance checks tied to this constant.
 */
export const PRIMARY_APPEARANCE_INDEX = 0

// Aspect ratios supported by the image providers, ordered by common usage.
export const ASPECT_RATIO_CONFIGS: Record<string, { label: string; isVertical: boolean }> = {
  '16:9': { label: '16:9', isVertical: false },
  '9:16': { label: '9:16', isVertical: true },
  '1:1': { label: '1:1', isVertical: false },
  '3:2': { label: '3:2', isVertical: false },
  '2:3': { label: '2:3', isVertical: true },
  '4:3': { label: '4:3', isVertical: false },
  '3:4': { label: '3:4', isVertical: true },
  '5:4': { label: '5:4', isVertical: false },
  '4:5': { label: '4:5', isVertical: true },
  '21:9': { label: '21:9', isVertical: false },
}

// Options used by configuration screens, derived from ASPECT_RATIO_CONFIGS.
export const VIDEO_RATIOS = Object.entries(ASPECT_RATIO_CONFIGS).map(([value, config]) => ({
  value,
  label: config.label
}))

// Get ratio config with 16:9 as the safe default.
export function getAspectRatioConfig(ratio: string) {
  return ASPECT_RATIO_CONFIGS[ratio] || ASPECT_RATIO_CONFIGS['16:9']
}

export const ANALYSIS_MODELS = [
  { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'google/gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash-Lite' },
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' }
]

export const IMAGE_MODELS = [
  { value: 'doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
  { value: 'doubao-seedream-4-0-250828', label: 'Seedream 4.0' }
]

// Image model options for full image generation.
export const IMAGE_MODEL_OPTIONS = [
  { value: 'banana', label: 'Banana Pro (FAL)' },
  { value: 'banana-2', label: 'Banana 2 (FAL)' },
  { value: 'gemini-3-pro-image-preview', label: 'Banana (Google)' },
  { value: 'gemini-3-pro-image-preview-batch', label: 'Banana (Google Batch) save 50%' },
  { value: 'doubao-seedream-4-0-250828', label: 'Seedream 4.0' },
  { value: 'doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
  { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 (Google)' },
  { value: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4.0 Ultra' },
  { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast' }
]

// Banana resolution options. Single-image generation stays fixed at 2K.
export const BANANA_RESOLUTION_OPTIONS = [
  { value: '2K', label: '2K (recommended, fast)' },
  { value: '4K', label: '4K (high quality, slower)' }
]

// Banana models that support resolution selection.
export const BANANA_MODELS = ['banana', 'banana-2', 'gemini-3-pro-image-preview', 'gemini-3-pro-image-preview-batch']

export const VIDEO_MODELS = [
  { value: 'doubao-seedance-1-0-pro-fast-251015', label: 'Seedance 1.0 Pro Fast' },
  { value: 'doubao-seedance-1-0-pro-fast-251015-batch', label: 'Seedance 1.0 Pro Fast (batch, save 50%)' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428', label: 'Seedance 1.0 Lite' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428-batch', label: 'Seedance 1.0 Lite (batch, save 50%)' },
  { value: 'doubao-seedance-1-5-pro-251215', label: 'Seedance 1.5 Pro' },
  { value: 'doubao-seedance-1-5-pro-251215-batch', label: 'Seedance 1.5 Pro (batch, save 50%)' },
  { value: 'doubao-seedance-1-0-pro-250528', label: 'Seedance 1.0 Pro' },
  { value: 'doubao-seedance-1-0-pro-250528-batch', label: 'Seedance 1.0 Pro (batch, save 50%)' },
  { value: 'fal-wan25', label: 'Wan 2.6' },
  { value: 'fal-veo31', label: 'Veo 3.1 Fast' },
  { value: 'fal-sora2', label: 'Sora 2' },
  { value: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video', label: 'Kling 2.5 Turbo Pro' },
  { value: 'fal-ai/kling-video/v3/standard/image-to-video', label: 'Kling 3 Standard' },
  { value: 'fal-ai/kling-video/v3/pro/image-to-video', label: 'Kling 3 Pro' }
]

// Batch models use idle GPU capacity and reduce cost.
export const SEEDANCE_BATCH_MODELS = [
  'doubao-seedance-1-5-pro-251215-batch',
  'doubao-seedance-1-0-pro-250528-batch',
  'doubao-seedance-1-0-pro-fast-251015-batch',
  'doubao-seedance-1-0-lite-i2v-250428-batch',
]

// Models that support audio generation.
export const AUDIO_SUPPORTED_MODELS = ['doubao-seedance-1-5-pro-251215', 'doubao-seedance-1-5-pro-251215-batch']

// Static fallback for first/last-frame capable models; standards/capabilities is authoritative.
export const FIRST_LAST_FRAME_MODELS = [
  { value: 'doubao-seedance-1-5-pro-251215', label: 'Seedance 1.5 Pro (first-last frame)' },
  { value: 'doubao-seedance-1-5-pro-251215-batch', label: 'Seedance 1.5 Pro (first-last frame/batch, save 50%)' },
  { value: 'doubao-seedance-1-0-pro-250528', label: 'Seedance 1.0 Pro (first-last frame)' },
  { value: 'doubao-seedance-1-0-pro-250528-batch', label: 'Seedance 1.0 Pro (first-last frame/batch, save 50%)' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428', label: 'Seedance 1.0 Lite (first-last frame)' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428-batch', label: 'Seedance 1.0 Lite (first-last frame/batch, save 50%)' },
  { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 (first-last frame)' },
  { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast (first-last frame)' }
]

export const VIDEO_RESOLUTIONS = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' }
]

export const TTS_RATES = [
  { value: '+0%', label: 'normal speed (1.0x)' },
  { value: '+20%', label: 'slightly faster (1.2x)' },
  { value: '+50%', label: 'faster (1.5x)' },
  { value: '+100%', label: 'fast (2.0x)' }
]

export const TTS_VOICES = [
  { value: 'vi-VN-NamMinhNeural', label: 'Nam Minh (male voice)', preview: 'M' },
  { value: 'vi-VN-HoaiMyNeural', label: 'Hoai My (female voice)', preview: 'F' }
]

export const ART_STYLES = [
  {
    value: 'american-comic',
    label: 'comic style',
    preview: 'Comic',
    promptVi: 'Japanese anime style',
    promptEn: 'Japanese anime style'
  },
  {
    value: 'premium-comic',
    label: 'premium comic',
    preview: 'Premium',
    promptVi: 'Modern premium comic style, rich details, clean sharp line art, full texture, ultra-clear 2D anime aesthetics.',
    promptEn: 'Modern premium comic style, rich details, clean sharp line art, full texture, ultra-clear 2D anime aesthetics.'
  },
  {
    value: 'japanese-anime',
    label: 'anime style',
    preview: 'Anime',
    promptVi: 'Modern Japanese anime style, cel shading, clean line art, visual-novel CG look, high-quality 2D style.',
    promptEn: 'Modern Japanese anime style, cel shading, clean line art, visual-novel CG look, high-quality 2D style.'
  },
  {
    value: 'realistic',
    label: 'realistic',
    preview: 'Real',
    promptVi: 'Realistic cinematic look, real-world scene fidelity, rich transparent colors, clean and refined image quality.',
    promptEn: 'Realistic cinematic look, real-world scene fidelity, rich transparent colors, clean and refined image quality.'
  }
]

export type ArtStyleValue = (typeof ART_STYLES)[number]['value']

export function isArtStyleValue(value: unknown): value is ArtStyleValue {
  return typeof value === 'string' && ART_STYLES.some((style) => style.value === value)
}

/**
 * Reads the style prompt from ART_STYLES so generated prompts stay centralized.
 */
export function getArtStylePrompt(
  artStyle: string | null | undefined,
  locale: 'vi' | 'en',
): string {
  if (!artStyle) return ''
  const style = ART_STYLES.find(s => s.value === artStyle)
  if (!style) return ''
  return locale === 'en' ? style.promptEn : style.promptVi
}

// Character sheet suffix appended for image generation but hidden from the user.
export const CHARACTER_PROMPT_SUFFIX = 'Character design sheet, split into two areas: the left third is a clear front close-up of the face or most recognizable front view; the right two thirds show three full-body views arranged left to right: front, side, and back. Keep all views at consistent height on a plain white background with no extra elements.'

// Location suffix is intentionally empty because locations are generated as single images.
export const LOCATION_PROMPT_SUFFIX = ''

export const CHARACTER_IMAGE_RATIO = '16:9'
export const CHARACTER_IMAGE_SIZE = '3840x2160'
export const CHARACTER_IMAGE_BANANA_RATIO = '3:2'

export const LOCATION_IMAGE_RATIO = '1:1'
export const LOCATION_IMAGE_SIZE = '4096x4096'
export const LOCATION_IMAGE_BANANA_RATIO = '1:1'

export function removeCharacterPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  return prompt.replace(CHARACTER_PROMPT_SUFFIX, '').trim()
}

export function addCharacterPromptSuffix(prompt: string): string {
  if (!prompt) return CHARACTER_PROMPT_SUFFIX
  const cleanPrompt = removeCharacterPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? ', ' : ''}${CHARACTER_PROMPT_SUFFIX}`
}

export function removeLocationPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  return prompt.replace(LOCATION_PROMPT_SUFFIX, '').replace(/,$/, '').trim()
}

export function addLocationPromptSuffix(prompt: string): string {
  if (!LOCATION_PROMPT_SUFFIX) return prompt || ''
  if (!prompt) return LOCATION_PROMPT_SUFFIX
  const cleanPrompt = removeLocationPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? ', ' : ''}${LOCATION_PROMPT_SUFFIX}`
}

/**
 * Builds character introduction text for AI prompts.
 */
export function buildCharactersIntroduction(characters: Array<{ name: string; introduction?: string | null }>): string {
  if (!characters || characters.length === 0) return 'No character introductions yet'

  const introductions = characters
    .filter(c => c.introduction && c.introduction.trim())
    .map(c => `- ${c.name}: ${c.introduction}`)

  if (introductions.length === 0) return 'No character introductions yet'

  return introductions.join('\n')
}
