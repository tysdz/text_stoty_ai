/**
 * test /api/storage/sign localized text
 * localized text: npx tsx scripts/test-sign-api.ts
 */
import { config } from 'dotenv'
config()

import { uploadObject, getSignedObjectUrl } from '../src/lib/storage'
import { randomUUID } from 'crypto'
import http from 'http'

async function testSignApi() {
  console.log('🧪 test /api/storage/sign API...\n')

  // 1. localized text
  console.log('1️⃣ localized text:')
  const testKey = `images/test-${randomUUID()}.txt`
  const testContent = 'Hello from MinIO test!'
  
  await uploadObject(Buffer.from(testContent), testKey)
  console.log(`  ✅ localized text: ${testKey}`)

  // 2. localized text URL（localized text）
  console.log('\n2️⃣ localized text URL:')
  const signedUrl = await getSignedObjectUrl(testKey, 300)
  console.log(`  URL: ${signedUrl}`)

  // 3. localized text URL
  console.log('\n3️⃣ localized text URL:')
  try {
    const response = await fetch(signedUrl)
    if (response.ok) {
      const content = await response.text()
      console.log(`  ✅ localized text，localized text: "${content}"`)
    } else {
      console.log(`  ❌ localized text: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`  ❌ localized text:`, error)
  }

  // 4. test /api/storage/sign localized text（localized text）
  console.log('\n4️⃣ test /api/storage/sign localized text（localized text）:')
  const signApiUrl = `http://localhost:3000/api/storage/sign?key=${encodeURIComponent(testKey)}&expires=300`
  console.log(`  URL: ${signApiUrl}`)
  
  try {
    const response = await fetch(signApiUrl, { redirect: 'manual' })
    console.log(`  localized text: ${response.status}`)
    console.log(`  Location: ${response.headers.get('location')}`)
    
    if (response.status === 307 || response.status === 302) {
      const redirectUrl = response.headers.get('location')
      console.log(`  ✅ localized text URL: ${redirectUrl?.substring(0, 80)}...`)
      
      // 5. localized text
      console.log('\n5️⃣ localized text:')
      const finalResponse = await fetch(signApiUrl, { redirect: 'follow' })
      if (finalResponse.ok) {
        const content = await finalResponse.text()
        console.log(`  ✅ localized text，localized text: "${content}"`)
      } else {
        console.log(`  ❌ localized text: ${finalResponse.status}`)
      }
    } else {
      const body = await response.text()
      console.log(`  localized text: ${body.substring(0, 200)}`)
    }
  } catch (error) {
    console.log(`  ❌ localized text（localized text）:`, error)
  }

  // 6. test /api/cos/image localized text（localized text）
  console.log('\n6️⃣ test /api/cos/image localized text（localized text）:')
  const cosApiUrl = `http://localhost:3000/api/cos/image?key=${encodeURIComponent(testKey)}&expires=300`
  console.log(`  URL: ${cosApiUrl}`)
  
  try {
    const response = await fetch(cosApiUrl, { redirect: 'manual' })
    console.log(`  localized text: ${response.status}`)
    console.log(`  Location: ${response.headers.get('location')}`)
  } catch (error) {
    console.log(`  ❌ localized text（localized text）:`, error)
  }

  // localized text
  console.log('\n7️⃣ localized text:')
  const { deleteObject } = await import('../src/lib/storage')
  await deleteObject(testKey)
  console.log(`  ✅ localized text`)

  console.log('\n✨ localized text!')
}

testSignApi().catch(console.error)
