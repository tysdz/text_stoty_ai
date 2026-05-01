/**
 * localized text
 * localized text: npx tsx scripts/diagnose-project.ts <projectId>
 */
import { config } from 'dotenv'
config()

import { prisma } from '../src/lib/prisma'

async function diagnoseProject(projectId: string) {
  console.log(`🔍 localized text: ${projectId}\n`)

  // 1. localized text
  console.log('1️⃣ localized text:')
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      novelPromotionData: true
    }
  })
  
  if (!project) {
    console.log('  ❌ localized text')
    process.exit(1)
  }
  
  console.log(`  localized text: ${project.name}`)
  console.log(`  localized text: ${project.mode}`)
  console.log(`  localized textID: ${project.userId}`)

  // 2. check NovelPromotionProject
  console.log('\n2️⃣ localized text:')
  const novelData = project.novelPromotionData
  if (!novelData) {
    console.log('  ❌ novelPromotionData localized text')
  } else {
    console.log(`  ID: ${novelData.id}`)
    console.log(`  localized text: ${novelData.videoRatio || 'localized text'}`)
    console.log(`  localized text: ${novelData.artStylePrompt || 'localized text'}`)
  }

  // 3. localized text
  console.log('\n3️⃣ localized text:')
  const novelProjectId = novelData?.id
  if (!novelProjectId) {
    console.log('  ❌ localized text novelPromotionProject ID')
    process.exit(1)
  }
  
  const locations = await prisma.novelPromotionLocation.findMany({
    where: { novelPromotionProjectId: novelProjectId },
    include: {
      images: {
        orderBy: { imageIndex: 'asc' }
      }
    }
  })
  
  console.log(`  localized text: ${locations.length}`)
  
  for (const loc of locations) {
    console.log(`\n  📍 ${loc.name} (${loc.id})`)
    console.log(`     localized text: ${loc.images?.length || 0}`)
    
    for (const img of loc.images || []) {
      console.log(`     - [${img.imageIndex}] imageUrl: ${img.imageUrl || 'null'}`)
      console.log(`       isSelected: ${img.isSelected}`)
      console.log(`       description: ${img.description || 'null'}`)

      // check MediaObject
      if (img.imageUrl) {
        const media = await prisma.mediaObject.findFirst({
          where: { 
            OR: [
              { storageKey: img.imageUrl },
              { storageKey: { contains: img.imageUrl.split('/').pop() || '' } }
            ]
          }
        })
        if (media) {
          console.log(`       ✅ MediaObject: ${media.publicId}`)
        } else {
          console.log(`       ⚠️ localized text MediaObject`)
        }
      }
    }
  }

  // 4. localized text
  console.log('\n4️⃣ localized text:')
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  console.log(`  localized text: ${tasks.length}`)
  
  for (const task of tasks) {
    console.log(`\n  📝 ${task.type} (${task.id})`)
    console.log(`     localized text: ${task.status}`)
    console.log(`     localized text: ${task.targetType} / ${task.targetId}`)
    console.log(`     localized text: ${task.createdAt}`)
    console.log(`     localized text: ${task.updatedAt}`)

    if (task.errorMessage || task.errorCode) {
      console.log(`     ❌ localized text: ${task.errorCode || 'N/A'}`)
      console.log(`     ❌ localized text: ${task.errorMessage?.substring(0, 200) || 'N/A'}`)
    }

    // localized text
    const events = await prisma.taskEvent.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
    
    if (events.length > 0) {
      console.log(`     localized text:`)
      for (const event of events) {
        console.log(`       - ${event.eventType}: ${JSON.stringify(event.payload).substring(0, 100)}`)
      }
    }
  }

  // 5. check Worker localized text
  console.log('\n5️⃣ check Worker Config:')
  console.log(`  REDIS_HOST: ${process.env.REDIS_HOST || 'localized text'}`)
  console.log(`  REDIS_PORT: ${process.env.REDIS_PORT || 'localized text'}`)
  
  // localized text Redis
  try {
    const { Redis } = await import('ioredis')
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      connectTimeout: 5000
    })
    
    const pingResult = await redis.ping()
    console.log(`  ✅ Redis localized text: ${pingResult}`)
    
    // check BullMQ localized text
    const queueKeys = await redis.keys('bull:*:id')
    console.log(`  BullMQ localized text: ${queueKeys.length}`)
    
    for (const key of queueKeys.slice(0, 5)) {
      const queueName = key.replace('bull:', '').replace(':id', '')
      const jobCounts = await redis.hgetall(`bull:${queueName}:id`)
      console.log(`    - ${queueName}`)
    }
    
    redis.disconnect()
  } catch (error) {
    console.log(`  ❌ Redis localized text:`, error)
  }

  // 6. localized text
  console.log('\n6️⃣ localized text:')
  const userPreference = await prisma.userPreference.findUnique({
    where: { userId: project.userId }
  })

  if (!userPreference) {
    console.log('  ❌ localized text')
  } else {
    console.log(`  localized text: ${userPreference.characterModel || 'localized text'}`)
    console.log(`  localized text: ${userPreference.locationModel || 'localized text'}`)
    console.log(`  localized text: ${userPreference.videoModel || 'localized text'}`)
    console.log(`  localized text: ${userPreference.editModel || 'localized text'}`)
    console.log(`  localized text: ${userPreference.lipSyncModel || 'localized text'}`)
    console.log(`  localized text: ${userPreference.analysisModel || 'localized text'}`)
  }

  console.log('\n✨ localized text!')
  
  await prisma.$disconnect()
}

const projectId = process.argv[2]
if (!projectId) {
  console.log('localized text: npx tsx scripts/diagnose-project.ts <projectId>')
  console.log('localized text: npx tsx scripts/diagnose-project.ts fae709e9-9215-4b3f-9f53-dad871f09896')
  process.exit(1)
}

diagnoseProject(projectId).catch(console.error)
