// ========================================
// Video Editor Core Types
// Schema Version: 1.0
// ========================================

/**
 * localized text - localized text
 */
export interface VideoEditorProject {
    id: string
    episodeId: string
    schemaVersion: '1.0'

    config: EditorConfig

    // localized text (localized text) - localized text
    timeline: VideoClip[]

    // BGM localized text (localized text)
    bgmTrack: BgmClip[]
}

/**
 * localized text
 */
export interface EditorConfig {
    fps: number
    width: number
    height: number
}

/**
 * localized text - localized text
 */
export interface VideoClip {
    id: string
    src: string                    // COS URL
    durationInFrames: number       // localized text

    // localized text (localized text)
    trim?: {
        from: number                 // localized text
        to: number                   // localized text
    }

    // localized text - localized text
    attachment?: ClipAttachment

    // localized text (localized text)
    transition?: ClipTransition

    // AI localized text (localized text)
    metadata: ClipMetadata
}

/**
 * localized text (localized text + localized text)
 */
export interface ClipAttachment {
    audio?: {
        src: string
        volume: number
        voiceLineId?: string
    }
    subtitle?: {
        text: string
        style: 'default' | 'cinematic'
    }
}

/**
 * localized text
 */
export interface ClipTransition {
    type: 'none' | 'dissolve' | 'fade' | 'slide'
    durationInFrames: number
}

/**
 * localized text
 */
export interface ClipMetadata {
    panelId: string
    storyboardId: string
    description?: string
}

/**
 * BGM localized text - localized text
 */
export interface BgmClip {
    id: string
    src: string
    startFrame: number             // localized text
    durationInFrames: number
    volume: number
    fadeIn?: number
    fadeOut?: number
}

// ========================================
// localized text UI localized text
// ========================================

export interface TimelineState {
    currentFrame: number
    playing: boolean
    selectedClipId: string | null
    zoom: number                   // localized text (1 = 100%)
}

// ========================================
// localized text
// ========================================

export interface ComputedClip extends VideoClip {
    startFrame: number             // localized text
    endFrame: number               // localized text
}

// ========================================
// API localized text
// ========================================

export interface SaveEditorProjectRequest {
    projectData: VideoEditorProject
}

export interface RenderRequest {
    editorProjectId: string
    format: 'mp4' | 'webm'
    quality: 'draft' | 'high'
}

export interface RenderStatus {
    status: 'pending' | 'rendering' | 'completed' | 'failed'
    progress?: number
    outputUrl?: string
    error?: string
}
