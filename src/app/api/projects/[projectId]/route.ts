import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addSignedUrlsToProject, deleteObjects } from '@/lib/storage'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { logProjectAction } from '@/lib/logging/semantic'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import {
  collectProjectBailianManagedVoiceIds,
  cleanupUnreferencedBailianVoices,
} from '@/lib/providers/bailian'

// GET - localized text
export const GET = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  // 🔐 localized text
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // localized text，localized text
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      user: true
    }
  })

  if (!project) {
    throw new ApiError('NOT_FOUND')
  }

  if (project.userId !== session.user.id) {
    throw new ApiError('FORBIDDEN')
  }

  // localized text（localized text，localized text）
  prisma.project.update({
    where: { id: projectId },
    data: { lastAccessedAt: new Date() }
  }).catch(err => _ulogError('localized text:', err))

  // localized textAPIlocalized text
  // localized textAPIlocalized text（localized text /api/novel-promotion/[projectId]）
  const projectWithSignedUrls = addSignedUrlsToProject(project)

  return NextResponse.json({ project: projectWithSignedUrls })
})

// PATCH - localized text
export const PATCH = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  // 🔐 localized text
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const session = authResult.session
  const body = await request.json()

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { user: true }
  })

  if (!project) {
    throw new ApiError('NOT_FOUND')
  }

  if (project.userId !== session.user.id) {
    throw new ApiError('FORBIDDEN')
  }

  // localized text
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: body
  })

  logProjectAction(
    'UPDATE',
    session.user.id,
    session.user.name,
    projectId,
    updatedProject.name,
    { changes: body }
  )

  return NextResponse.json({ project: updatedProject })
})

/**
 * localized textCOSlocalized textKey
 */
async function collectProjectCOSKeys(projectId: string): Promise<string[]> {
  const keys: string[] = []

  // localized text NovelPromotionProject
  const novelPromotion = await prisma.novelPromotionProject.findUnique({
    where: { projectId },
    include: {
      // localized text
      characters: {
        include: {
          appearances: true
        }
      },
      // localized text
      locations: {
        include: {
          images: true
        }
      },
      // localized text（localized text、localized text）
      episodes: {
        include: {
          storyboards: {
            include: {
              panels: true
            }
          }
        }
      }
    }
  })

  if (!novelPromotion) return keys

  // 1. localized text
  for (const character of novelPromotion.characters) {
    for (const appearance of character.appearances) {
      const key = await resolveStorageKeyFromMediaValue(appearance.imageUrl)
      if (key) keys.push(key)
    }
  }

  // 2. localized text
  for (const location of novelPromotion.locations) {
    for (const image of location.images) {
      const key = await resolveStorageKeyFromMediaValue(image.imageUrl)
      if (key) keys.push(key)
    }
  }

  // 3. localized text
  for (const episode of novelPromotion.episodes) {
    // localized text
    const audioKey = await resolveStorageKeyFromMediaValue(episode.audioUrl)
    if (audioKey) keys.push(audioKey)

    // localized text
    for (const storyboard of episode.storyboards) {
      // localized text
      const sbKey = await resolveStorageKeyFromMediaValue(storyboard.storyboardImageUrl)
      if (sbKey) keys.push(sbKey)

      // localized text（JSONlocalized text）
      if (storyboard.candidateImages) {
        try {
          const candidates = JSON.parse(storyboard.candidateImages)
          for (const url of candidates) {
            const key = await resolveStorageKeyFromMediaValue(url)
            if (key) keys.push(key)
          }
        } catch { }
      }

      // Panel localized text
      for (const panel of storyboard.panels) {
        const imgKey = await resolveStorageKeyFromMediaValue(panel.imageUrl)
        if (imgKey) keys.push(imgKey)

        const videoKey = await resolveStorageKeyFromMediaValue(panel.videoUrl)
        if (videoKey) keys.push(videoKey)
      }
    }
  }

  _ulogInfo(`[Project ${projectId}] localized text ${keys.length} localized text COS localized text`)
  return keys
}

// DELETE - localized text（localized textCOSlocalized text）
export const DELETE = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  // 🔐 localized text
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const session = authResult.session

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { user: true }
  })

  if (!project) {
    throw new ApiError('NOT_FOUND')
  }

  if (project.userId !== session.user.id) {
    throw new ApiError('FORBIDDEN')
  }

  // 1. localized text COS localized text Key
  _ulogInfo(`[DELETE] localized text: ${project.name} (${projectId})`)
  const projectVoiceIds = await collectProjectBailianManagedVoiceIds(projectId)
  const voiceCleanupResult = await cleanupUnreferencedBailianVoices({
    voiceIds: projectVoiceIds,
    scope: {
      userId: session.user.id,
      excludeProjectId: projectId,
    },
  })
  const cosKeys = await collectProjectCOSKeys(projectId)

  // 2. localized text COS localized text
  let cosResult = { success: 0, failed: 0 }
  if (cosKeys.length > 0) {
    _ulogInfo(`[DELETE] localized text ${cosKeys.length} localized text COS localized text...`)
    cosResult = await deleteObjects(cosKeys)
  }

  // 3. localized text (localized text)
  await prisma.project.delete({
    where: { id: projectId }
  })

  logProjectAction(
    'DELETE',
    session.user.id,
    session.user.name,
    projectId,
    project.name,
    {
      projectName: project.name,
      cosFilesDeleted: cosResult.success,
      cosFilesFailed: cosResult.failed,
      bailianVoicesDeleted: voiceCleanupResult.deletedVoiceIds.length,
      bailianVoicesSkippedReferenced: voiceCleanupResult.skippedReferencedVoiceIds.length,
    }
  )

  _ulogInfo(`[DELETE] localized text: ${project.name}`)
  _ulogInfo(`[DELETE] COS localized text: success ${cosResult.success}, failed ${cosResult.failed}`)
  _ulogInfo(`[DELETE] Bailian localized text: delete ${voiceCleanupResult.deletedVoiceIds.length}, localized text(localized text) ${voiceCleanupResult.skippedReferencedVoiceIds.length}`)

  return NextResponse.json({
    success: true,
    cosFilesDeleted: cosResult.success,
    cosFilesFailed: cosResult.failed,
    bailianVoicesDeleted: voiceCleanupResult.deletedVoiceIds.length,
    bailianVoicesSkippedReferenced: voiceCleanupResult.skippedReferencedVoiceIds.length,
  })
})
