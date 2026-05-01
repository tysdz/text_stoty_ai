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
  imageUrl: string | null
}

interface StoryboardData {
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

export const GET = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  const { searchParams } = new URL(request.url)
  const episodeId = searchParams.get('episodeId')

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
  interface ImageItem {
    description: string
    imageUrl: string
    clipIndex: number
    panelIndex: number
  }
  const images: ImageItem[] = []

  // localized text episodes localized text storyboards localized text clips
  const allStoryboards: StoryboardData[] = []
  const allClips: ClipData[] = []
  for (const episode of episodes) {
    allStoryboards.push(...(episode.storyboards || []))
    allClips.push(...(episode.clips || []))
  }

  // localized text storyboard localized text panel
  for (const storyboard of allStoryboards) {
    // localized text clip localized text clips localized text
    const clipIndex = allClips.findIndex((clip) => clip.id === storyboard.clipId)

    // localized text Panel localized text
    const panels = storyboard.panels || []
    for (const panel of panels) {
      if (panel.imageUrl) {
        images.push({
          description: panel.description || `localized text`,
          imageUrl: panel.imageUrl,
          clipIndex: clipIndex >= 0 ? clipIndex : 999,
          panelIndex: panel.panelIndex || 0
        })
      }
    }
  }

  // localized text clipIndex localized text panelIndex localized text
  images.sort((a, b) => {
    if (a.clipIndex !== b.clipIndex) {
      return a.clipIndex - b.clipIndex
    }
    return a.panelIndex - b.panelIndex
  })

  // localized text
  const indexedImages = images.map((v, idx) => ({
    ...v,
    index: idx + 1
  }))

  if (indexedImages.length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  _ulogInfo(`Preparing to download ${indexedImages.length} images for project ${projectId}`)

  const archive = archiver('zip', { zlib: { level: 9 } })

  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', (chunk) => controller.enqueue(chunk))
      archive.on('end', () => controller.close())
      archive.on('error', (err) => controller.error(err))
      processImages()
    }
  })

  async function processImages() {
    for (const image of indexedImages) {
      try {
        _ulogInfo(`Downloading image ${image.index}: ${image.imageUrl}`)

        let imageData: Buffer
        let extension = 'png'
        const storageKey = await resolveStorageKeyFromMediaValue(image.imageUrl)

        if (image.imageUrl.startsWith('http://') || image.imageUrl.startsWith('https://')) {
          // localized text URL，localized text
          const response = await fetch(toFetchableUrl(image.imageUrl))
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          imageData = Buffer.from(arrayBuffer)
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
            extension = 'jpg'
          } else if (contentType?.includes('webp')) {
            extension = 'webp'
          }
        } else if (storageKey) {
          imageData = await getObjectBuffer(storageKey)

          const keyExt = storageKey.split('.').pop()?.toLowerCase()
          if (keyExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(keyExt)) {
            extension = keyExt === 'jpeg' ? 'jpg' : keyExt
          }
        } else {
          const response = await fetch(toFetchableUrl(image.imageUrl))
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          imageData = Buffer.from(arrayBuffer)
        }

        // localized text，localized text
        const safeDesc = image.description.slice(0, 50).replace(/[\\/:*?"<>|]/g, '_')
        const fileName = `${String(image.index).padStart(3, '0')}_${safeDesc}.${extension}`
        archive.append(imageData, { name: fileName })
        _ulogInfo(`Added ${fileName} to archive`)
      } catch (error) {
        _ulogError(`Failed to download image ${image.index}:`, error)
      }
    }

    await archive.finalize()
    _ulogInfo('Archive finalized')
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(project.name)}_images.zip"`
    }
  })
})
