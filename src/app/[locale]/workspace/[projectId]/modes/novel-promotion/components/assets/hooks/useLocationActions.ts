'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { useTranslations } from 'next-intl'

/**
 * useLocationActions - localized text Hook
 * localized text AssetsStage localized text，localized text CRUD localized text
 * 
 * 🔥 V6.5 localized text：localized text useProjectAssets，localized text props drilling
 */

import { useCallback } from 'react'
import { isAbortError } from '@/lib/error-utils'
import {
    useAssetActions,
    useProjectAssets,
    useRefreshProjectAssets,
    useRegenerateSingleLocationImage,
    useRegenerateLocationGroup,
    useDeleteProjectLocation,
    useSelectProjectLocationImage,
    useConfirmProjectLocationSelection,
    useUpdateProjectLocationDescription,
} from '@/lib/query/hooks'

interface UseLocationActionsProps {
    projectId: string
    assetType?: 'location' | 'prop'
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

export function useLocationActions({
    projectId,
    assetType = 'location',
    showToast
}: UseLocationActionsProps) {
    const t = useTranslations('assets')
    // 🔥 localized text - localized text props drilling
    const { data: assets } = useProjectAssets(projectId)
    const locations = assetType === 'prop' ? assets?.props ?? [] : assets?.locations ?? []
    const propActions = useAssetActions({ scope: 'project', projectId, kind: 'prop' })
    const assetKey = assetType === 'prop' ? 'prop' : 'location'

    // 🔥 localized text - mutations localized text
    const refreshAssets = useRefreshProjectAssets(projectId)

    // 🔥 V6.7: localized textmutation hooks
    const regenerateSingleImage = useRegenerateSingleLocationImage(projectId)
    const regenerateGroup = useRegenerateLocationGroup(projectId)
    const deleteLocationMutation = useDeleteProjectLocation(projectId)
    const selectLocationImageMutation = useSelectProjectLocationImage(projectId)
    const confirmLocationSelectionMutation = useConfirmProjectLocationSelection(projectId)
    const updateLocationDescriptionMutation = useUpdateProjectLocationDescription(projectId)

    // localized text
    const handleDeleteLocation = useCallback(async (locationId: string) => {
        if (!confirm(t(`${assetKey}.deleteConfirm`))) return
        try {
            if (assetType === 'prop') {
                await propActions.remove(locationId)
            } else {
                await deleteLocationMutation.mutateAsync(locationId)
            }
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(t(`${assetKey}.deleteFailed`, { error: getErrorMessage(error, t('common.unknownError')) }))
            }
        }
    }, [assetKey, assetType, deleteLocationMutation, propActions, t])

    // localized text
    const handleSelectLocationImage = useCallback(async (locationId: string, imageIndex: number | null) => {
        try {
            if (assetType === 'prop') {
                await propActions.selectRender({ id: locationId, imageIndex })
            } else {
                await selectLocationImageMutation.mutateAsync({ locationId, imageIndex })
            }
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('localized text（localized text），localized text')
                return
            }
            alert(t('image.selectFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
        }
    }, [assetType, propActions, selectLocationImageMutation, t])

    // localized text
    const handleConfirmLocationSelection = useCallback(async (locationId: string) => {
        if (assetType === 'prop') {
            return
        }
        try {
            await confirmLocationSelectionMutation.mutateAsync({ locationId })
            showToast?.(`✓ ${t('image.confirmSuccess')}`, 'success')
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('localized text（localized text），localized text')
                return
            }
            showToast?.(t('image.confirmFailed', { error: getErrorMessage(error, t('common.unknownError')) }), 'error')
        }
    }, [assetType, confirmLocationSelectionMutation, showToast, t])

    // localized text - 🔥 V6.7: localized textmutation hook
    const handleRegenerateSingleLocation = useCallback(async (locationId: string, imageIndex: number) => {
        try {
            if (assetType === 'prop') {
                await propActions.generate({ id: locationId, imageIndex })
            } else {
                await regenerateSingleImage.mutateAsync({ locationId, imageIndex })
            }
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(t('image.regenerateFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
            }
            throw error
        }
    }, [assetType, propActions, regenerateSingleImage, t])

    // localized text - 🔥 V6.7: localized textmutation hook
    const handleRegenerateLocationGroup = useCallback(async (locationId: string, count?: number) => {
        try {
            if (assetType === 'prop') {
                await propActions.generate({ id: locationId, count })
            } else {
                await regenerateGroup.mutateAsync({ locationId, count })
            }
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(t('image.regenerateFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
            }
            throw error
        }
    }, [assetType, propActions, regenerateGroup, t])

    // localized text - 🔥 localized text
    const handleUpdateLocationDescription = useCallback(async (
        locationId: string,
        newDescription: string
    ) => {
        try {
            if (assetType === 'prop') {
                const prop = locations.find((item) => item.id === locationId)
                const firstImageId = prop?.images?.[0]?.id
                await propActions.update(locationId, {
                    summary: newDescription,
                })
                if (firstImageId) {
                    await propActions.updateVariant(locationId, firstImageId, {
                        description: newDescription,
                    })
                }
            } else {
                await updateLocationDescriptionMutation.mutateAsync({
                    locationId,
                    description: newDescription,
                })
            }
            refreshAssets()
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                _ulogError('localized text:', getErrorMessage(error, t('common.unknownError')))
            }
        }
    }, [assetType, locations, propActions, refreshAssets, updateLocationDescriptionMutation, t])

    return {
        // 🔥 localized text locations localized text
        locations,
        handleDeleteLocation,
        handleSelectLocationImage,
        handleConfirmLocationSelection,
        handleRegenerateSingleLocation,
        handleRegenerateLocationGroup,
        handleUpdateLocationDescription
    }
}
