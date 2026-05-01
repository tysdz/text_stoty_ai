import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSignedUrl, generateUniqueKey, downloadAndUploadImage, toFetchableUrl } from '@/lib/storage'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

interface PanelHistoryEntry {
  url: string
  timestamp: string
}

function parseUnknownArray(jsonValue: string | null): unknown[] {
  if (!jsonValue) return []
  try {
    const parsed = JSON.parse(jsonValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parsePanelHistory(jsonValue: string | null): PanelHistoryEntry[] {
  return parseUnknownArray(jsonValue).filter((entry): entry is PanelHistoryEntry => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as { url?: unknown; timestamp?: unknown }
    return typeof candidate.url === 'string' && typeof candidate.timestamp === 'string'
  })
}

/**
 * POST /api/novel-promotion/[projectId]/panel/select-candidate
 * localized text API
 * 
 * action: 'select' - localized text
 * action: 'cancel' - localized text，localized text
 */
export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json()
  const { panelId, selectedImageUrl, action = 'select' } = body

  if (!panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // === localized text ===
  if (action === 'cancel') {
    await prisma.novelPromotionPanel.update({
      where: { id: panelId },
      data: { candidateImages: null }
    })

    return NextResponse.json({
      success: true,
      message: 'localized text'
    })
  }

  // === localized text ===
  if (!selectedImageUrl) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text Panel
  const panel = await prisma.novelPromotionPanel.findUnique({
    where: { id: panelId }
  })

  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }

  // localized text
  const candidateImages = parseUnknownArray(panel.candidateImages)

  const selectedCosKey = await resolveStorageKeyFromMediaValue(selectedImageUrl)
  const candidateKeys = (await Promise.all(candidateImages.map((candidate: unknown) => resolveStorageKeyFromMediaValue(candidate))))
    .filter((k): k is string => !!k)
  const isValidCandidate = !!selectedCosKey && candidateKeys.includes(selectedCosKey)

  if (!isValidCandidate) {
    _ulogInfo(
      `[select-candidate] localized text: selectedCosKey=${selectedCosKey}, candidateKeys=${JSON.stringify(candidateKeys)}, candidateImages=${JSON.stringify(candidateImages)}`,
    )
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const currentHistory = parsePanelHistory(panel.imageHistory)
  if (panel.imageUrl) {
    currentHistory.push({
      url: panel.imageUrl,
      timestamp: new Date().toISOString()
    })
  }

  // localized text COS key，localized text（localized text /m/* localized textURLlocalized text Node fetch localized text）
  let finalImageKey = selectedCosKey as string
  const isReusableKey = !finalImageKey.startsWith('http://') && !finalImageKey.startsWith('https://') && !finalImageKey.startsWith('/')

  if (!isReusableKey) {
    const sourceUrl = toFetchableUrl(selectedImageUrl)
    const cosKey = generateUniqueKey(`panel-${panelId}-selected`, 'png')
    finalImageKey = await downloadAndUploadImage(sourceUrl, cosKey)
  }

  const signedUrl = getSignedUrl(finalImageKey, 7 * 24 * 3600)

  // update Panel：localized text，localized text
  await prisma.novelPromotionPanel.update({
    where: { id: panelId },
    data: {
      imageUrl: finalImageKey,
      imageHistory: JSON.stringify(currentHistory),
      candidateImages: null
    }
  })

  return NextResponse.json({
    success: true,
    imageUrl: signedUrl,
    cosKey: finalImageKey,
    message: 'localized text'
  })
})
