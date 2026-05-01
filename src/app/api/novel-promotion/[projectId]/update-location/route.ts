import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { removeLocationPromptSuffix } from '@/lib/constants'
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

  const body = await request.json()
  const { locationId, imageIndex = 0, newDescription } = body

  if (!locationId || !newDescription) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text（localized text，localized text）
  const cleanDescription = removeLocationPromptSuffix(newDescription.trim())

  // update LocationImage localized text
  const locationImage = await prisma.locationImage.findFirst({
    where: { locationId, imageIndex }
  })

  if (!locationImage) {
    throw new ApiError('NOT_FOUND')
  }

  await prisma.locationImage.update({
    where: { id: locationImage.id },
    data: { description: cleanDescription }
  })

  return NextResponse.json({ success: true })
})
