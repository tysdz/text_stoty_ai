'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { useTranslations } from 'next-intl'

import { useState, useCallback } from 'react'
import { useCreateProjectPanelVariant, useRefreshEpisodeData } from '@/lib/query/hooks'
import { NovelPromotionStoryboard, NovelPromotionPanel } from '@/types/project'

/**
 * usePanelVariant - localized text Hook
 * 
 * localized text
 * 🔥 localized text：localized text panel，localized text API localized text
 */

export interface VariantData {
    title: string
    description: string
    shot_type: string
    camera_move: string
    video_prompt: string
}

export interface VariantOptions {
    includeCharacterAssets: boolean
    includeLocationAsset: boolean
}

interface VariantModalState {
    panelId: string
    panelNumber: number | null
    description: string | null
    imageUrl: string | null
    storyboardId: string
}

interface UsePanelVariantProps {
    projectId: string
    episodeId: string
    // 🔥 localized text setLocalStoryboards localized text
    setLocalStoryboards: React.Dispatch<React.SetStateAction<NovelPromotionStoryboard[]>>
}

export function usePanelVariant({ projectId, episodeId, setLocalStoryboards }: UsePanelVariantProps) {
    const t = useTranslations('storyboard')
    // 🔥 localized text React Query refresh - refresh episodeData（contains storyboards localized text panels）
    const onRefresh = useRefreshEpisodeData(projectId, episodeId)
    const createPanelVariantMutation = useCreateProjectPanelVariant(projectId)
    // localized text
    const [variantModalState, setVariantModalState] = useState<VariantModalState | null>(null)

    // localized text Panel ID
    const [submittingVariantPanelId, setSubmittingVariantPanelId] = useState<string | null>(null)

    // localized text
    const openVariantModal = useCallback((panel: VariantModalState) => {
        setVariantModalState(panel)
    }, [])

    // localized text
    const closeVariantModal = useCallback(() => {
        setVariantModalState(null)
    }, [])

    // localized text
    const generatePanelVariant = useCallback(async (
        sourcePanelId: string,
        storyboardId: string,
        insertAfterPanelId: string,
        variant: VariantData,
        options: VariantOptions
    ): Promise<void> => {
        setSubmittingVariantPanelId(sourcePanelId)

        // 🔥 localized text：localized text panel
        const tempPanelId = `temp-variant-${Date.now()}`
        setLocalStoryboards(prev => prev.map(sb => {
            if (sb.id !== storyboardId) return sb

            // localized text
            const panels: NovelPromotionPanel[] = sb.panels || []
            const insertIndex = panels.findIndex((panel) => panel.id === insertAfterPanelId)
            if (insertIndex === -1) return sb

            // localized text panel
            const tempPanel: NovelPromotionPanel = {
                id: tempPanelId,
                storyboardId,
                panelIndex: insertIndex + 1,
                panelNumber: (panels[insertIndex]?.panelNumber || 0) + 0.5, // localized text
                description: variant.description || t('variant.generating'),
                shotType: variant.shot_type || null,
                cameraMove: variant.camera_move || null,
                videoPrompt: variant.video_prompt || null,
                imageUrl: null,
                imageTaskRunning: true, // 🔥 localized text
                characters: null,
                props: null,
                location: null,
                candidateImages: null,
                srtSegment: null,
                srtStart: null,
                srtEnd: null,
                duration: null,
                imagePrompt: null,
                media: null,
                imageHistory: null,
                videoUrl: null,
                videoMedia: null,
                lipSyncVideoUrl: null,
                lipSyncVideoMedia: null,
                sketchImageUrl: null,
                sketchImageMedia: null,
                previousImageUrl: null,
                previousImageMedia: null,
                photographyRules: null,
                actingNotes: null,
                imageErrorMessage: null,
            }

            // localized text panel
            const newPanels = [
                ...panels.slice(0, insertIndex + 1),
                tempPanel,
                ...panels.slice(insertIndex + 1)
            ]

            _ulogInfo('[usePanelVariant] 🎯 localized text：localized text panel', tempPanelId)

            return {
                ...sb,
                panels: newPanels
            }
        }))

        // 🔥 localized text（localized text API）
        setVariantModalState(null)

        try {
            const data = await createPanelVariantMutation.mutateAsync({
                storyboardId,
                insertAfterPanelId,
                sourcePanelId,
                variant,
                includeCharacterAssets: options.includeCharacterAssets,
                includeLocationAsset: options.includeLocationAsset,
            })

            // API success：Panel localized text（localized text），localized text panelId localized text ID
            // localized text task state localized text panel
            const realPanelId = data?.panelId
            _ulogInfo('[usePanelVariant] ✅ API success，realPanelId:', realPanelId)

            if (realPanelId) {
                setLocalStoryboards(prev => prev.map(sb => {
                    if (sb.id !== storyboardId) return sb
                    const panels = (sb.panels || []).map(p =>
                        p.id === tempPanelId ? { ...p, id: realPanelId } : p,
                    )
                    return { ...sb, panels }
                }))
            }

            // localized text
            if (onRefresh) {
                await onRefresh()
            }
        } catch (error) {
            // API failed：localized text panel localized text
            setLocalStoryboards(prev => prev.map(sb => {
                if (sb.id !== storyboardId) return sb
                const panels = (sb.panels || []).filter((panel) => panel.id !== tempPanelId)
                return { ...sb, panels }
            }))
            _ulogError('[usePanelVariant] localized text:', error)
            throw error
        } finally {
            setSubmittingVariantPanelId(null)
        }
    }, [createPanelVariantMutation, onRefresh, setLocalStoryboards, t])

    // localized text
    const handleVariantSelect = useCallback(async (
        variant: VariantData,
        options: VariantOptions
    ) => {
        if (!variantModalState) return

        // localized text panel localized text
        await generatePanelVariant(
            variantModalState.panelId,
            variantModalState.storyboardId,
            variantModalState.panelId, // localized text panel localized text
            variant,
            options
        )
    }, [variantModalState, generatePanelVariant])

    return {
        // localized text
        variantModalState,
        submittingVariantPanelId,
        isVariantModalOpen: !!variantModalState,
        isSubmittingVariantTask: !!submittingVariantPanelId,

        // localized text
        openVariantModal,
        closeVariantModal,
        generatePanelVariant,
        handleVariantSelect
    }
}
