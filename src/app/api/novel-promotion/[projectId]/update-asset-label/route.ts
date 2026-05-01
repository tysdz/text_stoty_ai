import { NextRequest, NextResponse } from 'next/server'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { updateAssetRenderLabel } from '@/lib/assets/services/asset-label'

/**
 * POST /api/novel-promotion/[projectId]/update-asset-label
 * localized text（localized text）
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
  const { type, id, newName, appearanceIndex } = body
  if (!type || !id || !newName) {
    throw new ApiError('INVALID_PARAMS')
  }

  void appearanceIndex

  if (type === 'character' || type === 'location') {
    await updateAssetRenderLabel({
      scope: 'project',
      kind: type,
      assetId: id,
      projectId,
      newName,
    })
    return NextResponse.json({ success: true })
  }

  throw new ApiError('INVALID_PARAMS')
})
