import { logError as _ulogError } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuth, requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { PRIMARY_APPEARANCE_INDEX, isArtStyleValue, type ArtStyleValue } from '@/lib/constants'
import { resolveTaskLocale } from '@/lib/task/resolve-locale'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import {
  collectBailianManagedVoiceIds,
  cleanupUnreferencedBailianVoices,
} from '@/lib/providers/bailian'

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// localized text（localized text）
export const PATCH = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json()
  const { characterId, name, introduction } = body

  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (!name && introduction === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const updateData: { name?: string; introduction?: string } = {}
  if (name) updateData.name = name.trim()
  if (introduction !== undefined) updateData.introduction = introduction.trim()

  // localized text
  const character = await prisma.novelPromotionCharacter.update({
    where: { id: characterId },
    data: updateData
  })

  return NextResponse.json({ success: true, character })
})

// localized text（localized text）
export const DELETE = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const characterId = searchParams.get('id')

  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const character = await prisma.novelPromotionCharacter.findFirst({
    where: {
      id: characterId,
      novelPromotionProject: { projectId },
    },
    select: {
      id: true,
      voiceId: true,
      voiceType: true,
    },
  })
  if (!character) {
    throw new ApiError('NOT_FOUND')
  }

  const candidateVoiceIds = collectBailianManagedVoiceIds([
    {
      voiceId: character.voiceId,
      voiceType: character.voiceType,
    },
  ])
  await cleanupUnreferencedBailianVoices({
    voiceIds: candidateVoiceIds,
    scope: {
      userId: session.user.id,
      excludeNovelCharacterId: character.id,
    },
  })

  // localized text（CharacterAppearance localized text）
  await prisma.novelPromotionCharacter.delete({
    where: { id: characterId }
  })

  return NextResponse.json({ success: true })
})

// localized text
export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { novelData } = authResult

  const rawBody = await request.json().catch(() => ({}))
  const body = toObject(rawBody)
  const taskLocale = resolveTaskLocale(request, body)
  const bodyMeta = toObject(body.meta)
  const acceptLanguage = request.headers.get('accept-language') || ''
  const name = normalizeString(body.name)
  const description = normalizeString(body.description)
  const referenceImageUrl = normalizeString(body.referenceImageUrl)
  const generateFromReference = body.generateFromReference === true
  const customDescription = normalizeString(body.customDescription)
  const count = generateFromReference
    ? normalizeImageGenerationCount('reference-to-character', body.count)
    : normalizeImageGenerationCount('character', body.count)
  let artStyle: ArtStyleValue | undefined
  if (Object.prototype.hasOwnProperty.call(body, 'artStyle')) {
    const parsedArtStyle = normalizeString(body.artStyle)
    if (!isArtStyleValue(parsedArtStyle)) {
      throw new ApiError('INVALID_PARAMS', {
        code: 'INVALID_ART_STYLE',
        message: 'artStyle must be a supported value',
      })
    }
    artStyle = parsedArtStyle
  }
  const resolvedArtStyle: ArtStyleValue = artStyle ?? 'american-comic'
  const referenceImageUrls = Array.isArray(body.referenceImageUrls)
    ? body.referenceImageUrls.map((item) => normalizeString(item)).filter(Boolean)
    : []

  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }

  // 🔥 localized text（localized text 5 localized text），localized text
  let allReferenceImages: string[] = []
  if (referenceImageUrls.length > 0) {
    allReferenceImages = referenceImageUrls.slice(0, 5)
  } else if (referenceImageUrl) {
    allReferenceImages = [referenceImageUrl]
  }

  // localized text
  const character = await prisma.novelPromotionCharacter.create({
    data: {
      novelPromotionProjectId: novelData.id,
      name,
      aliases: null
    }
  })

  // localized text（localized text）
  const descText = description || `${name} localized text`
  const appearance = await prisma.characterAppearance.create({
    data: {
      characterId: character.id,
      appearanceIndex: PRIMARY_APPEARANCE_INDEX,
      changeReason: 'initial appearance',
      description: descText,
      descriptions: JSON.stringify([descText]),
      imageUrls: encodeImageUrls([]),
      previousImageUrls: encodeImageUrls([])}
  })

  if (generateFromReference && allReferenceImages.length > 0) {
    const { getBaseUrl } = await import('@/lib/env')
    const baseUrl = getBaseUrl()
    fetch(`${baseUrl}/api/novel-promotion/${projectId}/reference-to-character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        ...(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {})
      },
      body: JSON.stringify({
        referenceImageUrls: allReferenceImages,
        characterName: name,
        characterId: character.id,
        appearanceId: appearance.id,
        count,
        isBackgroundJob: true,
        artStyle: resolvedArtStyle,
        customDescription: customDescription || undefined,  // 🔥 localized text（localized text）
        locale: taskLocale || undefined,
        meta: {
          ...bodyMeta,
          locale: taskLocale || bodyMeta.locale || undefined,
        },
      })
    }).catch(err => {
      _ulogError('[Character API] localized text:', err)
    })
  }

  // localized text
  const characterWithAppearances = await prisma.novelPromotionCharacter.findUnique({
    where: { id: character.id },
    include: { appearances: true }
  })

  return NextResponse.json({ success: true, character: characterWithAppearances })
})
