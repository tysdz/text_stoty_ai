/**
 * localized text Hook
 * localized text
 * 
 * 🔥 V6.5 localized text：localized text useProjectAssets，localized text props drilling
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { CharacterProfileData, parseProfileData } from '@/types/character-profile'
import {
    useProjectAssets,
    useRefreshProjectAssets,
    useDeleteProjectCharacter,
    useConfirmProjectCharacterProfile,
    useBatchConfirmProjectCharacterProfiles,
} from '@/lib/query/hooks'

interface UseProfileManagementProps {
    projectId: string
    showToast?: (message: string, type: 'success' | 'warning' | 'error') => void
}

export function useProfileManagement({
    projectId,
    showToast
}: UseProfileManagementProps) {
    const t = useTranslations('assets')
    // 🔥 localized text - localized text props drilling
    const { data: assets } = useProjectAssets(projectId)
    const characters = useMemo(() => assets?.characters ?? [], [assets?.characters])

    // 🔥 localized text
    const refreshAssets = useRefreshProjectAssets(projectId)
    const deleteCharacterMutation = useDeleteProjectCharacter(projectId)
    const confirmCharacterProfileMutation = useConfirmProjectCharacterProfile(projectId)
    const batchConfirmProfilesMutation = useBatchConfirmProjectCharacterProfiles(projectId)

    // 🔥 localized text：localized text Set localized text（localized text；localized text profileConfirmTaskRunning localized text）
    const [confirmingCharacterIds, setConfirmingCharacterIds] = useState<Set<string>>(new Set())
    const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null)
    const [batchConfirmingLocal, setBatchConfirmingLocal] = useState(false)
    const [editingProfile, setEditingProfile] = useState<{
        characterId: string
        characterName: string
        profileData: CharacterProfileData
    } | null>(null)

    // localized text
    const unconfirmedCharacters = useMemo(() =>
        characters.filter(char => char.profileData && !char.profileConfirmed),
        [characters]
    )

    // 🔥 localized text + localized text，localized text
    const isConfirmingCharacter = useCallback((id: string) => {
        // localized text
        if (confirmingCharacterIds.has(id)) return true
        // localized text（localized text）
        const character = characters.find(c => c.id === id)
        return !!character?.profileConfirmTaskRunning
    }, [confirmingCharacterIds, characters])

    // 🔥 batchConfirming localized text + localized text
    const batchConfirming = useMemo(() => {
        if (batchConfirmingLocal) return true
        // localized text，localized text
        return unconfirmedCharacters.some(char => char.profileConfirmTaskRunning)
    }, [batchConfirmingLocal, unconfirmedCharacters])

    // localized text
    const handleEditProfile = useCallback((characterId: string, characterName: string) => {
        const character = characters.find(c => c.id === characterId)
        if (!character?.profileData) return

        const profileData = parseProfileData(character.profileData)
        if (!profileData) {
            showToast?.(t('characterProfile.parseFailed'), 'error')
            return
        }

        setEditingProfile({ characterId, characterName, profileData })
    }, [characters, showToast, t])

    // localized text
    const handleConfirmProfile = useCallback(async (
        characterId: string,
        updatedProfileData?: CharacterProfileData
    ) => {
        // 🔥 localized text
        setConfirmingCharacterIds(prev => new Set(prev).add(characterId))
        try {
            await confirmCharacterProfileMutation.mutateAsync({
                characterId,
                profileData: updatedProfileData,
                generateImage: true,
            })

            showToast?.(t('characterProfile.confirmSuccessGenerating'), 'success')
            refreshAssets()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('common.unknownError')
            showToast?.(t('characterProfile.confirmFailed', { error: message }), 'error')
        } finally {
            // 🔥 localized text
            setConfirmingCharacterIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(characterId)
                return newSet
            })
            setEditingProfile(null)
        }
    }, [confirmCharacterProfileMutation, refreshAssets, showToast, t])

    // localized text
    const handleBatchConfirm = useCallback(async () => {
        if (unconfirmedCharacters.length === 0) {
            showToast?.(t('characterProfile.noPendingCharacters'), 'warning')
            return
        }

        if (!confirm(t('characterProfile.batchConfirmPrompt', { count: unconfirmedCharacters.length }))) {
            return
        }

        setBatchConfirmingLocal(true)
        try {
            const result = await batchConfirmProfilesMutation.mutateAsync()
            const confirmedCount = result.count ?? 0
            showToast?.(t('characterProfile.batchConfirmSuccess', { count: confirmedCount }), 'success')
            refreshAssets()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('common.unknownError')
            showToast?.(t('characterProfile.batchConfirmFailed', { error: message }), 'error')
        } finally {
            setBatchConfirmingLocal(false)
        }
    }, [batchConfirmProfilesMutation, refreshAssets, showToast, t, unconfirmedCharacters.length])

    // localized text（localized text）
    const handleDeleteProfile = useCallback(async (characterId: string) => {
        if (!confirm(t('characterProfile.deleteConfirm'))) {
            return
        }

        setDeletingCharacterId(characterId)
        try {
            await deleteCharacterMutation.mutateAsync(characterId)
            showToast?.(t('characterProfile.deleteSuccess'), 'success')
            refreshAssets()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('common.unknownError')
            showToast?.(t('characterProfile.deleteFailed', { error: message }), 'error')
        } finally {
            setDeletingCharacterId(null)
        }
    }, [deleteCharacterMutation, refreshAssets, showToast, t])

    return {
        // 🔥 localized text characters localized text
        characters,
        unconfirmedCharacters,
        confirmingCharacterIds,
        isConfirmingCharacter,
        deletingCharacterId,
        batchConfirming,
        editingProfile,
        handleEditProfile,
        handleConfirmProfile,
        handleBatchConfirm,
        handleDeleteProfile,
        setEditingProfile
    }
}
