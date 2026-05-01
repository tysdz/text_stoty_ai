/**
 * localized text
 * localized text
 */

export type RoleLevel = 'S' | 'A' | 'B' | 'C' | 'D'

export type CostumeTier = 1 | 2 | 3 | 4 | 5

export interface CharacterProfileData {
    /** localized text */
    role_level: RoleLevel

    /** localized text (localized text: localized text, localized text) */
    archetype: string

    /** localized text */
    personality_tags: string[]

    /** localized text */
    era_period: string

    /** localized text */
    social_class: string

    /** localized text (localized text) */
    occupation?: string

    /** localized text (1-5) */
    costume_tier: CostumeTier

    /** localized text */
    suggested_colors: string[]

    /** localized text (S/Alocalized text) */
    primary_identifier?: string

    /** localized text */
    visual_keywords: string[]

    /** localized text */
    gender: string

    /** localized text */
    age_range: string
}

/**
 * localized textJSONlocalized text
 */
export function parseProfileData(profileDataJson: string | null): CharacterProfileData | null {
    if (!profileDataJson) return null
    try {
        return JSON.parse(profileDataJson) as CharacterProfileData
    } catch {
        return null
    }
}

/**
 * localized textJSONlocalized text
 */
export function stringifyProfileData(profileData: CharacterProfileData): string {
    return JSON.stringify(profileData)
}

/**
 * localized text
 */
export function validateProfileData(data: unknown): data is CharacterProfileData {
    if (!data || typeof data !== 'object') return false
    const candidate = data as Partial<CharacterProfileData>
    return !!(
        typeof candidate.role_level === 'string' &&
        ['S', 'A', 'B', 'C', 'D'].includes(candidate.role_level) &&
        typeof candidate.archetype === 'string' &&
        Array.isArray(candidate.personality_tags) &&
        typeof candidate.era_period === 'string' &&
        typeof candidate.social_class === 'string' &&
        typeof candidate.costume_tier === 'number' &&
        candidate.costume_tier >= 1 &&
        candidate.costume_tier <= 5 &&
        Array.isArray(candidate.suggested_colors) &&
        Array.isArray(candidate.visual_keywords) &&
        typeof candidate.gender === 'string' &&
        typeof candidate.age_range === 'string'
    )
}
