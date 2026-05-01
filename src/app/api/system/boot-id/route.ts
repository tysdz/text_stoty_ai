import { NextResponse } from 'next/server'
import { SERVER_BOOT_ID } from '@/lib/server-boot'

/**
 * GET /api/system/boot-id
 * localized textID，localized text
 */
export async function GET() {
    return NextResponse.json({ bootId: SERVER_BOOT_ID })
}
