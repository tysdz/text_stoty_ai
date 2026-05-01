/**
 * MinIO localized text
 * localized text: npx tsx scripts/test-minio.ts
 */
import { config } from 'dotenv'
config() // localized text .env localized text

import { getStorageProvider, uploadObject, getSignedObjectUrl, getObjectBuffer, deleteObject } from '../src/lib/storage'
import { randomUUID } from 'crypto'

async function testMinio() {
  console.log('🧪 localized text MinIO localized text...\n')

  // 1. localized text
  console.log('1️⃣ localized text:')
  const requiredEnv = [
    'STORAGE_TYPE',
    'MINIO_ENDPOINT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'MINIO_BUCKET',
  ]
  for (const key of requiredEnv) {
    const value = process.env[key]
    if (value) {
      // localized text
      const displayValue = key.includes('SECRET') || key.includes('KEY') && key !== 'STORAGE_TYPE'
        ? '*'.repeat(Math.min(value.length, 8))
        : value
      console.log(`  ✅ ${key}=${displayValue}`)
    } else {
      console.log(`  ❌ ${key}=localized text`)
    }
  }

  // 2. localized text Provider
  console.log('\n2️⃣ localized text Provider:')
  try {
    const provider = getStorageProvider()
    console.log(`  ✅ Provider localized text: ${provider.kind}`)
  } catch (error) {
    console.log(`  ❌ localized text:`, error)
    process.exit(1)
  }

  // 3. localized text
  console.log('\n3️⃣ localized text:')
  const testKey = `test/${randomUUID()}.txt`
  const testContent = `Hello MinIO! localized text: ${new Date().toISOString()}`
  let uploadedKey: string

  try {
    uploadedKey = await uploadObject(Buffer.from(testContent), testKey)
    console.log(`  ✅ localized text: ${uploadedKey}`)
  } catch (error) {
    console.log(`  ❌ localized text:`, error)
    process.exit(1)
  }

  // 4. localized text URL
  console.log('\n4️⃣ localized text URL:')
  let signedUrl: string
  try {
    signedUrl = await getSignedObjectUrl(uploadedKey, 300)
    console.log(`  ✅ localized text URL localized text`)
    console.log(`     URL: ${signedUrl.substring(0, 100)}...`)
  } catch (error) {
    console.log(`  ❌ localized text URL localized text:`, error)
    process.exit(1)
  }

  // 5. localized text
  console.log('\n5️⃣ localized text:')
  try {
    const buffer = await getObjectBuffer(uploadedKey)
    const content = buffer.toString()
    if (content === testContent) {
      console.log(`  ✅ localized text，localized text`)
    } else {
      console.log(`  ❌ localized text，localized text`)
      console.log(`     localized text: ${testContent}`)
      console.log(`     localized text: ${content}`)
    }
  } catch (error) {
    console.log(`  ❌ localized text:`, error)
    process.exit(1)
  }

  // 6. localized text HTTP localized text URL
  console.log('\n6️⃣ localized text HTTP localized text URL:')
  try {
    const response = await fetch(signedUrl)
    if (response.ok) {
      const content = await response.text()
      if (content === testContent) {
        console.log(`  ✅ HTTP localized text，localized text`)
      } else {
        console.log(`  ❌ HTTP localized text，localized text`)
      }
    } else {
      console.log(`  ❌ HTTP localized text: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`  ❌ HTTP localized text:`, error)
  }

  // 7. localized text
  console.log('\n7️⃣ localized text:')
  try {
    await deleteObject(uploadedKey)
    console.log(`  ✅ localized text`)
  } catch (error) {
    console.log(`  ❌ localized text:`, error)
  }

  console.log('\n✨ localized text!')
}

testMinio().catch(console.error)
