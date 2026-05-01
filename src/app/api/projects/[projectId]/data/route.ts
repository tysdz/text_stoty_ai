import { logError as _ulogError } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { attachMediaFieldsToProject } from '@/lib/media/attach'

function readAssetKind(value: Record<string, unknown>): string {
  return typeof value.assetKind === 'string' ? value.assetKind : 'location'
}

/**
 * localized textAPI
 * localized text、localized text、localized text
 */
export const GET = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // localized text
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

  // 🔥 localized text（localized text，localized text）
  prisma.project.update({
    where: { id: projectId },
    data: { lastAccessedAt: new Date() }
  }).catch(err => _ulogError('localized text:', err))

  // ⚡ localized text：localized text novel-promotion localized text
  // localized text：characters/locations localized text，localized text episodes localized text
  const novelPromotionData = await prisma.novelPromotionProject.findUnique({
    where: { projectId },
    include: {
      // localized text（localized text）- localized text
      episodes: {
        orderBy: { episodeNumber: 'asc' }
      },
      // ⚡ localized text - localized text
      characters: {
        include: {
          appearances: true
        },
        orderBy: { createdAt: 'asc' }
      },
      locations: {
        include: {
          images: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!novelPromotionData) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text URL（localized text）
  const novelPromotionDataWithSignedUrls = await attachMediaFieldsToProject(novelPromotionData)
  const filteredNovelPromotionData = {
    ...novelPromotionDataWithSignedUrls,
    locations: (novelPromotionDataWithSignedUrls.locations || []).filter((item) => readAssetKind(item) !== 'prop'),
    props: (novelPromotionDataWithSignedUrls.locations || []).filter((item) => readAssetKind(item) === 'prop'),
  }

  const fullProject = {
    ...project,
    novelPromotionData: filteredNovelPromotionData
    // 🔥 localized text userPreference localized text
    // editModel localized text novelPromotionData localized text
  }

  return NextResponse.json({ project: fullProject })
})
