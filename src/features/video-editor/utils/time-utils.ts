import { VideoClip, ComputedClip, VideoEditorProject } from '../types/editor.types'

/**
 * localized text (localized text)
 * localized text
 */
export function calculateTimelineDuration(clips: VideoClip[]): number {
    if (clips.length === 0) return 0

    return clips.reduce((total, clip, index) => {
        let duration = clip.durationInFrames

        // localized text
        if (index < clips.length - 1 && clip.transition) {
            // localized text（localized text）
            duration -= Math.floor(clip.transition.durationInFrames / 2)
        }

        return total + duration
    }, 0)
}

/**
 * localized text
 * localized text UI localized text
 */
export function computeClipPositions(clips: VideoClip[]): ComputedClip[] {
    let currentFrame = 0

    return clips.map((clip, index) => {
        const startFrame = currentFrame
        const endFrame = startFrame + clip.durationInFrames

        // localized text（localized text）
        if (clip.transition && index < clips.length - 1) {
            currentFrame = endFrame - Math.floor(clip.transition.durationInFrames / 2)
        } else {
            currentFrame = endFrame
        }

        return {
            ...clip,
            startFrame,
            endFrame
        }
    })
}

/**
 * localized text
 */
export function framesToTime(frames: number, fps: number): string {
    const totalSeconds = frames / fps
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const milliseconds = Math.floor((totalSeconds % 1) * 100)

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}

/**
 * localized text
 */
export function timeToFrames(time: string, fps: number): number {
    const [minSec, ms] = time.split('.')
    const [minutes, seconds] = minSec.split(':').map(Number)
    const totalSeconds = minutes * 60 + seconds + (parseInt(ms || '0') / 100)
    return Math.round(totalSeconds * fps)
}

/**
 * localized text ID
 */
export function generateClipId(): string {
    return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * localized text
 */
export function createDefaultProject(episodeId: string): VideoEditorProject {
    return {
        id: `editor_${Date.now()}`,
        episodeId,
        schemaVersion: '1.0',
        config: {
            fps: 30,
            width: 1920,
            height: 1080
        },
        timeline: [],
        bgmTrack: []
    }
}
