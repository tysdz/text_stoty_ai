import { logError as _ulogError } from '@/lib/logging/core'
/**
 * AI localized text
 * localized text Asset Hub localized text Novel Promotion localized text AI localized text
 */

import { executeAiTextStep } from '@/lib/ai-runtime'
import { withTextBilling } from '@/lib/billing'
import { buildPrompt, PROMPT_IDS } from '@/lib/prompt-i18n'
import type { Locale } from '@/i18n/routing'

export type AssetType = 'character' | 'location'

export interface AIDesignOptions {
    userId: string
    locale: Locale
    analysisModel: string
    userInstruction: string
    assetType: AssetType
    /** localized text：'asset-hub' localized text projectId */
    projectId?: string
    /** localized text worker localized text，localized text */
    skipBilling?: boolean
}

export interface AIDesignResult {
    success: boolean
    prompt?: string
    error?: string
}

/**
 * AI localized text
 * localized text prompt localized text
 */
export async function aiDesign(options: AIDesignOptions): Promise<AIDesignResult> {
    const {
        userId,
        locale,
        analysisModel,
        userInstruction,
        assetType,
        projectId = 'asset-hub',
        skipBilling = false,
    } = options

    if (!userInstruction?.trim()) {
        return {
            success: false,
            error: assetType === 'character' ? 'localized text' : 'localized text'
        }
    }

    if (!analysisModel) {
        return {
            success: false,
            error: 'Please configure an analysis model in user settings first'
        }
    }

    let finalPrompt: string
    try {
        finalPrompt = buildPrompt({
            promptId: assetType === 'character'
                ? PROMPT_IDS.NP_CHARACTER_CREATE
                : PROMPT_IDS.NP_LOCATION_CREATE,
            locale,
            variables: {
                user_input: userInstruction,
            },
        })
    } catch {
        _ulogError('[AI Design] localized text')
        return { success: false, error: 'localized text' }
    }

    // localized text LLM
    const action = assetType === 'character' ? 'ai_design_character' : 'ai_design_location'
    const maxInputTokens = Math.max(1200, Math.ceil(finalPrompt.length * 1.2))
    const maxOutputTokens = 1200
    const runCompletion = async () =>
        await executeAiTextStep({
            userId,
            model: analysisModel,
            messages: [{ role: 'user', content: finalPrompt }],
            temperature: 0.7,
            projectId,
            action,
            meta: {
                stepId: action,
                stepTitle: assetType === 'character' ? 'localized text' : 'localized text',
                stepIndex: 1,
                stepTotal: 1,
            },
        })
    const completion = skipBilling
        ? await runCompletion()
        : await withTextBilling(
            userId,
            analysisModel,
            maxInputTokens,
            maxOutputTokens,
            { projectId, action, metadata: { assetType } },
            runCompletion,
        )

    const aiResponse = completion.text

    if (!aiResponse) {
        return { success: false, error: 'AIlocalized text' }
    }

    // localized text JSON localized text
    let parsedResponse
    try {
        parsedResponse = JSON.parse(aiResponse)
    } catch {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            try {
                parsedResponse = JSON.parse(jsonMatch[0])
            } catch {
                _ulogError('[AI Design] AI localized text:', aiResponse)
                return { success: false, error: 'AIlocalized text' }
            }
        } else {
            _ulogError('[AI Design] AI localized text:', aiResponse)
            return { success: false, error: 'AIlocalized text' }
        }
    }

    if (!parsedResponse.prompt) {
        return { success: false, error: 'AIlocalized textpromptlocalized text' }
    }

    return {
        success: true,
        prompt: parsedResponse.prompt
    }
}
