import type { CapabilitySelections } from '@/lib/model-config-contract'

// ============================================
// localized text
// ============================================
export type ProjectMode = 'novel-promotion'

// ============================================
// localized text
// ============================================
export interface BaseProject {
  id: string
  name: string
  description: string | null
  mode: ProjectMode
  userId: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// localized text
// ============================================

export interface MediaRef {
  id: string
  publicId: string
  url: string
  mimeType: string | null
  sizeBytes: number | null
  width: number | null
  height: number | null
  durationMs: number | null
}

// localized text（localized text）
// 🔥 V6.5: characterId localized text useProjectAssets localized text
export interface CharacterAppearance {
  id: string
  characterId?: string            // localized text，API localized text
  appearanceIndex: number           // localized text：0, 1, 2...（0 = localized text）
  changeReason: string              // "initial appearance"、"localized text"
  description: string | null
  descriptions: string[] | null     // 3localized text
  imageUrl: string | null           // localized text
  media?: MediaRef | null
  imageUrls: string[]               // localized text
  imageMedias?: MediaRef[]
  previousImageUrl: string | null   // localized textURL（localized text）
  previousMedia?: MediaRef | null
  previousImageUrls: string[]         // localized text（localized text）
  previousImageMedias?: MediaRef[]
  previousDescription: string | null  // localized text（localized text）
  previousDescriptions: string[] | null  // localized text（localized text）
  selectedIndex: number | null      // localized text
  // localized text（localized text tasks + hook localized text，localized text）
  imageTaskRunning?: boolean
  imageErrorMessage?: string | null  // localized text
  lastError?: { code: string; message: string } | null  // localized text（localized text task target state）
}

// Character
// 🔥 V6.5: aliases localized text useProjectAssets
export interface Character {
  id: string
  name: string
  aliases?: string[] | null         // localized text，localized text
  introduction?: string | null      // localized text（localized text、localized text）
  appearances: CharacterAppearance[]  // localized text
  // localized text
  voiceType?: 'custom' | 'qwen-designed' | 'uploaded' | null  // localized text
  voiceId?: string | null                 // localized text ID localized text
  customVoiceUrl?: string | null          // localized textURL
  media?: MediaRef | null
  // localized text（localized text）
  profileData?: string | null             // JSONlocalized text
  profileConfirmed?: boolean             // localized text
  // localized text（localized text tasks + hook localized text，localized text）
  profileConfirmTaskRunning?: boolean     // localized text
}

// localized text（localized text）
// 🔥 V6.5: locationId localized text useProjectAssets
export interface LocationImage {
  id: string
  locationId?: string               // localized text，API localized text
  imageIndex: number              // localized text：0, 1, 2
  description: string | null
  imageUrl: string | null
  media?: MediaRef | null
  previousImageUrl: string | null // localized textURL（localized text）
  previousMedia?: MediaRef | null
  previousDescription: string | null  // localized text（localized text）
  isSelected: boolean
  // localized text（localized text tasks + hook localized text，localized text）
  imageTaskRunning?: boolean
  imageErrorMessage?: string | null  // localized text
  lastError?: { code: string; message: string } | null  // localized text（localized text task target state）
}

// Location
export interface Location {
  id: string
  name: string
  summary: string | null            // localized text（localized text/localized text）
  selectedImageId?: string | null   // localized textID（localized text）
  images: LocationImage[]           // localized text
}

export type PropImage = LocationImage

export interface Prop {
  id: string
  name: string
  summary: string | null
  selectedImageId?: string | null
  images: PropImage[]
}

export interface AssetLibraryCharacter {
  id: string
  name: string
  description: string
  imageUrl: string | null
  media?: MediaRef | null
}

export interface AssetLibraryLocation {
  id: string
  name: string
  description: string
  imageUrl: string | null
  media?: MediaRef | null
}

// ============================================
// localized text
// ============================================

// localized text
export type WorkflowMode = 'srt' | 'agent'

// Cliplocalized text（localized textSRTlocalized textAgentlocalized text）
export interface NovelPromotionClip {
  id: string

  // SRTlocalized text
  start?: number
  end?: number
  duration?: number

  // Agentlocalized text
  startText?: string
  endText?: string
  shotCount?: number

  // localized text
  summary: string
  location: string | null
  characters: string | null
  props: string | null
  content: string
  screenplay?: string | null  // localized textJSON（Phase 0localized text）
}

export interface NovelPromotionPanel {
  id: string
  storyboardId: string
  panelIndex: number
  panelNumber: number | null
  shotType: string | null
  cameraMove: string | null
  description: string | null
  location: string | null
  characters: string | null
  props: string | null
  srtSegment: string | null
  srtStart: number | null
  srtEnd: number | null
  duration: number | null
  imagePrompt: string | null
  imageUrl: string | null
  candidateImages?: string | null
  media?: MediaRef | null
  imageHistory: string | null
  videoPrompt: string | null
  firstLastFramePrompt?: string | null
  videoUrl: string | null
  videoGenerationMode?: 'normal' | 'firstlastframe' | null
  videoMedia?: MediaRef | null
  lipSyncVideoUrl?: string | null
  lipSyncVideoMedia?: MediaRef | null
  sketchImageUrl?: string | null
  sketchImageMedia?: MediaRef | null
  previousImageUrl?: string | null
  previousImageMedia?: MediaRef | null
  photographyRules: string | null  // localized textJSON
  actingNotes: string | null        // localized textJSON
  // localized text（localized text tasks + hook localized text，localized text）
  imageTaskRunning?: boolean
  videoTaskRunning?: boolean
  imageErrorMessage?: string | null  // localized text
}

export interface NovelPromotionStoryboard {
  id: string
  episodeId: string
  clipId: string
  storyboardTextJson: string | null
  panelCount: number
  storyboardImageUrl: string | null
  media?: MediaRef | null
  storyboardTaskRunning?: boolean
  candidateImages?: string | null
  lastError?: string | null  // localized text
  photographyPlan?: string | null  // localized textJSON
  panels?: NovelPromotionPanel[]
}

export interface NovelPromotionShot {
  id: string
  shotId: string
  srtStart: number
  srtEnd: number
  srtDuration: number
  sequence: string | null
  locations: string | null
  characters: string | null
  plot: string | null
  pov: string | null
  imagePrompt: string | null
  scale: string | null
  module: string | null
  focus: string | null
  zhSummarize: string | null
  imageUrl: string | null
  media?: MediaRef | null
  videoUrl?: string | null
  videoMedia?: MediaRef | null
  // localized text（localized text tasks + hook localized text，localized text）
  imageTaskRunning?: boolean
}

export interface NovelPromotionProject {
  id: string
  projectId: string
  stage: string
  globalAssetText: string | null
  novelText: string | null
  analysisModel: string
  imageModel: string
  characterModel: string
  locationModel: string
  storyboardModel: string
  editModel: string
  videoModel: string
  audioModel: string
  videoRatio: string
  capabilityOverrides?: CapabilitySelections | string | null
  ttsRate: string
  workflowMode: WorkflowMode  // localized text：localized text
  artStyle: string
  artStylePrompt: string | null
  audioUrl: string | null
  media?: MediaRef | null
  srtContent: string | null
  characters?: Character[]
  locations?: Location[]
  props?: Prop[]
  episodes?: Array<{
    id: string
    episodeNumber: number
    name: string
    description: string | null
    novelText: string | null
    audioUrl: string | null
    srtContent: string | null
    createdAt: Date
    updatedAt: Date
  }>
  clips?: NovelPromotionClip[]
  storyboards?: NovelPromotionStoryboard[]
  shots?: NovelPromotionShot[]
}

// ============================================
// localized text (localized text)
// ============================================
export interface Project extends BaseProject {
  novelPromotionData?: NovelPromotionProject
}
