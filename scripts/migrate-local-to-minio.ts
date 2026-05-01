#!/usr/bin/env npx tsx
/**
 * localized text → MinIO localized text
 * localized text @aws-sdk/client-s3（localized text）
 * 
 * localized text: npx tsx scripts/migrate-local-to-minio.ts
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createReadStream } from 'fs'

// ==================== Config ====================
const LOCAL_DIR = process.env.LOCAL_UPLOAD_DIR || './data/uploads'
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://127.0.0.1:19000'
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'text_stoty_ai'
const MINIO_REGION = process.env.MINIO_REGION || 'us-east-1'
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin'
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin'
const CONCURRENCY = parseInt(process.env.MIGRATE_CONCURRENCY || '10')
const DRY_RUN = process.env.MIGRATE_DRY_RUN === 'true'

// ==================== S3 localized text ====================
const s3 = new S3Client({
    endpoint: MINIO_ENDPOINT,
    region: MINIO_REGION,
    forcePathStyle: true,
    credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
    },
})

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
        '.ogg': 'audio/ogg',
        '.json': 'application/json',
        '.txt': 'text/plain',
    }
    return types[ext] || 'application/octet-stream'
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ==================== localized text ====================
async function scanLocalFiles(dir: string, basePath = ''): Promise<Array<{ localPath: string; key: string; size: number }>> {
    const files: Array<{ localPath: string; key: string; size: number }> = []

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            const relativePath = path.join(basePath, entry.name)

            if (entry.isDirectory()) {
                files.push(...await scanLocalFiles(fullPath, relativePath))
            } else {
                // localized text
                if (entry.name.startsWith('.')) continue
                const stats = await fs.stat(fullPath)
                files.push({
                    localPath: fullPath,
                    key: relativePath.replace(/\\/g, '/'),
                    size: stats.size,
                })
            }
        }
    } catch (err: unknown) {
        console.error(`  ⚠️ localized text: ${dir}`, (err as Error).message)
    }

    return files
}

// ==================== localized text ====================
async function objectExists(key: string): Promise<boolean> {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: MINIO_BUCKET, Key: key }))
        return true
    } catch {
        return false
    }
}

// ==================== localized text ====================
async function uploadFile(file: { localPath: string; key: string; size: number }): Promise<'success' | 'skipped' | 'error'> {
    // localized text
    if (await objectExists(file.key)) {
        return 'skipped'
    }

    if (DRY_RUN) {
        console.log(`  [DRY RUN] localized text: ${file.key} (${formatBytes(file.size)})`)
        return 'skipped'
    }

    try {
        const body = await fs.readFile(file.localPath)
        await s3.send(new PutObjectCommand({
            Bucket: MINIO_BUCKET,
            Key: file.key,
            Body: body,
            ContentType: guessContentType(file.key),
        }))
        return 'success'
    } catch (err: unknown) {
        console.error(`  ✗ localized text: ${file.key}`, (err as Error).message)
        return 'error'
    }
}

// ==================== localized text ====================
async function runBatched<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency)
        await Promise.all(batch.map(fn))
    }
}

// ==================== localized text ====================
async function main() {
    console.log()
    console.log('╔══════════════════════════════════════════════════════╗')
    console.log('║      Local Storage → MinIO Migration Tool           ║')
    console.log('╚══════════════════════════════════════════════════════╝')
    console.log()
    console.log(`  📂 localized text:    ${path.resolve(LOCAL_DIR)}`)
    console.log(`  🪣 localized text:    ${MINIO_ENDPOINT}/${MINIO_BUCKET}`)
    console.log(`  ⚡ localized text:    ${CONCURRENCY}`)
    console.log(`  🔍 localized text:    ${DRY_RUN}`)
    console.log()

    // 1. localized text
    console.log('📦 localized text...')
    const files = await scanLocalFiles(LOCAL_DIR)

    if (files.length === 0) {
        console.log('  localized text')
        return
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    console.log(`  localized text ${files.length} localized text, localized text: ${formatBytes(totalSize)}`)
    console.log()

    // 2. localized text
    console.log('🚀 localized text...')
    const startTime = Date.now()
    let success = 0
    let skipped = 0
    let failed = 0
    let processed = 0

    await runBatched(files, CONCURRENCY, async (file) => {
        const result = await uploadFile(file)
        processed++

        if (result === 'success') {
            success++
            if (success % 50 === 0 || success <= 5) {
                console.log(`  ✓ [${processed}/${files.length}] ${file.key} (${formatBytes(file.size)})`)
            }
        } else if (result === 'skipped') {
            skipped++
        } else {
            failed++
        }

        if (processed % 100 === 0) {
            const pct = ((processed / files.length) * 100).toFixed(1)
            console.log(`  📊 localized text: ${pct}% (${processed}/${files.length}) | ✓${success} ⏭${skipped} ✗${failed}`)
        }
    })

    // 3. localized text
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log()
    console.log('╔══════════════════════════════════════════════════════╗')
    console.log('║                    localized text                          ║')
    console.log('╠══════════════════════════════════════════════════════╣')
    console.log(`║  localized text:  ${String(files.length).padEnd(40)} ║`)
    console.log(`║  success:    ${String(success).padEnd(40)} ║`)
    console.log(`║  localized text:    ${String(skipped).padEnd(40)} ║`)
    console.log(`║  failed:    ${String(failed).padEnd(40)} ║`)
    console.log(`║  localized text:    ${String(duration + 's').padEnd(40)} ║`)
    console.log(`║  localized text:    ${formatBytes(totalSize).padEnd(40)} ║`)
    console.log('╚══════════════════════════════════════════════════════╝')

    if (failed > 0) {
        console.log()
        console.log('⚠️  localized text，localized text（localized text）')
        process.exit(1)
    }
}

main().catch(err => {
    console.error('localized text:', err)
    process.exit(1)
})
