/**
 * localized text
 * 
 * localized text Word localized text：
 * - Vietnamese：localized text 1 words
 * - localized text：localized text 1 words（localized text）
 * - localized text、localized text、localized text
 */

/**
 * localized text（localized text Microsoft Word localized text）
 * 
 * @param text localized text
 * @returns localized text（localized text！）
 */
export function countWords(text: string): number {
    if (!text) return 0

    // localized text：localized text"localized text"
    // localized text+localized text，localized text
    let englishWordCount = 0
    const textWithoutEnglish = text.replace(/[a-zA-Z0-9]+/g, () => {
        englishWordCount++
        return '' // localized text，localized textVietnameselocalized text
    })

    // localized textVietnameselocalized text
    // localized text Unicode localized text + localized text A/B localized text
    const chineseMatches = textWithoutEnglish.match(/[\u4e00-\u9fa5\u3400-\u4dbf\u20000-\u2a6df]/g)
    const chineseCount = chineseMatches ? chineseMatches.length : 0

    return englishWordCount + chineseCount
}

/**
 * localized text（localized text）
 * localized text JavaScript localized text string.length
 * 
 * @param text localized text
 * @returns localized text
 */
export function countCharacters(text: string): number {
    return text?.length || 0
}

/**
 * localized text（localized text）
 * 
 * @param text localized text
 * @returns localized text（localized text）
 */
export function countCharactersNoSpaces(text: string): number {
    if (!text) return 0
    return text.replace(/\s/g, '').length
}
