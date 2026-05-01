import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import archiver from 'archiver'
import { getObjectBuffer, toFetchableUrl } from '@/lib/storage'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
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
  const { project } = authResult

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
    description: string
    videoUrl: string
    clipIndex: number  // localized text clip localized text
    panelIndex: number
    isLipSync?: boolean  // localized text
  }
  const videos: VideoItem[] = []

  // localized text episodes localized text storyboards localized text clips
  const allStoryboards: StoryboardData[] = []
  const allClips: ClipData[] = []
  for (const episode of episodes) {
    allStoryboards.push(...(episode.storyboards || []))
    allClips.push(...(episode.clips || []))
  }

  // localized text storyboard localized text panel
  for (const storyboard of allStoryboards) {
    // localized text clip localized text clips localized text（localized text Agent localized text）
    const clipIndex = allClips.findIndex((clip) => clip.id === storyboard.clipId)

    // localized text Panel localized text
    const panels = storyboard.panels || []
    for (const panel of panels) {
      // localized text panelKey localized text
      const panelKey = `${storyboard.id}-${panel.panelIndex || 0}`
      // localized text panel localized text，Default true（localized text）
      const preferLipSync = panelPreferences?.[panelKey] ?? true

      // localized text
      let videoUrl: string | null = null
      let isLipSync = false

      if (preferLipSync) {
        // localized text，localized text
        videoUrl = panel.lipSyncVideoUrl || panel.videoUrl
        isLipSync = !!panel.lipSyncVideoUrl
      } else {
        // localized text，localized text（localized text）
        videoUrl = panel.videoUrl || panel.lipSyncVideoUrl
        isLipSync = !panel.videoUrl && !!panel.lipSyncVideoUrl
      }

      if (videoUrl) {
        videos.push({
          description: panel.description || `localized text`,
          videoUrl: videoUrl,
          clipIndex: clipIndex >= 0 ? clipIndex : 999,  // localized text
          panelIndex: panel.panelIndex || 0,
          isLipSync
        })
      }
    }
  }

  // localized text clipIndex localized text panelIndex localized text
  videos.sort((a, b) => {
    if (a.clipIndex !== b.clipIndex) {
      return a.clipIndex - b.clipIndex
    }
    return a.panelIndex - b.panelIndex
  })

  // localized text
  const indexedVideos = videos.map((v, idx) => ({
    ...v,
    index: idx + 1
  }))

  if (indexedVideos.length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  _ulogInfo(`Preparing to download ${indexedVideos.length} videos for project ${projectId}`)

  const archive = archiver('zip', { zlib: { level: 9 } })

  // localized text Promise localized text
  const archiveFinished = new Promise<void>((resolve, reject) => {
    archive.on('end', () => resolve())
    archive.on('error', (err) => {
      reject(err)
    })
  })

  // localized text PassThrough localized text
  const chunks: Uint8Array[] = []
  archive.on('data', (chunk) => {
    chunks.push(chunk)
  })

  // localized text
  for (const video of indexedVideos) {
    try {
      _ulogInfo(`Downloading video ${video.index}: ${video.videoUrl}`)

      let videoData: Buffer
      const storageKey = await resolveStorageKeyFromMediaValue(video.videoUrl)

      if (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://')) {
        const response = await fetch(toFetchableUrl(video.videoUrl))
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        videoData = Buffer.from(arrayBuffer)
      } else if (storageKey) {
        videoData = await getObjectBuffer(storageKey)
      } else {
        const response = await fetch(toFetchableUrl(video.videoUrl))
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        videoData = Buffer.from(arrayBuffer)
      }

      // localized text，localized text
      const safeDesc = video.description.slice(0, 50).replace(/[\\/:*?"<>|]/g, '_')
      const fileName = `${String(video.index).padStart(3, '0')}_${safeDesc}.mp4`
      archive.append(videoData, { name: fileName })
      _ulogInfo(`Added ${fileName} to archive`)
    } catch (error) {
      _ulogError(`Failed to download video ${video.index}:`, error)
    }
  }

  // localized text
  await archive.finalize()
  _ulogInfo('Archive finalized')

  // localized text
  await archiveFinished

  // localized text
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return new Response(result, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(project.name)}_videos.zip"`
    }
  })
})
