import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler, ApiError } from '@/lib/api-errors'
import { toMoneyNumber } from '@/lib/billing/money'
import { isArtStyleValue } from '@/lib/constants'

// GET - localized text（localized text）
export const GET = apiHandler(async (request: NextRequest) => {
  // 🔐 localized text
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // localized text
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)
  const search = searchParams.get('search') || ''

  // localized text
  const where: Record<string, unknown> = { userId: session.user.id }

  // localized text，localized text
  // localized text：SQLite localized text mode: 'insensitive'，localized text SQLite localized text LIKE localized text（ASCII localized text）
  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim() } },
      { description: { contains: search.trim() } }
    ]
  }

  // ⚡ localized text：localized text + localized text
  // localized text：localized text（localized text） > localized text
  const [total, allProjects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },  // localized text
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  // localized text：
  // 1. localized text（none lastAccessedAt）localized text
  // 2. localized text
  const projects = [...allProjects].sort((a, b) => {
    // localized text，localized text（localized text）
    if (!a.lastAccessedAt && !b.lastAccessedAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    // localized text a localized text（localized text），a localized text
    if (!a.lastAccessedAt && b.lastAccessedAt) return -1
    // localized text b localized text（localized text），b localized text
    if (a.lastAccessedAt && !b.lastAccessedAt) return 1
    // localized text，localized text
    return new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime()
  })

  // localized text ID localized text
  const projectIds = projects.map(p => p.id)

  // ⚡ localized text：localized text + localized text（localized text、localized text、localized text）
  const [costsByProject, novelProjects] = await Promise.all([
    // localized text（localized text N+1 localized text）
    prisma.usageCost.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds } },
      _sum: { cost: true }
    }),
    // localized text
    prisma.novelPromotionProject.findMany({
      where: { projectId: { in: projectIds } },
      select: {
        projectId: true,
        _count: {
          select: {
            episodes: true,
            characters: true,
            locations: true
          }
        },
        episodes: {
          orderBy: { episodeNumber: 'asc' },
          select: {
            episodeNumber: true,
            novelText: true,
            storyboards: {
              select: {
                _count: {
                  select: { panels: true }
                },
                panels: {
                  where: {
                    OR: [
                      { imageUrl: { not: null } },
                      { videoUrl: { not: null } },
                    ]
                  },
                  select: {
                    imageUrl: true,
                    videoUrl: true
                  }
                }
              }
            }
          }
        }
      }
    })
  ])

  // localized text
  const costMap = new Map(
    costsByProject.map(item => [item.projectId, toMoneyNumber(item._sum.cost)])
  )

  // localized text + localized text
  const statsMap = new Map<string, { episodes: number; images: number; videos: number; panels: number; firstEpisodePreview: string | null }>(
    novelProjects.map(np => {
      let imageCount = 0
      let videoCount = 0
      let panelCount = 0
      for (const ep of np.episodes) {
        for (const sb of ep.storyboards) {
          panelCount += sb._count.panels
          for (const panel of sb.panels) {
            if (panel.imageUrl) imageCount++
            if (panel.videoUrl) videoCount++
          }
        }
      }
      // localized text novelText localized text 100 localized text
      const firstEp = np.episodes[0]
      const preview = firstEp?.novelText ? firstEp.novelText.slice(0, 100) : null
      return [np.projectId, {
        episodes: np._count.episodes,
        images: imageCount,
        videos: videoCount,
        panels: panelCount,
        firstEpisodePreview: preview
      }]
    })
  )

  // localized text、localized text
  const projectsWithStats = projects.map(project => ({
    ...project,
    totalCost: costMap.get(project.id) ?? 0,
    stats: statsMap.get(project.id) ?? { episodes: 0, images: 0, videos: 0, panels: 0, firstEpisodePreview: null }
  }))

  return NextResponse.json({
    projects: projectsWithStats,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  })
})

// POST - localized text
export const POST = apiHandler(async (request: NextRequest) => {
  // 🔐 localized text
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const { name, description } = await request.json()

  if (!name || name.trim().length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (name.length > 100) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (description && description.length > 500) {
    throw new ApiError('INVALID_PARAMS')
  }

  // localized text
  const userPreference = await prisma.userPreference.findUnique({
    where: { userId: session.user.id }
  })

  // localized text（mode localized text novel-promotion）
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      mode: 'novel-promotion',
      userId: session.user.id
    }
  })

  // localized text novel-promotion localized text，localized text
  // localized text：localized text，localized text：
  // - localized text → localized text
  // - localized text → AI localized text
  // 🔥 artStylePrompt localized text，localized text
  await prisma.novelPromotionProject.create({
    data: {
      projectId: project.id,
      ...(userPreference && {
        analysisModel: userPreference.analysisModel,
        characterModel: userPreference.characterModel,
        locationModel: userPreference.locationModel,
        storyboardModel: userPreference.storyboardModel,
        editModel: userPreference.editModel,
        videoModel: userPreference.videoModel,
        audioModel: userPreference.audioModel,
        videoRatio: userPreference.videoRatio,
        artStyle: isArtStyleValue(userPreference.artStyle) ? userPreference.artStyle : 'american-comic',
        ttsRate: userPreference.ttsRate
      })
    }
  })

  return NextResponse.json({ project }, { status: 201 })
})
