/**
 * SRTlocalized text
 */
export interface SRTEntry {
  index: number
  startTime: string
  endTime: string
  text: string
}

/**
 * localized textSRTlocalized text
 * @param srtText SRTlocalized text
 * @returns SRTlocalized text
 */
export function parseSRT(srtText: string): SRTEntry[] {
  const entries: SRTEntry[] = []
  
  // localized text
  const blocks = srtText.trim().split(/\n\s*\n/)
  
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue
    
    const index = parseInt(lines[0])
    const timeLine = lines[1]
    const text = lines.slice(2).join('\n')
    
    // localized text：00:00:00,000 --> 00:00:02,000
    const timeMatch = timeLine.match(/(\S+)\s*-->\s*(\S+)/)
    if (!timeMatch) continue
    
    entries.push({
      index,
      startTime: timeMatch[1],
      endTime: timeMatch[2],
      text
    })
  }
  
  return entries
}

/**
 * localized textSRTlocalized text
 * @param srtText localized textSRTlocalized text
 * @param start localized text（contains）
 * @param end localized text（contains）
 * @returns localized textSRTlocalized text
 */
export function sliceSRT(srtText: string, start: number, end: number): string {
  const entries = parseSRT(srtText)
  
  // localized text
  const slicedEntries = entries.filter(entry => entry.index >= start && entry.index <= end)
  
  // localized textSRTlocalized text
  return slicedEntries.map(entry => 
    `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}`
  ).join('\n\n')
}

/**
 * localized textSRTlocalized text（localized text）
 * @param srtText SRTlocalized text
 * @returns localized text（localized text）
 */
export function calculateSRTDuration(srtText: string): number {
  const entries = parseSRT(srtText)
  if (entries.length === 0) return 0
  
  const firstEntry = entries[0]
  const lastEntry = entries[entries.length - 1]
  
  const startSeconds = timeToSeconds(firstEntry.startTime)
  const endSeconds = timeToSeconds(lastEntry.endTime)
  
  return endSeconds - startSeconds
}

/**
 * localized textSRTlocalized text
 * @param timeStr localized text（localized text：00:00:02,500）
 * @returns localized text
 */
function timeToSeconds(timeStr: string): number {
  // localized text：HH:MM:SS,mmm
  const match = timeStr.match(/(\d+):(\d+):(\d+)[,.](\d+)/)
  if (!match) return 0
  
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])
  const milliseconds = parseInt(match[4])
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
}

/**
 * localized textSRTlocalized text
 * @param text localized text
 * @returns localized text
 */
export function isValidSRT(text: string): boolean {
  try {
    const entries = parseSRT(text)
    return entries.length > 0
  } catch {
    return false
  }
}

/**
 * localized textSRTlocalized text（localized text）
 * @param srtText SRTlocalized text
 * @returns localized text
 */
export function extractTextFromSRT(srtText: string): string {
  const entries = parseSRT(srtText)
  return entries.map(entry => entry.text).join('\n')
}

