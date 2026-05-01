 import { logInfo as _ulogInfo, logWarn as _ulogWarn, logError as _ulogError } from '@/lib/logging/core'
/**
 * localized text
 * localized text3localized text，localized textVercellocalized text
 * 
 * localized text
 */

import { executeAiTextStep } from '@/lib/ai-runtime'
import { logAIAnalysis } from '@/lib/logging/semantic'
import { buildCharactersIntroduction } from '@/lib/constants'
import type { Locale } from '@/i18n/routing'
import { getPromptTemplate, PROMPT_IDS } from '@/lib/prompt-i18n'
import {
    buildPromptAssetContext,
    compileAssetPromptFragments,
} from '@/lib/assets/services/asset-prompt-context'

// localized text
export type StoryboardPhase = 1 | '2-cinematography' | '2-acting' | 3

type JsonRecord = Record<string, unknown>

export type ClipCharacterRef = string | { name?: string | null }

type CharacterAppearance = {
    changeReason?: string | null
    descriptions?: string | null
    selectedIndex?: number | null
    description?: string | null
}

export type CharacterAsset = {
    name: string
    appearances?: CharacterAppearance[]
}

export type LocationAsset = {
    name: string
    images?: Array<{
        isSelected?: boolean
        description?: string | null
    }>
}

export type PropAsset = {
    name: string
    summary?: string | null
}

type ClipAsset = {
    id?: string
    start?: string | number | null
    end?: string | number | null
    startText?: string | null
    endText?: string | null
    characters?: string | null
    location?: string | null
    props?: string | null
    content?: string | null
    screenplay?: string | null
}

type SessionAsset = {
    user: {
        id: string
        name: string
    }
}

type NovelPromotionAssetData = {
    analysisModel: string
    characters: CharacterAsset[]
    locations: LocationAsset[]
    props?: PropAsset[]
}

export type StoryboardPanel = JsonRecord & {
    panel_number?: number
    description?: string
    location?: string
    source_text?: string
    characters?: unknown
    props?: unknown
    srt_range?: unknown[]
    scene_type?: string
    shot_type?: string
    camera_move?: string
    video_prompt?: string
    duration?: number
    photographyPlan?: JsonRecord
    actingNotes?: unknown
}

export type PhotographyRule = JsonRecord & {
    panel_number?: number
    composition?: string
    lighting?: string
    color_palette?: string
    atmosphere?: string
    technical_notes?: string
}

export type ActingDirection = JsonRecord & {
    panel_number?: number
    characters?: unknown
}

function isJsonRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null
}

function parseClipCharacters(raw: string | null | undefined): ClipCharacterRef[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? (parsed as ClipCharacterRef[]) : []
    } catch {
        return []
    }
}

function parseScreenplay(raw: string | null | undefined): unknown {
    if (!raw) return null
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

// localized text
export const PHASE_PROGRESS: Record<string, { start: number, end: number, label: string, labelKey: string }> = {
    '1': { start: 10, end: 40, label: 'localized text', labelKey: 'phases.planning' },
    '2-cinematography': { start: 40, end: 55, label: 'localized text', labelKey: 'phases.cinematography' },
    '2-acting': { start: 55, end: 70, label: 'localized text', labelKey: 'phases.acting' },
    '3': { start: 70, end: 100, label: 'localized text', labelKey: 'phases.detail' }
}

// localized text
export interface PhaseResult {
    clipId: string
    planPanels?: StoryboardPanel[]
    photographyRules?: PhotographyRule[]
    actingDirections?: ActingDirection[]  // localized text
    finalPanels?: StoryboardPanel[]
}

// ========== localized text ==========

// localized text clip.characters localized text
export function getFilteredAppearanceList(characters: CharacterAsset[], clipCharacters: ClipCharacterRef[]): string {
    return compileAssetPromptFragments(buildPromptAssetContext({
        characters,
        locations: [],
        props: [],
        clipCharacters,
        clipLocation: null,
        clipProps: [],
    })).appearanceListText
}

// localized text clip.characters localized text
export function getFilteredFullDescription(characters: CharacterAsset[], clipCharacters: ClipCharacterRef[]): string {
    return compileAssetPromptFragments(buildPromptAssetContext({
        characters,
        locations: [],
        props: [],
        clipCharacters,
        clipLocation: null,
        clipProps: [],
    })).fullDescriptionText
}

// localized text clip.location localized text
export function getFilteredLocationsDescription(locations: LocationAsset[], clipLocation: string | null): string {
    return compileAssetPromptFragments(buildPromptAssetContext({
        characters: [],
        locations,
        props: [],
        clipCharacters: [],
        clipLocation,
        clipProps: [],
    })).locationDescriptionText
}

function parseClipProps(raw: string | null | undefined): string[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    } catch {
        return []
    }
}

// localized textCliplocalized text（supportSRTlocalized textAgentlocalized text）
export function formatClipId(clip: ClipAsset): string {
    // SRT localized text
    if (clip.start !== undefined && clip.start !== null) {
        return `${clip.start}-${clip.end}`
    }
    // Agent localized text
    if (clip.startText && clip.endText) {
        return `${clip.startText.substring(0, 10)}...~...${clip.endText.substring(0, 10)}`
    }
    // localized text
    return clip.id?.substring(0, 8) || 'unknown'
}

// localized textJSONlocalized text
function parseJsonResponse<T extends JsonRecord>(responseText: string, clipId: string, phase: number): T[] {
    let jsonText = responseText.trim()
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '')

    const firstBracket = jsonText.indexOf('[')
    const lastBracket = jsonText.lastIndexOf(']')

    if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
        throw new Error(`Phase ${phase}: JSONlocalized text clip ${clipId}`)
    }

    jsonText = jsonText.substring(firstBracket, lastBracket + 1)
    const result = JSON.parse(jsonText)

    if (!Array.isArray(result) || result.length === 0) {
        throw new Error(`Phase ${phase}: localized text clip ${clipId}`)
    }

    const normalized = result.filter(isJsonRecord) as T[]
    if (normalized.length === 0) {
        throw new Error(`Phase ${phase}: localized text clip ${clipId}`)
    }

    return normalized
}

// ========== Phase 1: localized text ==========
export async function executePhase1(
    clip: ClipAsset,
    novelPromotionData: NovelPromotionAssetData,
    session: SessionAsset,
    projectId: string,
    projectName: string,
    locale: Locale,
    taskId?: string
): Promise<PhaseResult> {
    const clipId = formatClipId(clip)
    void taskId
    _ulogInfo(`[Phase 1] Clip ${clipId}: localized text...`)

    // localized text
    const planPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_AGENT_STORYBOARD_PLAN, locale)

    // localized textcliplocalized text
    const clipCharacters = parseClipCharacters(clip.characters)
    const clipLocation = clip.location || null
    const clipProps = parseClipProps(clip.props)

    // localized text
    const charactersLibName = novelPromotionData.characters.map((c) => c.name).join(', ') || 'none'
    const locationsLibName = novelPromotionData.locations.map((l) => l.name).join(', ') || 'none'
    const filteredAppearanceList = getFilteredAppearanceList(novelPromotionData.characters, clipCharacters)
    const filteredFullDescription = getFilteredFullDescription(novelPromotionData.characters, clipCharacters)
    const filteredPropsDescription = compileAssetPromptFragments(buildPromptAssetContext({
        characters: [],
        locations: [],
        props: novelPromotionData.props || [],
        clipCharacters: [],
        clipLocation: null,
        clipProps,
    })).propsDescriptionText
    const charactersIntroduction = buildCharactersIntroduction(novelPromotionData.characters)

    // localized textclip JSON
    const clipJson = JSON.stringify({
        id: clip.id,
        content: clip.content,
        characters: clipCharacters,
        location: clipLocation,
        props: clipProps,
    }, null, 2)

    // localized text
    const screenplay = parseScreenplay(clip.screenplay)
    if (clip.screenplay && !screenplay) {
        _ulogWarn(`[Phase 1] Clip ${clipId}: localized textJSONlocalized text`)
    }

    // localized text
    let planPrompt = planPromptTemplate
        .replace('{characters_lib_name}', charactersLibName)
        .replace('{locations_lib_name}', locationsLibName)
        .replace('{characters_introduction}', charactersIntroduction)
        .replace('{characters_appearance_list}', filteredAppearanceList)
        .replace('{characters_full_description}', filteredFullDescription)
        .replace('{props_description}', filteredPropsDescription)
        .replace('{clip_json}', clipJson)

    if (screenplay) {
        planPrompt = planPrompt.replace('{clip_content}', `【localized text】\n${JSON.stringify(screenplay, null, 2)}`)
    } else {
        planPrompt = planPrompt.replace('{clip_content}', clip.content || '')
    }

    // localized text AI localized text prompt
    logAIAnalysis(session.user.id, session.user.name, projectId, projectName, {
        action: 'STORYBOARD_PHASE1_PROMPT',
        input: { clipId, prompt: planPrompt },
        model: novelPromotionData.analysisModel
    })

    // localized textAI（localized text）
    let planPanels: StoryboardPanel[] = []

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const planResult = await executeAiTextStep({
                userId: session.user.id,
                model: novelPromotionData.analysisModel,
                messages: [{ role: 'user', content: planPrompt }],
                reasoning: true,
                projectId,
                action: 'storyboard_phase1_plan',
                meta: {
                    stepId: 'storyboard_phase1_plan',
                    stepTitle: 'localized text',
                    stepIndex: 1,
                    stepTotal: 1,
                },
            })

            const planResponseText = planResult.text
            if (!planResponseText) {
                throw new Error(`Phase 1: localized text clip ${clipId}`)
            }

            planPanels = parseJsonResponse<StoryboardPanel>(planResponseText, clipId, 1)

            // localized text
            const validPanelCount = planPanels.filter(panel =>
                panel.description && panel.description !== 'none' && panel.location !== 'none'
            ).length

            _ulogInfo(`[Phase 1] Clip ${clipId}: localized text ${planPanels.length} localized text，localized text ${validPanelCount} localized text`)

            if (validPanelCount === 0) {
                throw new Error(`Phase 1: localized text clip ${clipId}`)
            }

            // ========== localized text source_text localized text，localized text ==========
            const missingSourceText = planPanels.some(panel => !panel.source_text)
            if (missingSourceText && attempt === 1) {
                _ulogWarn(`[Phase 1] Clip ${clipId}: localized textsource_text，localized text...`)
                continue
            }

            // success，localized text
            break
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error)
            _ulogError(`[Phase 1] Clip ${clipId}: Episode ${attempt}localized text: ${message}`)
            if (attempt === 2) throw error
        }
    }

    // localized text
    logAIAnalysis(session.user.id, session.user.name, projectId, projectName, {
        action: 'STORYBOARD_PHASE1_OUTPUT',
        output: {
            clipId,
            panelCount: planPanels.length,
            panels: planPanels
        },
        model: novelPromotionData.analysisModel
    })

    _ulogInfo(`[Phase 1] Clip ${clipId}: generate ${planPanels.length} localized text`)

    return { clipId, planPanels }
}

// ========== Phase 2: localized text ==========
export async function executePhase2(
    clip: ClipAsset,
    planPanels: StoryboardPanel[],
    novelPromotionData: NovelPromotionAssetData,
    session: SessionAsset,
    projectId: string,
    projectName: string,
    locale: Locale,
    taskId?: string
): Promise<PhaseResult> {
    const clipId = formatClipId(clip)
    void taskId
    _ulogInfo(`[Phase 2] Clip ${clipId}: localized text...`)

    // localized text
    const cinematographerPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_AGENT_CINEMATOGRAPHER, locale)

    // localized textcliplocalized text
    const clipCharacters = parseClipCharacters(clip.characters)
    const clipLocation = clip.location || null
    const clipProps = parseClipProps(clip.props)

    const filteredFullDescription = getFilteredFullDescription(novelPromotionData.characters, clipCharacters)
    const filteredLocationsDescription = getFilteredLocationsDescription(novelPromotionData.locations, clipLocation)
    const filteredPropsDescription = compileAssetPromptFragments(buildPromptAssetContext({
        characters: [],
        locations: [],
        props: novelPromotionData.props || [],
        clipCharacters: [],
        clipLocation: null,
        clipProps,
    })).propsDescriptionText

    // localized text
    const cinematographerPrompt = cinematographerPromptTemplate
        .replace('{panels_json}', JSON.stringify(planPanels, null, 2))
        .replace('{panel_count}', planPanels.length.toString())
        .replace(/\{panel_count\}/g, planPanels.length.toString())
        .replace('{locations_description}', filteredLocationsDescription)
        .replace('{characters_info}', filteredFullDescription)
        .replace('{props_description}', filteredPropsDescription)

    let photographyRules: PhotographyRule[] = []

    // localized text
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const cinematographerResult = await executeAiTextStep({
                userId: session.user.id,
                model: novelPromotionData.analysisModel,
                messages: [{ role: 'user', content: cinematographerPrompt }],
                reasoning: true,
                projectId,
                action: 'storyboard_phase2_cinematography',
                meta: {
                    stepId: 'storyboard_phase2_cinematography',
                    stepTitle: 'localized text',
                    stepIndex: 1,
                    stepTotal: 1,
                },
            })

            const responseText = cinematographerResult.text
            if (!responseText) {
                throw new Error(`Phase 2: localized text clip ${clipId}`)
            }

            photographyRules = parseJsonResponse<PhotographyRule>(responseText, clipId, 2)

            _ulogInfo(`[Phase 2] Clip ${clipId}: localized text ${photographyRules.length} localized text`)

            // localized text
            logAIAnalysis(session.user.id, session.user.name, projectId, projectName, {
                action: 'CINEMATOGRAPHER_PLAN',
                output: {
                    clipId,
                    panelCount: planPanels.length,
                    ruleCount: photographyRules.length,
                    rules: photographyRules
                },
                model: novelPromotionData.analysisModel
            })

            // success，localized text
            break
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e)
            _ulogError(`[Phase 2] Clip ${clipId}: Episode ${attempt}localized text: ${message}`)
            if (attempt === 2) throw e
        }
    }

    return { clipId, planPanels, photographyRules }
}

// ========== Phase 2-Acting: localized text ==========
export async function executePhase2Acting(
    clip: ClipAsset,
    planPanels: StoryboardPanel[],
    novelPromotionData: NovelPromotionAssetData,
    session: SessionAsset,
    projectId: string,
    projectName: string,
    locale: Locale,
    taskId?: string
): Promise<PhaseResult> {
    const clipId = formatClipId(clip)
    void taskId
    _ulogInfo(`[Phase 2-Acting] ==========================================`)
    _ulogInfo(`[Phase 2-Acting] Clip ${clipId}: localized text...`)
    _ulogInfo(`[Phase 2-Acting] planPanels localized text: ${planPanels.length}`)
    _ulogInfo(`[Phase 2-Acting] projectId: ${projectId}, projectName: ${projectName}`)

    // localized text
    const actingPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_AGENT_ACTING_DIRECTION, locale)

    // localized textcliplocalized text
    const clipCharacters = parseClipCharacters(clip.characters)

    const filteredFullDescription = getFilteredFullDescription(novelPromotionData.characters, clipCharacters)

    // localized text
    const actingPrompt = actingPromptTemplate
        .replace('{panels_json}', JSON.stringify(planPanels, null, 2))
        .replace('{panel_count}', planPanels.length.toString())
        .replace(/\{panel_count\}/g, planPanels.length.toString())
        .replace('{characters_info}', filteredFullDescription)

    let actingDirections: ActingDirection[] = []

    // localized text
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const actingResult = await executeAiTextStep({
                userId: session.user.id,
                model: novelPromotionData.analysisModel,
                messages: [{ role: 'user', content: actingPrompt }],
                reasoning: true,
                projectId,
                action: 'storyboard_phase2_acting',
                meta: {
                    stepId: 'storyboard_phase2_acting',
                    stepTitle: 'localized text',
                    stepIndex: 1,
                    stepTotal: 1,
                },
            })

            const responseText = actingResult.text
            if (!responseText) {
                throw new Error(`Phase 2-Acting: localized text clip ${clipId}`)
            }

            actingDirections = parseJsonResponse<ActingDirection>(responseText, clipId, 2)

            _ulogInfo(`[Phase 2-Acting] Clip ${clipId}: localized text ${actingDirections.length} localized text`)

            // localized text
            logAIAnalysis(session.user.id, session.user.name, projectId, projectName, {
                action: 'ACTING_DIRECTION_PLAN',
                output: {
                    clipId,
                    panelCount: planPanels.length,
                    directionCount: actingDirections.length,
                    directions: actingDirections
                },
                model: novelPromotionData.analysisModel
            })

            // success，localized text
            break
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e)
            _ulogError(`[Phase 2-Acting] Clip ${clipId}: Episode ${attempt}localized text: ${message}`)
            if (attempt === 2) throw e
        }
    }

    return { clipId, planPanels, actingDirections }
}

// ========== Phase 3: localized textvideo_prompt ==========
export async function executePhase3(
    clip: ClipAsset,
    planPanels: StoryboardPanel[],
    photographyRules: PhotographyRule[],
    novelPromotionData: NovelPromotionAssetData,
    session: SessionAsset,
    projectId: string,
    projectName: string,
    locale: Locale,
    taskId?: string
): Promise<PhaseResult> {
    const clipId = formatClipId(clip)
    void taskId
    _ulogInfo(`[Phase 3] Clip ${clipId}: localized text...`)

    // localized text
    const detailPromptTemplate = getPromptTemplate(PROMPT_IDS.NP_AGENT_STORYBOARD_DETAIL, locale)

    // localized textcliplocalized text
    const clipCharacters = parseClipCharacters(clip.characters)
    const clipLocation = clip.location || null
    const clipProps = parseClipProps(clip.props)

    const filteredFullDescription = getFilteredFullDescription(novelPromotionData.characters, clipCharacters)
    const filteredLocationsDescription = getFilteredLocationsDescription(novelPromotionData.locations, clipLocation)
    const filteredPropsDescription = compileAssetPromptFragments(buildPromptAssetContext({
        characters: [],
        locations: [],
        props: novelPromotionData.props || [],
        clipCharacters: [],
        clipLocation: null,
        clipProps,
    })).propsDescriptionText

    // localized text
    const detailPrompt = detailPromptTemplate
        .replace('{panels_json}', JSON.stringify(planPanels, null, 2))
        .replace('{characters_age_gender}', filteredFullDescription)  // localized text
        .replace('{locations_description}', filteredLocationsDescription)
        .replace('{props_description}', filteredPropsDescription)

    // localized text AI localized text prompt
    logAIAnalysis(session.user.id, session.user.name, projectId, projectName, {
        action: 'STORYBOARD_PHASE3_PROMPT',
        input: { clipId, prompt: detailPrompt },
        model: novelPromotionData.analysisModel
    })

    void photographyRules
    let finalPanels: StoryboardPanel[] = []

    // localized text
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const detailResult = await executeAiTextStep({
                userId: session.user.id,
                model: novelPromotionData.analysisModel,
                messages: [{ role: 'user', content: detailPrompt }],
                reasoning: true,
                projectId,
                action: 'storyboard_phase3_detail',
                meta: {
                    stepId: 'storyboard_phase3_detail',
                    stepTitle: 'localized text',
                    stepIndex: 1,
                    stepTotal: 1,
                },
            })

            const detailResponseText = detailResult.text
            if (!detailResponseText) {
                throw new Error(`Phase 3: localized text clip ${clipId}`)
            }

            finalPanels = parseJsonResponse<StoryboardPanel>(detailResponseText, clipId, 3)

            // localized text（localized text）
            logAIAnalysis(session.user.id, session.user.name, projectId, projectName, {
                action: 'STORYBOARD_PHASE3_OUTPUT',
                output: {
                    clipId,
                    panelCount: finalPanels.length,
                    finalPanels
                },
                model: novelPromotionData.analysisModel
            })

            // localized text"none"localized text
            const beforeFilterCount = finalPanels.length
            finalPanels = finalPanels.filter((panel) =>
                panel.description && panel.description !== 'none' && panel.location !== 'none'
            )
            _ulogInfo(`[Phase 3] Clip ${clipId}: localized text ${beforeFilterCount} -> ${finalPanels.length} localized text`)

            if (finalPanels.length === 0) {
                throw new Error(`Phase 3: localized text clip ${clipId}`)
            }

            // localized text：photographyRuleslocalized textroute.tslocalized text，localized textPhase 2localized text

            // localized text
            logAIAnalysis(session.user.id, session.user.name, projectId, projectName, {
                action: 'STORYBOARD_FINAL_OUTPUT',
                output: {
                    clipId,
                    beforeFilterCount,
                    finalPanelCount: finalPanels.length,
                    finalPanels
                },
                model: novelPromotionData.analysisModel
            })

            // success，localized text
            break
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e)
            _ulogError(`[Phase 3] Clip ${clipId}: Episode ${attempt}localized text: ${message}`)
            if (attempt === 2) throw e
        }
    }

    _ulogInfo(`[Phase 3] Clip ${clipId}: localized text ${finalPanels.length} localized text`)

    return { clipId, finalPanels }
}
