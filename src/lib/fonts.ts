import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import fs from 'fs'
import path from 'path'
import { ImageResponse } from '@vercel/og'
import type { ReactElement } from 'react'

// localized text（localized text）
const POSSIBLE_FONT_PATHS = [
    path.join(process.cwd(), 'src/assets/fonts/NotoSansSC-Regular.ttf'),
    path.join(process.cwd(), '.next/server/src/assets/fonts/NotoSansSC-Regular.ttf'),
]

// localized text（localized text）
let fontDataCache: Buffer | null = null
let fontInitialized = false

/**
 * localized text
 */
function loadFontData(): Buffer | null {
    if (fontDataCache) {
        return fontDataCache
    }

    _ulogInfo('[Fonts] Searching for font file...')

    for (const fontPath of POSSIBLE_FONT_PATHS) {
        _ulogInfo('[Fonts] Trying:', fontPath)
        if (fs.existsSync(fontPath)) {
            fontDataCache = fs.readFileSync(fontPath)
            _ulogInfo('[Fonts] ✅ Font loaded:', fontPath, `(${(fontDataCache.length / 1024 / 1024).toFixed(2)} MB)`)
            return fontDataCache
        }
    }

    _ulogError('[Fonts] ❌ Font file not found')
    return null
}

/**
 * localized text（localized text）
 */
export async function initializeFonts(): Promise<void> {
    if (fontInitialized) {
        return
    }

    loadFontData()
    fontInitialized = true
}

/**
 * localized text
 */
export function getFontFamily(): string {
    return 'NotoSansSC'
}

/**
 * localized text @vercel/og localized text（PNG Buffer）
 * localized text WebAssembly，localized text
 * localized text Vercel localized text
 */
export async function createLabelSVG(
    width: number,
    barHeight: number,
    fontSize: number,
    padding: number,
    labelText: string
): Promise<Buffer> {
    const fontData = loadFontData()

    if (!fontData) {
        _ulogError('[Fonts] Cannot create label image without font')
        // localized text
        return createFallbackImage(width, barHeight)
    }

    try {
        // localized text @vercel/og localized text ImageResponse localized text
        const response = new ImageResponse(
            {
                type: 'div',
                props: {
                    style: {
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'black',
                        paddingLeft: padding,
                        paddingRight: padding,
                    },
                    children: {
                        type: 'span',
                        props: {
                            style: {
                                color: 'white',
                                fontSize: fontSize,
                                fontWeight: 'bold',
                                fontFamily: 'NotoSansSC',
                            },
                            children: labelText,
                        },
                    },
                },
            } as unknown as ReactElement,
            {
                width: width,
                height: barHeight,
                fonts: [
                    {
                        name: 'NotoSansSC',
                        data: fontData,
                        weight: 400,
                        style: 'normal',
                    },
                ],
            }
        )

        // localized text Response localized text Buffer
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
    } catch (error) {
        _ulogError('[Fonts] Error creating label image:', error)
        return createFallbackImage(width, barHeight)
    }
}

/**
 * localized text（localized text）
 */
async function createFallbackImage(width: number, height: number): Promise<Buffer> {
    // localized text sharp localized text
    const sharp = (await import('sharp')).default
    return sharp({
        create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
    })
        .png()
        .toBuffer()
}
