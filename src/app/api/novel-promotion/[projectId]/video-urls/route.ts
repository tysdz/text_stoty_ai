import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

interface PanelData {
    panelIndex: number | null
    description: string | null
    videoUrl: string | null
    lipSyncVideoUrl: string | null
}

interface StoryboardData {
    id: string
    clipId: string
    panels?: PanelData[]
}

interface ClipData {
    id: string
}

interface EpisodeData {
    storyboards?: StoryboardData[]
    clips?: ClipData[]
}

/**
 * localized text（localized text）
 * localized text，localized text
 */
export const POST = apiHandler(async (
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await context.params

    // localized text
    const body = await request.json()
    const { episodeId, panelPreferences } = body as {
        episodeId?: string
        panelPreferences?: Record<string, boolean>  // key: panelKey, value: true=localized text, false=localized text
    }

    // 🔐 localized text
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult
    const project = authResult.project

    // localized text episodeId localized text
    let episodes: EpisodeData[] = []

    if (episodeId) {
        // localized text
        const episode = await prisma.novelPromotionEpisode.findUnique({
            where: { id: episodeId },
            include: {
                storyboards: {
                    include: {
                        panels: { orderBy: { panelIndex: 'asc' } }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                clips: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        })
        if (episode) {
            episodes = [episode]
        }
    } else {
        // localized text
        const npData = await prisma.novelPromotionProject.findFirst({
            where: { projectId },
            include: {
                episodes: {
                    include: {
                        storyboards: {
                            include: {
                                panels: { orderBy: { panelIndex: 'asc' } }
                            },
                            orderBy: { createdAt: 'asc' }
                        },
                        clips: {
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            }
        })
        episodes = npData?.episodes || []
    }

    if (episodes.length === 0) {
        throw new ApiError('NOT_FOUND')
    }

    // localized text panel
    interface VideoItem {
        fileName: string
        videoUrl: string  // localized textURL
        clipIndex: number
        panelIndex: number
    }

    // localized text episodes localized text storyboards localized text clips
    const allStoryboards: StoryboardData[] = []
    const allClips: ClipData[] = []
    for (const episode of episodes) {
        allStoryboards.push(...(episode.storyboards || []))
        allClips.push(...(episode.clips || []))
    }

    interface VideoCandidate extends VideoItem {
        videoKey: string
        desc: string
    }
    const videoCandidates: VideoCandidate[] = []

    // localized text storyboard localized text panel
    for (const storyboard of allStoryboards) {
        const clipIndex = allClips.findIndex((clip) => clip.id === storyboard.clipId)

        const panels = storyboard.panels || []
        for (const panel of panels) {
            // localized text panelKey localized text
            const panelKey = `${storyboard.id}-${panel.panelIndex || 0}`
            const preferLipSync = panelPreferences?.[panelKey] ?? true

            // localized text
            let videoKey: string | null = null

            if (preferLipSync) {
                videoKey = panel.lipSyncVideoUrl || panel.videoUrl
            } else {
                videoKey = panel.videoUrl || panel.lipSyncVideoUrl
            }

            if (videoKey) {
                // localized text，localized text
                const safeDesc = (panel.description || 'localized text').slice(0, 50).replace(/[\\/:*?"<>|]/g, '_')

                videoCandidates.push({
                    fileName: '',
                    videoUrl: '',
                    clipIndex: clipIndex >= 0 ? clipIndex : 999,
                    panelIndex: panel.panelIndex || 0,
                    videoKey,
                    desc: safeDesc})
            }
        }
    }

    // localized text clipIndex localized text panelIndex localized text
    videoCandidates.sort((a, b) => {
        if (a.clipIndex !== b.clipIndex) {
            return a.clipIndex - b.clipIndex
        }
        return a.panelIndex - b.panelIndex
    })

    // localized textURL
    const result = videoCandidates.map((video, idx) => {
        const videoKey = video.videoKey
        const safeDesc = video.desc
        const index = idx + 1
        const fileName = `${String(index).padStart(3, '0')}_${safeDesc}.mp4`

        // localized text URL，localized text CORS localized text
        const proxyUrl = `/api/novel-promotion/${projectId}/video-proxy?key=${encodeURIComponent(videoKey)}`

        return {
            index,
            fileName,
            videoUrl: proxyUrl
        }
    })

    if (result.length === 0) {
        throw new ApiError('INVALID_PARAMS')
    }

    return NextResponse.json({
        projectName: project.name,
        videos: result
    })
})
