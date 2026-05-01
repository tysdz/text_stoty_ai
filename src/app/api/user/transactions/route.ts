import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BILLING_CURRENCY } from '@/lib/billing/currency'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import type { Prisma } from '@prisma/client'
import { toMoneyNumber } from '@/lib/billing/money'

// action key localized text：localized text、localized text、localized text
const ACTION_KEY_PATTERN = /^[a-z][a-z0-9_]*$/

/**
 * localized text BalanceTransaction.description localized text action key
 * localized text：
 *   "[SHADOW] modify_asset_image - gemini-compatible:... - ¥0.96"
 *   "modify_asset_image - gemini-compatible:... - ¥0.96"
 * back action key（localized text "modify_asset_image"），localized text null
 */
function extractActionFromDescription(description: string | null): string | null {
    if (!description) return null
    const cleaned = description.replace(/^\[SHADOW\]\s*/i, '').trim()
    const firstPart = cleaned.split(' - ')[0].trim()
    if (ACTION_KEY_PATTERN.test(firstPart)) return firstPart
    return null
}

/**
 * GET /api/user/transactions
 * localized text
 */
export const GET = apiHandler(async (request: NextRequest) => {
    // 🔐 localized text
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const type = searchParams.get('type') // recharge | consume | all
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Prisma.BalanceTransactionWhereInput = { userId: session.user.id }
    if (type && type !== 'all') {
        where.type = type
    }

    // localized text
    if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) {
            where.createdAt.gte = new Date(startDate)
        }
        if (endDate) {
            // localized text
            const endDateTime = new Date(endDate)
            endDateTime.setHours(23, 59, 59, 999)
            where.createdAt.lte = endDateTime
        }
    }

    // localized text
    const [transactionsRaw, total] = await Promise.all([
        prisma.balanceTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        }),
        prisma.balanceTransaction.count({ where })
    ])

    // localized text（localized text N+1）
    const projectIds = [...new Set(transactionsRaw.map((t) => t.projectId).filter(Boolean) as string[])]
    const episodeIds = [...new Set(transactionsRaw.map((t) => t.episodeId).filter(Boolean) as string[])]

    const [projects, episodes] = await Promise.all([
        projectIds.length > 0
            ? prisma.project.findMany({
                where: { id: { in: projectIds } },
                select: { id: true, name: true },
            })
            : Promise.resolve([]),
        episodeIds.length > 0
            ? prisma.novelPromotionEpisode.findMany({
                where: { id: { in: episodeIds } },
                select: { id: true, episodeNumber: true, name: true },
            })
            : Promise.resolve([]),
    ])

    const projectMap = new Map(projects.map((p) => [p.id, p.name]))
    const episodeMap = new Map(episodes.map((e) => [e.id, { episodeNumber: e.episodeNumber, name: e.name }]))

    const transactions = transactionsRaw.map((item) => {
        // localized text billingMeta JSON
        let billingMeta: Record<string, unknown> | null = null
        if (item.billingMeta && typeof item.billingMeta === 'string') {
            try {
                billingMeta = JSON.parse(item.billingMeta) as Record<string, unknown>
            } catch { /* ignore */ }
        }

        return {
            ...item,
            amount: toMoneyNumber(item.amount),
            balanceAfter: toMoneyNumber(item.balanceAfter),
            // localized text taskType，localized text description localized text，localized text i18n localized text
            action: item.taskType ?? extractActionFromDescription(item.description),
            // localized text（localized text projectId localized text，localized text null）
            projectName: item.projectId ? (projectMap.get(item.projectId) ?? null) : null,
            // localized text（localized text episodeId localized text）
            episodeNumber: item.episodeId ? (episodeMap.get(item.episodeId)?.episodeNumber ?? null) : null,
            episodeName: item.episodeId ? (episodeMap.get(item.episodeId)?.name ?? null) : null,
            // localized text
            billingMeta,
        }
    })

    return NextResponse.json({
        currency: BILLING_CURRENCY,
        transactions,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    })
})
