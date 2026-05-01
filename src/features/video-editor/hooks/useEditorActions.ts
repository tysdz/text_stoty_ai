'use client'

import { useCallback } from 'react'
import { VideoClip, VideoEditorProject } from '../types/editor.types'
import { apiFetch } from '@/lib/api-fetch'

interface UseEditorActionsProps {
    projectId: string
    episodeId: string
}

/**
 * localized text（localized text）
 */
interface PanelData {
    id?: string
    panelIndex?: number
    storyboardId: string
    videoUrl?: string
    description?: string
    duration?: number
}

/**
 * localized text
 */
export function createProjectFromPanels(
    episodeId: string,
    panels: PanelData[],
    voiceLines?: Array<{ id: string; speaker: string; content: string; audioUrl?: string | null }>
): VideoEditorProject {
    // localized text
    const videoPanels = panels.filter(p => p.videoUrl)

    // localized text
    const timeline: VideoClip[] = videoPanels.map((panel, index) => {
        // localized text（localized text：localized text）
        const matchedVoice = voiceLines?.[index]

        return {
            id: `clip_${panel.id || panel.storyboardId}_${panel.panelIndex ?? index}`,
            src: panel.videoUrl!,
            durationInFrames: Math.round((panel.duration || 3) * 30), // Default 3 localized text，30fps
            attachment: {
                audio: matchedVoice?.audioUrl ? {
                    src: matchedVoice.audioUrl,
                    volume: 1,
                    voiceLineId: matchedVoice.id
                } : undefined,
                subtitle: matchedVoice ? {
                    text: matchedVoice.content,
                    style: 'default' as const
                } : undefined
            },
            transition: index < videoPanels.length - 1 ? {
                type: 'dissolve' as const,
                durationInFrames: 15 // 0.5s @ 30fps
            } : undefined,
            metadata: {
                panelId: panel.id || `${panel.storyboardId}-${panel.panelIndex ?? index}`,
                storyboardId: panel.storyboardId,
                description: panel.description || undefined
            }
        }
    })

    return {
        id: `editor_${episodeId}_${Date.now()}`,
        episodeId,
        schemaVersion: '1.0',
        config: {
            fps: 30,
            width: 1920,
            height: 1080
        },
        timeline,
        bgmTrack: []
    }
}

export function useEditorActions({ projectId, episodeId }: UseEditorActionsProps) {
    /**
     * localized text
     */
    const saveProject = useCallback(async (project: VideoEditorProject) => {
        const response = await apiFetch(`/api/novel-promotion/${projectId}/editor`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectData: project })
        })

        if (!response.ok) {
            throw new Error('Failed to save project')
        }

        return response.json()
    }, [projectId])

    /**
     * localized text
     */
    const loadProject = useCallback(async (): Promise<VideoEditorProject | null> => {
        const response = await apiFetch(`/api/novel-promotion/${projectId}/editor?episodeId=${episodeId}`)

        if (!response.ok) {
            if (response.status === 404) return null
            throw new Error('Failed to load project')
        }

        const data = await response.json()
        return data.projectData
    }, [projectId, episodeId])

    /**
     * localized text
     */
    const startRender = useCallback(async (editorProjectId: string) => {
        const response = await apiFetch(`/api/novel-promotion/${projectId}/editor/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                editorProjectId,
                format: 'mp4',
                quality: 'high'
            })
        })

        if (!response.ok) {
            throw new Error('Failed to start render')
        }

        return response.json()
    }, [projectId])

    /**
     * localized text
     */
    const getRenderStatus = useCallback(async (editorProjectId: string) => {
        const response = await apiFetch(
            `/api/novel-promotion/${projectId}/editor/render?id=${editorProjectId}`
        )

        if (!response.ok) {
            throw new Error('Failed to get render status')
        }

        return response.json()
    }, [projectId])

    return {
        saveProject,
        loadProject,
        startRender,
        getRenderStatus
    }
}
