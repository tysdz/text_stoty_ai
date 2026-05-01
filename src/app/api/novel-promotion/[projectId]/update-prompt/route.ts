import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'

export const POST = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params

  // 🔐 localized text
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult

  const { shotId, field, value } = await request.json()

  // localized text
  if (field !== 'imagePrompt' && field !== 'videoPrompt') {
    throw new ApiError('INVALID_PARAMS')
  }

  // updateshot
  const updatedShot = await prisma.novelPromotionShot.update({
    where: { id: shotId },
    data: { [field]: value }
  })

  return NextResponse.json({ success: true, shot: updatedShot })
})
