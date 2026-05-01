'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { resolveTaskErrorMessage } from '@/lib/task/error-message'
import type { Project, MediaRef } from '@/types/project'
import { apiFetch } from '@/lib/api-fetch'

// ============ localized text Hook ============

interface ProjectDataResponse {
    project: Project
}

/**
 * localized text
 * localized text useProject hook
 */
export function useProjectData(projectId: string | null) {
    return useQuery({
        queryKey: queryKeys.projectData(projectId || ''),
        queryFn: async () => {
            if (!projectId) throw new Error('Project ID is required')
            const res = await apiFetch(`/api/projects/${projectId}/data`)
            if (!res.ok) {
                const error = await res.json()
                throw new Error(resolveTaskErrorMessage(error, 'Failed to load project'))
            }
            const data: ProjectDataResponse = await res.json()
            return data.project
        },
        enabled: !!projectId,
        staleTime: 5000,
    })
}

/**
 * localized text
 */
export function useRefreshProjectData(projectId: string | null) {
    const queryClient = useQueryClient()

    return () => {
        if (projectId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
        }
    }
}

// ============ localized text Hook ============

export interface Episode {
    id: string
    episodeNumber: number
    name: string
    description?: string | null
    novelText?: string | null
    audioUrl?: string | null
    media?: MediaRef | null
    srtContent?: string | null
    createdAt: string
    // localized text
    voiceLines?: VoiceLine[]
    storyboardData?: StoryboardData
}

interface VoiceLine {
    id: string
    text: string
    speakerId: string
    audioUrl?: string | null
    media?: MediaRef | null
    lineTaskRunning?: boolean
}

interface StoryboardData {
    panels: unknown[]
}

/**
 * localized text
 */
export function useEpisodeData(projectId: string | null, episodeId: string | null) {
    return useQuery({
        queryKey: queryKeys.episodeData(projectId || '', episodeId || ''),
        queryFn: async () => {
            if (!projectId || !episodeId) throw new Error('Project ID and Episode ID are required')
            const res = await apiFetch(`/api/novel-promotion/${projectId}/episodes/${episodeId}`)
            if (!res.ok) {
                const error = await res.json()
                throw new Error(resolveTaskErrorMessage(error, 'Failed to load episode'))
            }
            const data = await res.json()
            return data.episode as Episode
        },
        enabled: !!projectId && !!episodeId,
        staleTime: 5000,
    })
}

/**
 * localized text（localized text）
 */
export function useEpisodes(projectId: string | null) {
    const { data: project } = useProjectData(projectId)

    const episodes = project?.novelPromotionData?.episodes || []
    return { episodes, isLoading: !project }
}

/**
 * localized text
 */
export function useRefreshEpisodeData(projectId: string | null, episodeId: string | null) {
    const queryClient = useQueryClient()

    return () => {
        if (projectId && episodeId) {
            queryClient.invalidateQueries({
                queryKey: queryKeys.episodeData(projectId, episodeId)
            })
        }
    }
}

/**
 * localized text（Project + localized text）
 */
export function useRefreshAll(projectId: string | null, episodeId: string | null) {
    const queryClient = useQueryClient()

    return () => {
        if (projectId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
            queryClient.invalidateQueries({ queryKey: queryKeys.projectAssets.all(projectId) })
        }
        if (projectId && episodeId) {
            queryClient.invalidateQueries({
                queryKey: queryKeys.episodeData(projectId, episodeId)
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.storyboards.all(episodeId)
            })
        }
    }
}
