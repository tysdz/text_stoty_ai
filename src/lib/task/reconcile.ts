/**
 * Task Reconciliation — DB ↔ BullMQ localized text
 *
 * localized text DB localized text BullMQ Job localized text。
 * localized text：
 *   1. isJobAlive   — localized text（localized text createTask localized text）
 *   2. reconcileActiveTasks — localized text（localized text watchdog localized text）
 *   3. startTaskWatchdog    — localized text（localized text instrumentation.ts localized text）
 */

import { prisma } from '@/lib/prisma'
import { createScopedLogger } from '@/lib/logging/core'
import { TASK_STATUS, TASK_EVENT_TYPE } from './types'
import { publishTaskEvent } from './publisher'
import { rollbackTaskBillingForTask } from './service'
import {
    imageQueue,
    videoQueue,
    voiceQueue,
    textQueue,
} from './queues'

// ────────────────────── localized text ──────────────────────

const ACTIVE_STATUSES = [TASK_STATUS.QUEUED, TASK_STATUS.PROCESSING]

/** watchdog localized text */
const WATCHDOG_INTERVAL_MS = 60_000

/** processing localized text */
const PROCESSING_TIMEOUT_MS = 5 * 60_000

/** localized text */
const RECONCILE_BATCH_SIZE = 200

/** terminal localized text，localized text worker localized text */
const TERMINAL_RECONCILE_GRACE_MS = 90_000

/** missing localized text，localized text createTask→enqueue localized text */
const MISSING_RECONCILE_GRACE_MS = 30_000

// ────────────────────── BullMQ Job localized text ──────────────────────

type JobState = 'alive' | 'terminal' | 'missing'

const ALL_QUEUES = [imageQueue, videoQueue, voiceQueue, textQueue]

/**
 * check BullMQ localized text Job localized text。
 * - alive:    Job localized text（waiting / active / delayed / waiting-children）
 * - terminal: Job localized text（completed / failed）
 * - missing:  Job localized text
 */
async function getJobState(taskId: string): Promise<JobState> {
    for (const queue of ALL_QUEUES) {
        try {
            const job = await queue.getJob(taskId)
            if (!job) continue
            const state = await job.getState()
            if (state === 'completed' || state === 'failed') {
                return 'terminal'
            }
            // waiting | active | delayed | waiting-children → localized text
            return 'alive'
        } catch {
            // localized text
            continue
        }
    }
    return 'missing'
}

/**
 * check BullMQ Job localized text。
 * localized text createTask localized text——localized text Job localized text，localized text active localized text。
 */
export async function isJobAlive(taskId: string): Promise<boolean> {
    const state = await getJobState(taskId)
    return state === 'alive'
}

// ────────────────────── localized text ──────────────────────

/**
 * localized text failed localized text SSE localized text。
 */
async function failOrphanedTask(
    task: {
        id: string
        userId: string
        projectId: string
        episodeId: string | null
        type: string
        targetType: string
        targetId: string
        billingInfo: unknown
    },
    reason: string,
): Promise<boolean> {
    const rollbackResult = await rollbackTaskBillingForTask({
        taskId: task.id,
        billingInfo: task.billingInfo,
    })
    const compensationFailed = rollbackResult.attempted && !rollbackResult.rolledBack
    const errorCode = compensationFailed ? 'BILLING_COMPENSATION_FAILED' : 'RECONCILE_ORPHAN'
    const errorMessage = compensationFailed
        ? `${reason}; billing rollback failed`
        : reason

    const result = await prisma.task.updateMany({
        where: {
            id: task.id,
            status: { in: ACTIVE_STATUSES },
        },
        data: {
            status: TASK_STATUS.FAILED,
            errorCode,
            errorMessage,
            finishedAt: new Date(),
            heartbeatAt: null,
            dedupeKey: null,
        },
    })

    if (result.count > 0) {
        // localized text FAILED localized text，localized text SSE update + localized text
        await publishTaskEvent({
            taskId: task.id,
            projectId: task.projectId,
            userId: task.userId,
            type: TASK_EVENT_TYPE.FAILED,
            taskType: task.type,
            targetType: task.targetType,
            targetId: task.targetId,
            episodeId: task.episodeId,
            payload: {
                stage: 'reconciled',
                stageLabel: 'localized text',
                message: errorMessage,
                compensationFailed,
            },
            persist: false,
        })
    }

    return result.count > 0
}

// ────────────────────── localized text ──────────────────────

/**
 * localized text DB localized text active localized text BullMQ localized text。
 * localized text DB localized text active localized text BullMQ localized text terminal / missing localized text failed。
 */
export async function reconcileActiveTasks(): Promise<string[]> {
    const now = Date.now()
    const activeTasks = await prisma.task.findMany({
        where: {
            status: { in: ACTIVE_STATUSES },
        },
        select: {
            id: true,
            userId: true,
            projectId: true,
            episodeId: true,
            type: true,
            targetType: true,
            targetId: true,
            billingInfo: true,
            updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
        take: RECONCILE_BATCH_SIZE,
    })

    if (activeTasks.length === 0) return []

    const reconciled: string[] = []
    for (const task of activeTasks) {
        const jobState = await getJobState(task.id)
        if (jobState === 'alive') continue
        if (
            jobState === 'terminal'
            && now - task.updatedAt.getTime() < TERMINAL_RECONCILE_GRACE_MS
        ) {
            continue
        }
        if (
            jobState === 'missing'
            && now - task.updatedAt.getTime() < MISSING_RECONCILE_GRACE_MS
        ) {
            continue
        }

        const reason =
            jobState === 'terminal'
                ? 'Queue job already terminated but DB was not updated'
                : 'Queue job missing (likely lost during restart)'

        const failed = await failOrphanedTask(task, reason)
        if (failed) {
            reconciled.push(task.id)
        }
    }

    return reconciled
}

// ────────────────────── Watchdog ──────────────────────

let watchdogTimer: ReturnType<typeof setInterval> | null = null

/**
 * localized text watchdog localized text。
 * localized text：
 *   1. sweepStaleTasks — localized text processing localized text → failed
 *   2. reconcileActiveTasks — DB active localized text BullMQ localized text → failed
 */
export function startTaskWatchdog() {
    if (watchdogTimer) return

    const logger = createScopedLogger({ module: 'task.watchdog' })
    logger.info({
        action: 'watchdog.start',
        message: `Task watchdog started (interval: ${WATCHDOG_INTERVAL_MS}ms)`,
    })

    watchdogTimer = setInterval(async () => {
        try {
            // 1. localized text processing localized text（localized text，localized text）
            const { sweepStaleTasks } = await import('./service')
            const sweptProcessing = await sweepStaleTasks({
                processingThresholdMs: PROCESSING_TIMEOUT_MS,
            })
            for (const task of sweptProcessing) {
                await publishTaskEvent({
                    taskId: task.id,
                    projectId: task.projectId,
                    userId: task.userId,
                    type: TASK_EVENT_TYPE.FAILED,
                    taskType: task.type,
                    targetType: task.targetType,
                    targetId: task.targetId,
                    episodeId: task.episodeId || null,
                    payload: {
                        stage: 'watchdog_timeout',
                        stageLabel: 'localized text',
                        message: task.errorMessage,
                        errorCode: task.errorCode,
                        compensationFailed: task.errorCode === 'BILLING_COMPENSATION_FAILED',
                    },
                    persist: false,
                })
            }

            // 2. localized text DB vs BullMQ
            const reconciled = await reconcileActiveTasks()

            const total = sweptProcessing.length + reconciled.length
            if (total > 0) {
                logger.info({
                    action: 'watchdog.cycle',
                    message: `Watchdog: ${sweptProcessing.length} heartbeat-timeout, ${reconciled.length} orphan-reconciled`,
                })
            }
        } catch (error) {
            logger.error({
                action: 'watchdog.error',
                message: 'Watchdog cycle failed',
                error:
                    error instanceof Error
                        ? { name: error.name, message: error.message, stack: error.stack }
                        : { message: String(error) },
            })
        }
    }, WATCHDOG_INTERVAL_MS)
}
