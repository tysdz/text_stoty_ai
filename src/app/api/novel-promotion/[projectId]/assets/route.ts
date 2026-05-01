import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireProjectAuthLight, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { attachMediaFieldsToProject } from '@/lib/media/attach'

function readAssetKind(value: Record<string, unknown>): string {
    return typeof value.assetKind === 'string' ? value.assetKind : 'location'
}

/**
 * GET - localized text（Character + Location）
 * 🔥 V6.5: localized text useProjectAssets hook localized text
 */
export const GET = apiHandler(async (
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await context.params

    // 🔐 localized text
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult

    // localized text
    const novelData = await prisma.novelPromotionProject.findUnique({
        where: { projectId },
        include: {
            characters: {
                include: {
                    appearances: {
                        orderBy: { appearanceIndex: 'asc' }
                    }
                },
                orderBy: { createdAt: 'asc' }
            },
            locations: {
                include: {
                    images: {
                        orderBy: { imageIndex: 'asc' }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!novelData) {
        return NextResponse.json({ characters: [], locations: [], props: [] })
    }

    // localized text URL（localized text）
    const withSignedUrls = await attachMediaFieldsToProject(novelData)
    const locations = (withSignedUrls.locations || []).filter((item) => readAssetKind(item) !== 'prop')
    const props = (withSignedUrls.locations || []).filter((item) => readAssetKind(item) === 'prop')

    return NextResponse.json({
        characters: withSignedUrls.characters || [],
        locations,
        props,
    })
})
