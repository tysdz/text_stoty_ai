import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import archiver from 'archiver'
import { getObjectBuffer, toFetchableUrl } from '@/lib/storage'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

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

  // localized text
  const whereClause: Record<string, unknown> = {
    audioUrl: { not: null }
  }

  if (episodeId) {
    whereClause.episodeId = episodeId
  } else {
    // localized text episodeId，localized text
    const npData = await prisma.novelPromotionProject.findFirst({
      where: { projectId },
      include: { episodes: { select: { id: true } } }
    })
    if (npData?.episodes) {
      whereClause.episodeId = { in: npData.episodes.map(e => e.id) }
    }
  }

  const voiceLines = await prisma.novelPromotionVoiceLine.findMany({
    where: whereClause,
    orderBy: [
      { lineIndex: 'asc' }  // localized text（localized text）
    ]
  })

  if (voiceLines.length === 0) {
    throw new ApiError('NOT_FOUND')
  }

  _ulogInfo(`Preparing to download ${voiceLines.length} voice lines for project ${projectId}`)

  const archive = archiver('zip', { zlib: { level: 9 } })

  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', (chunk) => controller.enqueue(chunk))
      archive.on('end', () => controller.close())
      archive.on('error', (err) => controller.error(err))
      processVoices()
    }
  })

  async function processVoices() {
    for (const line of voiceLines) {
      try {
        if (!line.audioUrl) continue

        _ulogInfo(`Downloading voice ${line.lineIndex}: ${line.audioUrl}`)

        let audioData: Buffer
        const storageKey = await resolveStorageKeyFromMediaValue(line.audioUrl)

        if (line.audioUrl.startsWith('http://') || line.audioUrl.startsWith('https://')) {
          const response = await fetch(toFetchableUrl(line.audioUrl))
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          audioData = Buffer.from(arrayBuffer)
        } else if (storageKey) {
          audioData = await getObjectBuffer(storageKey)
        } else {
          const response = await fetch(toFetchableUrl(line.audioUrl))
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          audioData = Buffer.from(arrayBuffer)
        }

        // localized text
        const safeSpeaker = line.speaker.replace(/[\\/:*?"<>|]/g, '_')

        // localized text15localized text
        const safeContent = line.content.slice(0, 15).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_')

        // localized text
        const extSource = storageKey || line.audioUrl
        const ext = extSource.endsWith('.wav') ? 'wav' : 'mp3'

        // localized text: localized text_localized text_localized text.mp3（localized text，localized text）
        const fileName = `${String(line.lineIndex).padStart(3, '0')}_${safeSpeaker}_${safeContent}.${ext}`

        archive.append(audioData, { name: fileName })
        _ulogInfo(`Added ${fileName} to archive`)
      } catch (error) {
        _ulogError(`Failed to download voice line ${line.lineIndex}:`, error)
      }
    }

    await archive.finalize()
    _ulogInfo('Archive finalized')
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(project.name)}_voices.zip"`
    }
  })
})
