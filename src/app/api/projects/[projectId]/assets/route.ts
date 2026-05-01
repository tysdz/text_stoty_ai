import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { attachMediaFieldsToProject } from '@/lib/media/attach'

function readAssetKind(value: Record<string, unknown>): string {
    return typeof value.assetKind === 'string' ? value.assetKind : 'location'
}

/**
 * ⚡ localized text API - localized text characters localized text locations localized text
 * localized text，localized text
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
        select: { userId: true }
    })

    if (!project) {
        throw new ApiError('NOT_FOUND')
    }

    if (project.userId !== session.user.id) {
        throw new ApiError('FORBIDDEN')
    }

    // localized text characters localized text locations（localized text）
    const novelPromotionData = await prisma.novelPromotionProject.findUnique({
        where: { projectId },
        include: {
            characters: {
                include: { appearances: { orderBy: { appearanceIndex: 'asc' } } },
                orderBy: { createdAt: 'asc' }
            },
            locations: {
                include: { images: { orderBy: { imageIndex: 'asc' } } },
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!novelPromotionData) {
        throw new ApiError('NOT_FOUND')
    }

    // localized text URL（localized text）
    const dataWithSignedUrls = await attachMediaFieldsToProject(novelPromotionData)

    const locations = (dataWithSignedUrls.locations || []).filter((item) => readAssetKind(item) !== 'prop')
    const props = (dataWithSignedUrls.locations || []).filter((item) => readAssetKind(item) === 'prop')

    return NextResponse.json({
        characters: dataWithSignedUrls.characters || [],
        locations,
        props,
    })
})
