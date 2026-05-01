// localized text
import type { ModelCapabilities } from '@/lib/model-config-contract'
import type { VideoPricingTier } from '@/lib/model-pricing/video-tier'

// localized text
export interface VideoModelOption {
  value: string
  label: string
  provider?: string
  providerName?: string
  disabled?: boolean
  capabilities?: ModelCapabilities
  videoPricingTiers?: VideoPricingTier[]
}

export type VideoGenerationMode = 'normal' | 'firstlastframe'

export interface TextPanel {
  panel_number: number
  shot_type: string
  camera_move?: string
  description: string
  characters?: Array<string | { name?: string; appearance?: string }>
  location?: string
  text_segment?: string
  duration?: number
  video_prompt?: string
  imagePrompt?: string
  videoModel?: string
}

export interface Panel {
  id?: string
  panelIndex: number
  panelNumber?: number | null
  shotType?: string | null
  cameraMove?: string | null
  description?: string | null
  characters?: string | null
  location?: string | null
  textSegment?: string | null
  srtSegment?: string | null  // SRT localized text
  duration?: number | null
  imagePrompt?: string | null
  imageUrl?: string | null  // localized textURL
  videoPrompt?: string | null
  firstLastFramePrompt?: string | null
  videoUrl?: string | null
  videoGenerationMode?: VideoGenerationMode | null
  videoModel?: string | null
  linkedToNextPanel?: boolean | null
  videoTaskRunning?: boolean | null
  videoErrorMessage?: string | null  // localized text
  videoErrorCode?: string | null
  imageTaskRunning?: boolean | null
  // localized text
  lipSyncVideoUrl?: string | null
  lipSyncTaskRunning?: boolean | null
  lipSyncErrorMessage?: string | null  // localized text
  lipSyncErrorCode?: string | null
}

export interface Storyboard {
  id: string
  clipId?: string | null
  panels?: Panel[]
  clip?: {
    start: number
    end: number
    summary: string
  }
}

export interface Clip {
  id: string
  start: number
  end: number
  summary: string
}

export interface VideoPanel {
  panelId?: string  // localized textID
  storyboardId: string
  panelIndex: number
  textPanel?: TextPanel
  firstLastFramePrompt?: string
  imageUrl?: string
  videoUrl?: string
  videoGenerationMode?: VideoGenerationMode
  videoTaskRunning?: boolean
  videoErrorMessage?: string  // localized text
  videoErrorCode?: string
  videoModel?: string
  linkedToNextPanel?: boolean
  // localized text
  lipSyncVideoUrl?: string
  lipSyncTaskRunning?: boolean
  lipSyncTaskId?: string
  lipSyncErrorMessage?: string  // localized text
  lipSyncErrorCode?: string
}

// localized text
export interface MatchedVoiceLine {
  id: string
  lineIndex: number
  speaker: string
  content: string
  audioUrl?: string
  audioDuration?: number
  emotionStrength?: number
}

export interface FirstLastFrameParams {
  lastFrameStoryboardId: string
  lastFramePanelIndex: number
  flModel: string
  customPrompt?: string
}

export type VideoGenerationOptionValue = string | number | boolean
export type VideoGenerationOptions = Record<string, VideoGenerationOptionValue>

export interface BatchVideoGenerationParams {
  videoModel: string
  generationOptions?: VideoGenerationOptions
}
