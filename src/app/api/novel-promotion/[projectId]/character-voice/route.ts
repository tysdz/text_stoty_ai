import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadObject, generateUniqueKey, getSignedUrl } from '@/lib/storage'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

/**
 * PATCH /api/novel-promotion/[projectId]/character-voice
 * localized text
 * Body: { characterId, voiceType, voiceId, customVoiceUrl }
 */
export const PATCH = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json()
  const { characterId, voiceType, voiceId, customVoiceUrl } = body

  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const character = await prisma.novelPromotionCharacter.update({
    where: { id: characterId },
    data: {
      voiceType: voiceType || null,
      voiceId: voiceId || null,
      customVoiceUrl: customVoiceUrl || null
    }
  })

  return NextResponse.json({ success: true, character })
})

/**
 * POST /api/novel-promotion/[projectId]/character-voice
 * localized text localized text save AI localized text
 * FormData: { characterId, file } - localized text
 * JSON: { characterId, voiceDesign: { voiceId, audioBase64 } } - AI localized text
 */
export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const contentType = request.headers.get('content-type') || ''

  // localized text JSON localized text（AI localized text）
  if (contentType.includes('application/json')) {
    const body = await request.json()
    const { characterId, voiceDesign } = body

    if (!characterId || !voiceDesign) {
      throw new ApiError('INVALID_PARAMS')
    }

    const { voiceId, audioBase64 } = voiceDesign
    if (!voiceId || !audioBase64) {
      throw new ApiError('INVALID_PARAMS')
    }

    // localized text base64 localized text
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    // localized textCOS
    const key = generateUniqueKey(`voice/custom/${projectId}/${characterId}`, 'wav')
    const cosUrl = await uploadObject(audioBuffer, key)

    // localized text
    const character = await prisma.novelPromotionCharacter.update({
      where: { id: characterId },
      data: {
        voiceType: 'qwen-designed',
        voiceId: voiceId,  // save AI localized text voice ID
        customVoiceUrl: cosUrl
      }
    })

    _ulogInfo(`Character ${characterId} AI-designed voice saved: ${cosUrl}, voiceId: ${voiceId}`)

    // localized textURL
    const signedAudioUrl = getSignedUrl(cosUrl, 7200)

    return NextResponse.json({
      success: true,
      audioUrl: signedAudioUrl,
      character: {
        ...character,
        customVoiceUrl: signedAudioUrl
      }
    })
  }

  // localized text FormData localized text（localized text）
  const formData = await request.formData()
  const file = formData.get('file') as File
  const characterId = formData.get('characterId') as string

  if (!file || !characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a']
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // localized text
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3'

  // localized textCOS
  const key = generateUniqueKey(`voice/custom/${projectId}/${characterId}`, ext)
  const audioUrl = await uploadObject(buffer, key)

  // localized text
  const character = await prisma.novelPromotionCharacter.update({
    where: { id: characterId },
    data: {
      voiceType: 'uploaded',
      voiceId: null,
      customVoiceUrl: audioUrl
    }
  })

  _ulogInfo(`Character ${characterId} voice uploaded: ${audioUrl}`)

  // localized textURL，localized text
  const signedAudioUrl = getSignedUrl(audioUrl, 7200)

  return NextResponse.json({
    success: true,
    audioUrl: signedAudioUrl,
    character: {
      ...character,
      customVoiceUrl: signedAudioUrl // localized textURLlocalized text
    }
  })
})
