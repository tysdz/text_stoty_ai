/**
 * localized text
 * localized text: npx tsx scripts/test-full-image-flow.ts
 */
import { config } from 'dotenv'
config()

import { uploadObject, getStorageProvider } from '../src/lib/storage'
import { extractStorageKeyFromLegacyValue, resolveMediaRefFromLegacyValue, getMediaObjectByPublicId } from '../src/lib/media/service'
import { attachMediaFieldsToProject } from '../src/lib/media/attach'
import { randomUUID } from 'crypto'

async function testFullImageFlow() {
  console.log('🧪 localized text...\n')

  const provider = getStorageProvider()
  console.log(`localized text: ${provider.kind}\n`)

  // 1. localized text
  console.log('1️⃣ localized text:')
  const testKey = `images/location-${randomUUID()}.jpg`
  const testImageContent = Buffer.from('fake-generated-image-data')
  
  const storedKey = await uploadObject(testImageContent, testKey)
  console.log(`  ✅ localized text，back key: ${storedKey}`)

  // 2. localized text（localized text key）
  console.log('\n2️⃣ localized text:')
  const mockDbLocation = {
    id: 'loc-test-123',
    name: 'localized text',
    images: [
      {
        id: 'img-1',
        imageUrl: storedKey,  // localized text key，localized text URL
        imageIndex: 0,
      }
    ]
  }
  console.log(`  localized text imageUrl: ${storedKey}`)

  // 3. test extractStorageKeyFromLegacyValue
  console.log('\n3️⃣ test extractStorageKeyFromLegacyValue:')
  const extractedKey = extractStorageKeyFromLegacyValue(storedKey)
  console.log(`  localized text: ${storedKey}`)
  console.log(`  localized text: ${extractedKey}`)
  if (extractedKey) {
    console.log(`  ✅ localized text storageKey`)
  } else {
    console.log(`  ❌ localized text storageKey - localized text！`)
  }

  // 4. test resolveMediaRefFromLegacyValue（localized text MediaObject）
  console.log('\n4️⃣ test resolveMediaRefFromLegacyValue:')
  try {
    const mediaRef = await resolveMediaRefFromLegacyValue(storedKey)
    if (mediaRef) {
      console.log(`  ✅ MediaObject localized text/localized text`)
      console.log(`     id: ${mediaRef.id}`)
      console.log(`     publicId: ${mediaRef.publicId}`)
      console.log(`     url: ${mediaRef.url}`)
      console.log(`     storageKey: ${mediaRef.storageKey}`)
    } else {
      console.log(`  ❌ MediaRef localized text null`)
    }
  } catch (error) {
    console.log(`  ❌ failed:`, error)
  }

  // 5. test attachMediaFieldsToProject（localized text）
  console.log('\n5️⃣ test attachMediaFieldsToProject（API localized text）:')
  try {
    const mockProject = {
      id: 'proj-test',
      locations: [mockDbLocation]
    }
    
    const result = await attachMediaFieldsToProject(mockProject)
    const location = result.locations?.[0]
    const image = location?.images?.[0]
    
    console.log(`  localized text imageUrl: ${image?.imageUrl}`)
    
    if (image?.imageUrl?.startsWith('/m/')) {
      console.log(`  ✅ localized text /m/ localized text URL`)
      
      // localized text publicId
      const publicId = image.imageUrl.replace('/m/', '').split('?')[0]
      console.log(`  publicId: ${publicId}`)
      
      // localized text MediaObject localized text
      const media = await getMediaObjectByPublicId(publicId)
      if (media) {
        console.log(`  ✅ MediaObject localized text，storageKey: ${media.storageKey}`)
      } else {
        console.log(`  ❌ MediaObject localized text！`)
      }
    } else if (image?.imageUrl?.startsWith('http')) {
      console.log(`  ⚠️ localized text HTTP URL: ${image.imageUrl}`)
    } else if (!image?.imageUrl) {
      console.log(`  ❌ imageUrl localized text！`)
    } else {
      console.log(`  ⚠️ URL localized text: ${image.imageUrl}`)
    }
  } catch (error) {
    console.log(`  ❌ failed:`, error)
  }

  // 6. localized text /m/ URL
  console.log('\n6️⃣ localized text /m/ URL:')
  try {
    const mockProject = {
      id: 'proj-test',
      locations: [mockDbLocation]
    }
    
    const result = await attachMediaFieldsToProject(mockProject)
    const imageUrl = result.locations?.[0]?.images?.[0]?.imageUrl
    
    if (imageUrl?.startsWith('/m/')) {
      const fullUrl = `http://localhost:3000${imageUrl}`
      console.log(`  localized text: ${fullUrl}`)
      
      try {
        const response = await fetch(fullUrl, { redirect: 'manual' })
        console.log(`  localized text: ${response.status}`)
        
        if (response.status === 200) {
          console.log(`  ✅ /m/ localized text`)
        } else if (response.status === 307 || response.status === 302) {
          console.log(`  ✅ /m/ localized text（localized text）`)
          console.log(`  Location: ${response.headers.get('location')?.substring(0, 80)}...`)
        } else if (response.status === 404) {
          console.log(`  ❌ MediaObject localized text（404）`)
        } else {
          console.log(`  ⚠️ localized text: ${response.status}`)
        }
      } catch (error) {
        console.log(`  ⚠️ localized text（localized text）:`, error)
      }
    } else {
      console.log(`  localized text（URL localized text）`)
    }
  } catch (error) {
    console.log(`  localized text:`, error)
  }

  // localized text
  console.log('\n7️⃣ localized text:')
  try {
    const { deleteObject } = await import('../src/lib/storage')
    await deleteObject(storedKey)
    console.log(`  ✅ localized text`)
  } catch (error) {
    console.log(`  ⚠️ localized text:`, error)
  }

  console.log('\n✨ localized text!')
}

testFullImageFlow().catch(console.error)
