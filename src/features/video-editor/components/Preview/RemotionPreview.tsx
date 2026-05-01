'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Player, PlayerRef } from '@remotion/player'
import { AppIcon } from '@/components/ui/icons'
import { VideoComposition } from '../../remotion/VideoComposition'
import { VideoEditorProject } from '../../types/editor.types'
import { calculateTimelineDuration } from '../../utils/time-utils'

interface RemotionPreviewProps {
    project: VideoEditorProject
    currentFrame: number
    playing: boolean
    onFrameChange?: (frame: number) => void
    onPlayingChange?: (playing: boolean) => void
}

/**
 * Remotion Player localized text
 * localized text：timelineState ↔ Player
 */
export const RemotionPreview: React.FC<RemotionPreviewProps> = ({
    project,
    currentFrame,
    playing,
    onFrameChange,
    onPlayingChange
}) => {
    const t = useTranslations('video')
    const playerRef = useRef<PlayerRef>(null)
    const lastSyncedFrame = useRef<number>(0)

    const totalDuration = useMemo(
        () => calculateTimelineDuration(project.timeline),
        [project.timeline]
    )

    // localized text currentFrame localized text，localized text Player
    useEffect(() => {
        const player = playerRef.current
        if (!player) return

        // localized text：localized text 1 localized text seek
        if (Math.abs(currentFrame - lastSyncedFrame.current) > 1) {
            player.seekTo(currentFrame)
            lastSyncedFrame.current = currentFrame
        }
    }, [currentFrame])

    // localized text playing localized text，localized text Player localized text/localized text
    useEffect(() => {
        const player = playerRef.current
        if (!player) return

        if (playing) {
            player.play()
        } else {
            player.pause()
        }
    }, [playing])

    // localized text Player localized text，localized text timelineState
    useEffect(() => {
        const player = playerRef.current
        if (!player) return

        const handleFrameUpdate = () => {
            const frame = player.getCurrentFrame()
            lastSyncedFrame.current = frame
            onFrameChange?.(frame)
        }

        // Remotion Player localized text timeupdate localized text
        player.addEventListener('frameupdate', handleFrameUpdate)

        return () => {
            player.removeEventListener('frameupdate', handleFrameUpdate)
        }
    }, [onFrameChange])

    // localized text Player localized text
    useEffect(() => {
        const player = playerRef.current
        if (!player) return

        const handlePlay = () => onPlayingChange?.(true)
        const handlePause = () => onPlayingChange?.(false)
        const handleEnded = () => onPlayingChange?.(false)

        player.addEventListener('play', handlePlay)
        player.addEventListener('pause', handlePause)
        player.addEventListener('ended', handleEnded)

        return () => {
            player.removeEventListener('play', handlePlay)
            player.removeEventListener('pause', handlePause)
            player.removeEventListener('ended', handleEnded)
        }
    }, [onPlayingChange])

    // localized text，localized text
    if (project.timeline.length === 0) {
        return (
            <div style={{
                width: '100%',
                aspectRatio: `${project.config.width} / ${project.config.height}`,
                maxHeight: '100%',
                background: 'var(--glass-bg-surface)',
                border: '1px solid var(--glass-stroke-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: 'var(--glass-text-tertiary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                        <AppIcon name="image" className="w-12 h-12" />
                    </div>
                    <span>{t('editor.preview.emptyStartEditing')}</span>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            width: '100%',
            aspectRatio: `${project.config.width} / ${project.config.height}`,
            maxHeight: '100%',
            background: 'var(--glass-overlay-strong)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            <Player
                ref={playerRef}
                component={VideoComposition}
                inputProps={{
                    clips: project.timeline,
                    bgmTrack: project.bgmTrack,
                    config: project.config
                }}
                durationInFrames={Math.max(1, totalDuration)}
                fps={project.config.fps}
                compositionWidth={project.config.width}
                compositionHeight={project.config.height}
                style={{
                    width: '100%',
                    height: '100%'
                }}
                controls={false}  // localized text
                loop={false}
                clickToPlay={false}  // localized text，localized text
            />
        </div>
    )
}

export default RemotionPreview
