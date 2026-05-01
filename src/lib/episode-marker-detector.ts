/**
 * localized text
 * localized text，localized text
 */

import { countWords } from './word-count'

export interface EpisodeMarkerMatch {
    index: number          // localized text
    text: string           // localized text
    episodeNumber: number  // localized text
}

export interface PreviewSplit {
    number: number
    title: string
    wordCount: number
    startIndex: number
    endIndex: number
    preview: string        // localized text20localized text
}

export interface EpisodeMarkerResult {
    hasMarkers: boolean
    markerType: string
    markerTypeKey: string  // i18n key
    confidence: 'high' | 'medium' | 'low'
    matches: EpisodeMarkerMatch[]
    previewSplits: PreviewSplit[]
}

// localized text
interface DetectionPattern {
    regex: RegExp
    typeKey: string
    typeName: string
    extractNumber: (match: RegExpMatchArray) => number
    extractTitle: (match: RegExpMatchArray, content: string, nextIndex?: number) => string
}

const DETECTION_PATTERNS: DetectionPattern[] = [
    // 4. localized text X-Y【Location】 - localized text
    {
        regex: /^(\d+)-\d+[【\[](.*?)[】\]]/gm,
        typeKey: 'scene',
        typeName: 'X-Y【Location】',
        extractNumber: (match) => parseInt(match[1], 10),
        extractTitle: (match) => match[2]?.trim() || ''
    },
    // 5. localized text "1. localized text" localized text "1、localized text"
    {
        regex: /^(\d+)[\.、：:]\s*(.+)/gm,
        typeKey: 'numbered',
        typeName: 'localized text',
        extractNumber: (match) => parseInt(match[1], 10),
        extractTitle: (match) => match[2]?.trim().slice(0, 20) || ''
    },
    // 5.5 localized text+localized text "1\." localized text "3\."（Markdownlocalized text）
    {
        regex: /^(\d+)\\\.\s*(.+)/gm,
        typeKey: 'numberedEscaped',
        typeName: 'localized text(localized text)',
        extractNumber: (match) => parseInt(match[1], 10),
        extractTitle: (match) => match[2]?.trim().slice(0, 20) || ''
    },
    // 6. localized text Episode
    {
        regex: /^Episode\s*(\d+)[：:\s]*(.*)?/gim,
        typeKey: 'episodeEn',
        typeName: 'Episode X',
        extractNumber: (match) => parseInt(match[1], 10),
        extractTitle: (match) => match[2]?.trim() || ''
    },
    // 7. localized text Chapter
    {
        regex: /^Chapter\s*(\d+)[：:\s]*(.*)?/gim,
        typeKey: 'chapterEn',
        typeName: 'Chapter X',
        extractNumber: (match) => parseInt(match[1], 10),
        extractTitle: (match) => match[2]?.trim() || ''
    },
    // 8. Markdownlocalized text (localized text "...localized text**1**localized text..." localized text "...localized text**3**localized text...")
    // localized text，localized text
    {
        regex: /\*\*(\d+)\*\*/g,
        typeKey: 'boldNumber',
        typeName: '**localized text**',
        extractNumber: (match) => parseInt(match[1], 10),
        extractTitle: () => ''
    },
    // 9. localized text (localized text "1\nlocalized text")
    {
        regex: /^(\d+)\s*$/gm,
        typeKey: 'pureNumber',
        typeName: 'localized text',
        extractNumber: (match) => parseInt(match[1], 10),
        extractTitle: () => ''
    },
]

/**
 * localized text
 */
export function detectEpisodeMarkers(content: string): EpisodeMarkerResult {
    const result: EpisodeMarkerResult = {
        hasMarkers: false,
        markerType: '',
        markerTypeKey: '',
        confidence: 'low',
        matches: [],
        previewSplits: []
    }

    if (!content || content.length < 100) {
        return result
    }

    // localized text
    for (const pattern of DETECTION_PATTERNS) {
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags)
        const matches: EpisodeMarkerMatch[] = []
        let match: RegExpExecArray | null

        while ((match = regex.exec(content)) !== null) {
            const episodeNumber = pattern.extractNumber(match)

            // localized text：localized text
            if (pattern.typeKey === 'scene') {
                const existingMatch = matches.find(m => m.episodeNumber === episodeNumber)
                if (existingMatch) {
                    continue // localized text
                }
            }

            matches.push({
                index: match.index,
                text: match[0],
                episodeNumber
            })
        }

        // localized text，localized text
        if (matches.length >= 2 && matches.length > result.matches.length) {
            result.matches = matches
            result.markerType = pattern.typeName
            result.markerTypeKey = pattern.typeKey
            result.hasMarkers = true
        }
    }

    if (!result.hasMarkers) {
        return result
    }

    // localized text
    result.matches.sort((a, b) => a.index - b.index)

    // localized text
    const matchCount = result.matches.length
    const avgDistance = result.matches.length > 1
        ? (result.matches[result.matches.length - 1].index - result.matches[0].index) / (result.matches.length - 1)
        : 0

    if (matchCount >= 3 && avgDistance >= 500 && avgDistance <= 8000) {
        result.confidence = 'high'
    } else if (matchCount >= 2) {
        result.confidence = 'medium'
    } else {
        result.confidence = 'low'
    }

    // localized text
    const previewSplits: PreviewSplit[] = []

    // 🔥 localized text1 episode，localized text，localized text
    const firstMatch = result.matches[0]
    if (firstMatch && firstMatch.episodeNumber > 1 && firstMatch.index > 100) {
        // localized text1localized text
        for (let i = 1; i < firstMatch.episodeNumber; i++) {
            // localized text1localized text
            if (i === 1) {
                const episodeContent = content.slice(0, firstMatch.index)
                const preview = episodeContent.slice(0, 50).trim().slice(0, 20)
                previewSplits.push({
                    number: i,
                    title: `Episode  ${i}  episode`,
                    wordCount: countWords(episodeContent),
                    startIndex: 0,
                    endIndex: firstMatch.index,
                    preview: preview + (preview.length >= 20 ? '...' : '')
                })
                break // localized text1 episode，localized text1localized text2localized text
            }
        }
    }

    // localized text
    result.matches.forEach((match, idx) => {
        const startIndex = idx === 0 && previewSplits.length === 0 ? 0 : match.index
        const endIndex = idx < result.matches.length - 1
            ? result.matches[idx + 1].index
            : content.length

        const episodeContent = content.slice(startIndex, endIndex)
        const wordCount = countWords(episodeContent)

        // localized text"Episode  X  episode"localized text
        const title = `Episode  ${match.episodeNumber}  episode`

        // localized text：localized text（localized text "1." localized text，localized text）
        const markerPositionInContent = match.index - startIndex
        // localized text
        const markerPrefix = match.text.match(/^(?:Episode [localized text\d]+[localized text]|Episode\s*\d+|Chapter\s*\d+|\*\*\d+\*\*|\d+)[\.、：:\s]*/i)?.[0] || ''
        const prefixLength = markerPrefix.length || match.text.length
        const previewStart = markerPositionInContent + prefixLength
        const preview = episodeContent.slice(previewStart, previewStart + 50).trim().slice(0, 20)

        previewSplits.push({
            number: match.episodeNumber,
            title,
            wordCount,
            startIndex,
            endIndex,
            preview: preview + (preview.length >= 20 ? '...' : '')
        })
    })

    result.previewSplits = previewSplits

    return result
}

/**
 * localized text
 */
export function splitByMarkers(content: string, markerResult: EpisodeMarkerResult): Array<{
    number: number
    title: string
    summary: string
    content: string
    wordCount: number
}> {
    if (!markerResult.hasMarkers || markerResult.previewSplits.length === 0) {
        return []
    }

    return markerResult.previewSplits.map(split => {
        const episodeContent = content.slice(split.startIndex, split.endIndex).trim()

        return {
            number: split.number,
            title: split.title || `Episode  ${split.number}  episode`,
            summary: '', // localized text
            content: episodeContent,
            wordCount: countWords(episodeContent)
        }
    })
}
