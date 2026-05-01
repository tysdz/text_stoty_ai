'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { useTranslations } from 'next-intl'

/**
 * useCharacterActions - localized text Hook
 * localized text AssetsStage localized text，localized text CRUD localized text
 * 
 * 🔥 V6.5 localized text：localized text useProjectAssets，localized text props drilling
 */

import { useCallback } from 'react'
import { CharacterAppearance } from '@/types/project'
import { isAbortError } from '@/lib/error-utils'
import {
    useProjectAssets,
    useRefreshProjectAssets,
    useRegenerateSingleCharacterImage,
    useRegenerateCharacterGroup,
    useDeleteProjectCharacter,
    useDeleteProjectAppearance,
    useSelectProjectCharacterImage,
    useConfirmProjectCharacterSelection,
    useUpdateProjectAppearanceDescription,
    type Character
} from '@/lib/query/hooks'

interface UseCharacterActionsProps {
    projectId: string
    showToast?: (message: string, type: 'success' | 'warning' | 'error') => void
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'object' && error !== null) {
        const message = (error as { message?: unknown }).message
        if (typeof message === 'string') return message
    }
    return fallback
}

export function useCharacterActions({
    projectId,
    showToast
}: UseCharacterActionsProps) {
    const t = useTranslations('assets')
    // 🔥 localized text - localized text props drilling
    const { data: assets } = useProjectAssets(projectId)
    const characters = assets?.characters ?? []

    // 🔥 localized text - mutations localized text
    const refreshAssets = useRefreshProjectAssets(projectId)

    // 🔥 V6.7: localized textmutation hooks
    const regenerateSingleImage = useRegenerateSingleCharacterImage(projectId)
    const regenerateGroup = useRegenerateCharacterGroup(projectId)
    const deleteCharacterMutation = useDeleteProjectCharacter(projectId)
    const deleteAppearanceMutation = useDeleteProjectAppearance(projectId)
    const selectCharacterImageMutation = useSelectProjectCharacterImage(projectId)
    const confirmCharacterSelectionMutation = useConfirmProjectCharacterSelection(projectId)
    const updateAppearanceDescriptionMutation = useUpdateProjectAppearanceDescription(projectId)

    // localized text
    const getAppearances = useCallback((character: Character): CharacterAppearance[] => {
        return character.appearances || []
    }, [])

    // localized text
    const handleDeleteCharacter = useCallback(async (characterId: string) => {
        if (!confirm(t('character.deleteConfirm'))) return
        try {
            await deleteCharacterMutation.mutateAsync(characterId)
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(t('character.deleteFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
            }
        }
    }, [deleteCharacterMutation, t])

    // localized text
    const handleDeleteAppearance = useCallback(async (characterId: string, appearanceId: string) => {
        if (!confirm(t('character.deleteAppearanceConfirm'))) return
        try {
            await deleteAppearanceMutation.mutateAsync({ characterId, appearanceId })
            // 🔥 localized text
            refreshAssets()
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(t('character.deleteFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
            }
        }
    }, [deleteAppearanceMutation, refreshAssets, t])

    // localized text
    const handleSelectCharacterImage = useCallback(async (
        characterId: string,
        appearanceId: string,
        imageIndex: number | null
    ) => {
        try {
            await selectCharacterImageMutation.mutateAsync({
                characterId,
                appearanceId,
                imageIndex,
            })
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('localized text（localized text），localized text')
                return
            }
            alert(t('image.selectFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
        }
    }, [selectCharacterImageMutation, t])

    // localized text
    const handleConfirmSelection = useCallback(async (characterId: string, appearanceId: string) => {
        try {
            await confirmCharacterSelectionMutation.mutateAsync({ characterId, appearanceId })
            showToast?.(`✓ ${t('image.confirmSuccess')}`, 'success')
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('localized text（localized text），localized text')
                return
            }
            showToast?.(t('image.confirmFailed', { error: getErrorMessage(error, t('common.unknownError')) }), 'error')
        }
    }, [confirmCharacterSelectionMutation, showToast, t])

    // localized text - 🔥 V6.7: localized textmutation hook
    const handleRegenerateSingleCharacter = useCallback(async (
        characterId: string,
        appearanceId: string,
        imageIndex: number
    ) => {
        try {
            await regenerateSingleImage.mutateAsync({ characterId, appearanceId, imageIndex })
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(t('image.regenerateFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
            }
            throw error
        }
    }, [regenerateSingleImage, t])

    // localized text - 🔥 V6.7: localized textmutation hook
    const handleRegenerateCharacterGroup = useCallback(async (
        characterId: string,
        appearanceId: string,
        count?: number,
    ) => {
        try {
            await regenerateGroup.mutateAsync({ characterId, appearanceId, count })
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(t('image.regenerateFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
            }
            throw error
        }
    }, [regenerateGroup, t])

    // localized text - 🔥 localized text
    const handleUpdateAppearanceDescription = useCallback(async (
        characterId: string,
        appearanceId: string,
        newDescription: string,
        descriptionIndex?: number
    ) => {
        try {
            await updateAppearanceDescriptionMutation.mutateAsync({
                characterId,
                appearanceId,
                description: newDescription,
                descriptionIndex,
            })
            refreshAssets()
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                _ulogError('localized text:', getErrorMessage(error, t('common.unknownError')))
            }
        }
    }, [refreshAssets, updateAppearanceDescriptionMutation, t])

    return {
        // 🔥 localized text characters localized text（localized text，localized text）
        characters,
        getAppearances,
        handleDeleteCharacter,
        handleDeleteAppearance,
        handleSelectCharacterImage,
        handleConfirmSelection,
        handleRegenerateSingleCharacter,
        handleRegenerateCharacterGroup,
        handleUpdateAppearanceDescription
    }
}
