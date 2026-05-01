/**
 * localized text URL localized text
 * localized text
 * localized text: npx tsx scripts/test-image-url-flow.ts
 */
import { config } from 'dotenv'
config()

import { uploadObject, getSignedUrl, extractStorageKey, toFetchableUrl } from '../src/lib/storage'
import { keyToSignedUrl, addSignedUrlToLocation } from '../src/lib/storage'
import { encodeImageUrls, decodeImageUrlsFromDb } from '../src/lib/contracts/image-urls-contract'
import { randomUUID } from 'crypto'

async function testImageUrlFlow() {
  console.log('🧪 localized text URL localized text...\n')

  // 1. localized text
  console.log('1️⃣ localized text:')
  const testKey = `images/location-${randomUUID()}.jpg`
  const testImageContent = Buffer.from('fake-image-data')

  let storedKey: string
  try {
    storedKey = await uploadObject(testImageContent, testKey)
    console.log(`  ✅ localized text，back key: ${storedKey}`)
  } catch (error) {
    console.log(`  ❌ localized text:`, error)
    process.exit(1)
  }

  // 2. localized text（encodeImageUrls）
  console.log('\n2️⃣ localized text（encodeImageUrls）:')
  const imageUrlsArray = [storedKey]
  const dbValue = encodeImageUrls(imageUrlsArray)
  console.log(`  ✅ localized text: ${dbValue}`)

  // 3. localized text（decodeImageUrlsFromDb）
  console.log('\n3️⃣ localized text（decodeImageUrlsFromDb）:')
  const decodedKeys = decodeImageUrlsFromDb(dbValue)
  console.log(`  ✅ localized text keys: ${JSON.stringify(decodedKeys)}`)

  // 4. test keyToSignedUrl（localized text API localized text）
  console.log('\n4️⃣ test keyToSignedUrl（API localized text）:')
  for (const key of decodedKeys) {
    const signedUrl = keyToSignedUrl(key)
    console.log(`  Key: ${key}`)
    console.log(`  → Signed URL: ${signedUrl}`)

    // localized text /api/storage/sign localized text
    if (signedUrl?.startsWith('/api/storage/sign')) {
      console.log(`  ✅ localized text URL localized text`)
    } else if (signedUrl?.startsWith('http')) {
      console.log(`  ⚠️ localized text HTTP URL，localized text`)
    } else {
      console.log(`  ⚠️ URL localized text: ${signedUrl}`)
    }
  }

  // 5. test addSignedUrlToLocation（localized text）
  console.log('\n5️⃣ test addSignedUrlToLocation（localized text）:')
  const mockLocationFromDb = {
    id: 'loc-123',
    name: 'localized text',
    images: [
      {
        id: 'img-1',
        imageUrl: storedKey,
        imageIndex: 0,
      }
    ]
  }

  const locationWithSignedUrls = addSignedUrlToLocation(mockLocationFromDb)
  console.log(`  localized text location.images:`)
  for (const img of locationWithSignedUrls.images || []) {
    console.log(`    - imageIndex: ${img.imageIndex}`)
    console.log(`    - imageUrl: ${img.imageUrl}`)

    if (img.imageUrl?.startsWith('/api/storage/sign')) {
      console.log(`    ✅ localized text: localized text URL`)
    } else if (img.imageUrl?.startsWith('http://127.0.0.1:19000')) {
      console.log(`    ❌ error: localized text MinIO localized text，localized text`)
    } else if (img.imageUrl?.startsWith('http')) {
      console.log(`    ⚠️ localized text HTTP URL`)
    } else {
      console.log(`    ⚠️ localized text: ${img.imageUrl}`)
    }
  }

  // 6. test getSignedUrl localized text
  console.log('\n6️⃣ test getSignedUrl localized text:')
  const directSignedUrl = getSignedUrl(storedKey)
  console.log(`  Key: ${storedKey}`)
  console.log(`  → URL: ${directSignedUrl}`)

  // 7. test extractStorageKey
  console.log('\n7️⃣ test extractStorageKey（localized text URL localized text key）:')
  const testUrls = [
    storedKey,
    `http://127.0.0.1:19000/text_stoty_ai/${storedKey}`,
    directSignedUrl,
  ]
  for (const url of testUrls) {
    const extracted = extractStorageKey(url)
    console.log(`  ${url.substring(0, 60)}...`)
    console.log(`    → extracted: ${extracted}`)
  }

  // 8. localized text
  console.log('\n8️⃣ localized text:')
  try {
    const { deleteObject } = await import('../src/lib/storage')
    await deleteObject(storedKey)
    console.log(`  ✅ localized text`)
  } catch (error) {
    console.log(`  ⚠️ localized text（localized text）:`, error)
  }

  console.log('\n✨ localized text!')
  console.log('\n📋 localized text:')
  console.log('  localized text4、5localized text /api/storage/sign?key=... localized text → ✅ localized text')
  console.log('  localized text4、5localized text http://127.0.0.1:19000/... localized text → ❌ localized text')
}

testImageUrlFlow().catch(console.error)
