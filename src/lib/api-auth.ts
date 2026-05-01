/**
 * 🔐 API localized text
 * localized text Session localized text、localized text
 */

import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { headers as readHeaders } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withPrismaRetry } from '@/lib/prisma-retry'
import { extractModelKey } from '@/lib/config-service'
import { getErrorSpec, type UnifiedErrorCode } from '@/lib/errors/codes'
import { getLogContext, setLogContext } from '@/lib/logging/context'

// ============================================================
// localized text
// ============================================================

export interface AuthSession {
    user: {
        id: string
        name?: string | null
        email?: string | null
    }
}

function bindAuthLogContext(session: AuthSession, projectId?: string) {
    const context = getLogContext()
    if (!context.requestId) return
    setLogContext({
        userId: session.user.id,
        ...(projectId ? { projectId } : {}),
    })
}

async function getInternalTaskSession(): Promise<AuthSession | null> {
    const expectedToken = process.env.INTERNAL_TASK_TOKEN || ''

    const incomingHeaders = await readHeaders()
    const token = incomingHeaders.get('x-internal-task-token') || ''
    const userId = incomingHeaders.get('x-internal-user-id') || ''
    if (!userId) return null
    if (expectedToken) {
        if (token !== expectedToken) return null
    } else if (process.env.NODE_ENV === 'production') {
        return null
    }

    return {
        user: {
            id: userId,
            name: 'internal-worker',
            email: null,
        }
    }
}

/**
 * localized text
 */
export type ProjectAuthIncludes = {
    characters?: boolean
    locations?: boolean
    episodes?: boolean
}

interface AuthCharacterLike {
    name: string
    introduction?: string | null
    [key: string]: unknown
}

interface AuthLocationLike {
    name: string
    [key: string]: unknown
}

interface AuthEpisodeLike {
    id: string
    [key: string]: unknown
}

/**
 * localized text novelData localized text
 */
export interface NovelDataBase {
    id: string
    [key: string]: unknown
}

/**
 * localized text include localized text novelData localized text
 */
export type NovelDataWithIncludes<T extends ProjectAuthIncludes> = NovelDataBase
    & (T['characters'] extends true ? { characters: AuthCharacterLike[] } : Record<string, never>)
    & (T['locations'] extends true ? { locations: AuthLocationLike[] } : Record<string, never>)
    & (T['episodes'] extends true ? { episodes: AuthEpisodeLike[] } : Record<string, never>)

/**
 * localized text（localized text）
 */
export interface ProjectAuthContextWithIncludes<T extends ProjectAuthIncludes = ProjectAuthIncludes> {
    session: AuthSession
    project: {
        id: string
        userId: string
        name: string
        [key: string]: unknown
    }
    novelData: NovelDataWithIncludes<T>
}

/**
 * localized text
 */
export type ProjectAuthContext = ProjectAuthContextWithIncludes<ProjectAuthIncludes>

// ============================================================
// localized text
// ============================================================

function buildErrorResponse(code: UnifiedErrorCode, message?: string, details: Record<string, unknown> = {}) {
    const spec = getErrorSpec(code)
    const finalMessage = message?.trim() || spec.defaultMessage
    return NextResponse.json(
        {
            success: false,
            error: {
                code,
                message: finalMessage,
                retryable: spec.retryable,
                category: spec.category,
                userMessageKey: spec.userMessageKey,
                details,
            },
            code,
            message: finalMessage,
            ...details,
        },
        { status: spec.httpStatus },
    )
}

export function unauthorized(message = 'Unauthorized') {
    return buildErrorResponse('UNAUTHORIZED', message)
}

export function forbidden(message = 'Forbidden') {
    return buildErrorResponse('FORBIDDEN', message)
}

export function notFound(resource = 'Resource') {
    return buildErrorResponse('NOT_FOUND', `${resource} not found`)
}

export function badRequest(message: string) {
    return buildErrorResponse('INVALID_PARAMS', message)
}

export function serverError(message = 'Internal server error') {
    return buildErrorResponse('INTERNAL_ERROR', message)
}

// ============================================================
// localized text
// ============================================================

/**
 * localized text Session
 * @returns session localized text null
 */
export async function getAuthSession(): Promise<AuthSession | null> {
    const internalSession = await getInternalTaskSession()
    if (internalSession) return internalSession
    const session = await getServerSession(authOptions)
    return session as AuthSession | null
}

/**
 * localized text
 * @throws back 401 localized text
 */
export async function requireAuth(): Promise<AuthSession> {
    const session = await getAuthSession()
    if (!session?.user?.id) {
        throw { response: unauthorized() }
    }
    bindAuthLogContext(session)
    return session
}

/**
 * localized text
 * contains：Session localized text + localized text + localized text + NovelPromotionData check
 * 
 * @param projectId Project ID
 * @param options localized text，localized text
 * @returns localized text（session, project, novelData）
 * @throws localized text
 * 
 * @example
 * ```typescript
 * // localized text（localized text）
 * const authResult = await requireProjectAuth(projectId)
 * 
 * // localized text characters localized text locations
 * const authResult = await requireProjectAuth(projectId, {
 *   include: { characters: true, locations: true }
 * })
 * // authResult.novelData.characters localized text locations localized text
 * ```
 */
export async function requireProjectAuth<T extends ProjectAuthIncludes = ProjectAuthIncludes>(
    projectId: string,
    options?: { include?: T }
): Promise<ProjectAuthContextWithIncludes<T> | NextResponse> {
    // 1. localized text Session
    const session = await getAuthSession()
    if (!session?.user?.id) {
        return unauthorized()
    }
    bindAuthLogContext(session, projectId)

    // 2. localized text include localized text
    const novelPromotionIncludes: Record<string, boolean> = {}
    if (options?.include?.characters) {
        novelPromotionIncludes.characters = true
    }
    if (options?.include?.locations) {
        novelPromotionIncludes.locations = true
    }
    if (options?.include?.episodes) {
        novelPromotionIncludes.episodes = true
    }

    // 3. localized text（contains novelPromotionData localized text）
    const hasIncludes = Object.keys(novelPromotionIncludes).length > 0
    const project = await withPrismaRetry(() =>
        prisma.project.findUnique({
            where: { id: projectId },
            include: {
                novelPromotionData: hasIncludes
                    ? { include: novelPromotionIncludes }
                    : true
            }
        })
    )

    // 4. localized text
    if (!project) {
        return notFound('Project')
    }

    // 5. localized text
    if (project.userId !== session.user.id) {
        return forbidden()
    }

    // 6. NovelPromotionData check
    if (!project.novelPromotionData) {
        return notFound('Novel promotion data')
    }

    // localized text modelKey（provider::modelId），localized text modelId
    const rawNovelData = project.novelPromotionData as {
        analysisModel?: string | null
        characterModel?: string | null
        locationModel?: string | null
        storyboardModel?: string | null
        editModel?: string | null
        videoModel?: string | null
        audioModel?: string | null
        [key: string]: unknown
    }
    const processedNovelData = {
        ...rawNovelData,
        analysisModel: extractModelKey(rawNovelData.analysisModel),
        characterModel: extractModelKey(rawNovelData.characterModel),
        locationModel: extractModelKey(rawNovelData.locationModel),
        storyboardModel: extractModelKey(rawNovelData.storyboardModel),
        editModel: extractModelKey(rawNovelData.editModel),
        videoModel: extractModelKey(rawNovelData.videoModel),
        audioModel: extractModelKey(rawNovelData.audioModel),
    }

    return {
        session,
        project,
        novelData: processedNovelData as unknown as NovelDataWithIncludes<T>
    }
}

/**
 * localized text Session，localized text
 * localized text API（localized text）
 * 
 * @example
 * ```typescript
 * const authResult = await requireUserAuth()
 * if (authResult instanceof NextResponse) return authResult
 * 
 * const { session } = authResult
 * ```
 */
export async function requireUserAuth(): Promise<{ session: AuthSession } | NextResponse> {
    const session = await getAuthSession()
    if (!session?.user?.id) {
        return unauthorized()
    }
    bindAuthLogContext(session)
    return { session }
}

/**
 * localized text（localized text NovelPromotionData）
 * localized text novelPromotionData localized text API
 */
export async function requireProjectAuthLight(
    projectId: string
): Promise<{ session: AuthSession; project: { id: string; userId: string; name: string; [key: string]: unknown } } | NextResponse> {
    const session = await getAuthSession()
    if (!session?.user?.id) {
        return unauthorized()
    }
    bindAuthLogContext(session, projectId)

    const project = await withPrismaRetry(() =>
        prisma.project.findUnique({
            where: { id: projectId }
        })
    )

    if (!project) {
        return notFound('Project')
    }

    if (project.userId !== session.user.id) {
        return forbidden()
    }

    return { session, project }
}

// ============================================================
// localized text
// ============================================================

/**
 * localized text
 */
export function isErrorResponse(result: unknown): result is NextResponse {
    return result instanceof NextResponse
}
