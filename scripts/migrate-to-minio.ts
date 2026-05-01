#!/usr/bin/env node
/**
 * localized text: Local → MinIO
 * 
 * localized text: localized text MinIO localized text
 * localized text:
 * - localized text（localized text）
 * - localized text
 * - localized text（localized text）
 * - localized text
 */

import { Client as MinioClient } from 'minio'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createHash } from 'crypto'
import { createReadStream } from 'fs'

// ==================== Config ====================
const CONFIG = {
  // localized text: localized text
  local: {
    baseDir: process.env.LOCAL_UPLOAD_DIR || './data/uploads',
  },
  // localized text: MinIO
  minio: {
    endPoint: process.env.MINIO_ENDPOINT?.replace(/^https?:\/\//, '') || '127.0.0.1',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'text_stoty_ai',
    region: process.env.MINIO_REGION || 'us-east-1',
    forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE !== 'false',
  },
  // localized text
  options: {
    concurrency: parseInt(process.env.MIGRATE_CONCURRENCY || '5'),
    dryRun: process.env.MIGRATE_DRY_RUN === 'true',
    resume: process.env.MIGRATE_RESUME !== 'false',
    progressFile: process.env.MIGRATE_PROGRESS_FILE || './scripts/.migrate-progress.json',
    logLevel: process.env.MIGRATE_LOG_LEVEL || 'info', // debug, info, warn, error
  }
}

// ==================== localized text ====================
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
function log(level: string, message: string, ...args: unknown[]) {
  if (LOG_LEVELS[level as keyof typeof LOG_LEVELS] >= LOG_LEVELS[CONFIG.options.logLevel as keyof typeof LOG_LEVELS]) {
    const timestamp = new Date().toISOString()
    console[level === 'error' ? 'error' : 'log'](`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args)
  }
}

// ==================== MinIO localized text ====================
const minioClient = new MinioClient({
  endPoint: CONFIG.minio.endPoint,
  port: CONFIG.minio.port,
  useSSL: CONFIG.minio.useSSL,
  accessKey: CONFIG.minio.accessKey,
  secretKey: CONFIG.minio.secretKey,
  region: CONFIG.minio.region,
})

// ==================== localized text ====================
async function scanLocalFiles(dir: string, basePath = ''): Promise<Array<{localPath: string, key: string, size: number, mtime: Date}>> {
  const files: Array<{localPath: string, key: string, size: number, mtime: Date}> = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(basePath, entry.name)
      
      if (entry.isDirectory()) {
        const subFiles = await scanLocalFiles(fullPath, relativePath)
        files.push(...subFiles)
      } else {
        const stats = await fs.stat(fullPath)
        files.push({
          localPath: fullPath,
          key: relativePath.replace(/\\/g, '/'), // localized text
          size: stats.size,
          mtime: stats.mtime,
        })
      }
    }
  } catch (err: unknown) {
    log('warn', `localized text: ${dir}`, (err as Error).message)
  }
  
  return files
}

// ==================== localized text ====================
async function calculateHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5')
    const stream = createReadStream(filePath)
    
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

// ==================== localized text ====================
async function loadProgress(): Promise<Set<string>> {
  try {
    if (!CONFIG.options.resume) {
      return new Set()
    }
    const data = await fs.readFile(CONFIG.options.progressFile, 'utf-8')
    const progress = JSON.parse(data)
    return new Set(progress.migrated || [])
  } catch {
    return new Set()
  }
}

async function saveProgress(migratedKeys: Set<string>) {
  const progress = {
    updatedAt: new Date().toISOString(),
    migrated: Array.from(migratedKeys),
  }
  await fs.writeFile(CONFIG.options.progressFile, JSON.stringify(progress, null, 2))
}

// ==================== localized text/localized text ====================
async function ensureBucket() {
  log('info', `localized text: ${CONFIG.minio.bucket}`)
  
  const exists = await minioClient.bucketExists(CONFIG.minio.bucket)
  if (!exists) {
    log('info', `localized text: ${CONFIG.minio.bucket}`)
    await minioClient.makeBucket(CONFIG.minio.bucket, CONFIG.minio.region)
    
    // localized text public read (localized text，localized text)
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${CONFIG.minio.bucket}/*`]
        }
      ]
    }
    await minioClient.setBucketPolicy(CONFIG.minio.bucket, JSON.stringify(policy))
    log('info', 'localized text')
  }
}

// ==================== localized text ====================
async function uploadFile(fileInfo: {localPath: string, key: string, size: number}, migratedKeys: Set<string>): Promise<{status: string, key: string, size?: number, error?: string}> {
  const { localPath, key, size } = fileInfo
  
  // localized text
  if (migratedKeys.has(key)) {
    log('debug', `localized text: ${key}`)
    return { status: 'skipped', key }
  }
  
  if (CONFIG.options.dryRun) {
    log('info', `[DRY RUN] localized text: ${key} (${formatBytes(size)})`)
    return { status: 'dry_run', key }
  }
  
  try {
    // localized text MD5
    const localHash = await calculateHash(localPath)
    
    // localized text
    const fileStream = createReadStream(localPath)
    await minioClient.putObject(CONFIG.minio.bucket, key, fileStream, size, {
      'Content-Type': guessContentType(key),
      'X-Amz-Meta-Original-Hash': localHash,
    })
    
    // localized text
    const stat = await minioClient.statObject(CONFIG.minio.bucket, key)
    
    // localized text
    migratedKeys.add(key)
    
    log('info', `✓ localized text: ${key} (${formatBytes(size)})`)
    return { status: 'success', key, size }
    
  } catch (err: unknown) {
    log('error', `✗ localized text: ${key}`, (err as Error).message)
    return { status: 'error', key, error: (err as Error).message }
  }
}

// ==================== localized text ====================
function guessContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.json': 'application/json',
    '.txt': 'text/plain',
  }
  return types[ext] || 'application/octet-stream'
}

// ==================== localized text ====================
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ==================== localized text ====================
async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []
  
  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result)
    })
    executing.push(promise)
    
    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }
  
  await Promise.all(executing)
  return results
}

// ==================== localized text ====================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║         Local Storage → MinIO Migration Tool             ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()
  
  log('info', 'localized text:')
  log('info', `  localized text: ${path.resolve(CONFIG.local.baseDir)}`)
  log('info', `  MinIO: ${CONFIG.minio.endPoint}:${CONFIG.minio.port}/${CONFIG.minio.bucket}`)
  log('info', `  localized text: ${CONFIG.options.concurrency}`)
  log('info', `  localized text: ${CONFIG.options.dryRun}`)
  log('info', `  localized text: ${CONFIG.options.resume}`)
  console.log()
  
  // 1. localized text
  log('info', 'localized text...')
  const files = await scanLocalFiles(CONFIG.local.baseDir)
  log('info', `localized text ${files.length} localized text`)
  
  if (files.length === 0) {
    log('info', 'localized text')
    return
  }
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  log('info', `localized text: ${formatBytes(totalSize)}`)
  console.log()
  
  // 2. localized text
  const migratedKeys = await loadProgress()
  log('info', `localized text: ${migratedKeys.size} localized text`)
  
  // 3. localized text
  await ensureBucket()
  
  // 4. localized text
  const startTime = Date.now()
  let processed = 0
  let success = 0
  let failed = 0
  let skipped = 0
  
  const uploadTasks = files.map(file => async () => {
    const result = await uploadFile(file, migratedKeys)
    processed++
    
    if (result.status === 'success') success++
    else if (result.status === 'error') failed++
    else if (result.status === 'skipped') skipped++
    
    // localized text 10 localized text
    if (processed % 10 === 0) {
      await saveProgress(migratedKeys)
      const progress = ((processed / files.length) * 100).toFixed(1)
      log('info', `localized text: ${progress}% (${processed}/${files.length})`)
    }
    
    return result
  })
  
  await runWithConcurrency(uploadTasks, CONFIG.options.concurrency)
  
  // 5. localized text
  await saveProgress(migratedKeys)
  
  // 6. localized text
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log()
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║                      localized text                            ║')
  console.log('╠══════════════════════════════════════════════════════════╣')
  console.log(`║ localized text:    ${String(files.length).padEnd(39)} ║`)
  console.log(`║ success:        ${String(success).padEnd(39)} ║`)
  console.log(`║ failed:        ${String(failed).padEnd(39)} ║`)
  console.log(`║ localized text:        ${String(skipped).padEnd(39)} ║`)
  console.log(`║ localized text:        ${String(duration + 's').padEnd(39)} ║`)
  console.log('╚══════════════════════════════════════════════════════════╝')
  
  // 7. localized text
  console.log()
  console.log('📋 localized text:')
  console.log('  1. localized text MinIO localized text: mc ls local/text_stoty_ai')
  console.log('  2. update .env: STORAGE_TYPE=minio')
  console.log('  3. localized text: docker compose restart app')
  console.log('  4. localized text/localized text')
  console.log('  5. localized text: rm -rf ./data/uploads')
  
  if (failed > 0) {
    process.exit(1)
  }
}

// localized text
main().catch(err => {
  log('error', 'localized text:', err)
  process.exit(1)
})
