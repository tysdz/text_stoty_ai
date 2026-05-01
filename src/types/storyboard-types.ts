/**
 * localized text
 * localized text (storyboard as any).panels localized text
 */

import { NovelPromotionStoryboard, NovelPromotionPanel } from './project'

/**
 * localized text panels localized text Storyboard localized text
 * localized text panels localized text
 */
export interface StoryboardWithPanels extends NovelPromotionStoryboard {
    panels: NovelPromotionPanel[]
}

/**
 * localized text：check storyboard localized text panels
 */
export function hasLoadedPanels(
    storyboard: NovelPromotionStoryboard
): storyboard is StoryboardWithPanels {
    return Array.isArray((storyboard as StoryboardWithPanels).panels)
}

/**
 * localized text panels localized text
 * localized text panels localized text
 */
export function getPanels(storyboard: NovelPromotionStoryboard): NovelPromotionPanel[] {
    if (hasLoadedPanels(storyboard)) {
        return storyboard.panels
    }
    return []
}

/**
 * localized text panel localized text
 * localized text candidateImages JSON localized text
 */
export function getPanelCandidates(panel: NovelPromotionPanel): string[] {
    if (!panel.imageHistory) return []
    try {
        const parsed = JSON.parse(panel.imageHistory)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}
