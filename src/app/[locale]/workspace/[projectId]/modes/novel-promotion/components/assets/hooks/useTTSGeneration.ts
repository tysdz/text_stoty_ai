'use client'
import { logError as _ulogError } from '@/lib/logging/core'
import { useTranslations } from 'next-intl'

/**
 * useTTSGeneration - TTS localized text
 * localized text AssetsStage.tsx localized text
 * 
 * 🔥 V6.5 localized text：localized text useProjectAssets，localized text props drilling
 */

import { useState } from 'react'
import {
    useProjectAssets,
    useRefreshProjectAssets,
    useUpdateProjectCharacterVoiceSettings,
    useSaveProjectDesignedVoice,
} from '@/lib/query/hooks'

interface VoiceDesignCharacter {
    id: string
    name: string
    hasExistingVoice: boolean
}

interface UseTTSGenerationProps {
    projectId: string
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'object' && error !== null) {
        const message = (error as { message?: unknown }).message
        if (typeof message === 'string') return message
    }
    return fallback
}

export function useTTSGeneration({
    projectId
}: UseTTSGenerationProps) {
    const t = useTranslations('assets')
    // 🔥 localized text - localized text props drilling
    const { data: assets } = useProjectAssets(projectId)
    const characters = assets?.characters ?? []

    // 🔥 localized text
    const refreshAssets = useRefreshProjectAssets(projectId)
    const updateVoiceSettingsMutation = useUpdateProjectCharacterVoiceSettings(projectId)
    const saveDesignedVoiceMutation = useSaveProjectDesignedVoice(projectId)

    const [voiceDesignCharacter, setVoiceDesignCharacter] = useState<VoiceDesignCharacter | null>(null)

    // localized text - 🔥 localized text
    const handleVoiceChange = async (characterId: string, voiceType: string, voiceId: string, customVoiceUrl?: string) => {
        try {
            await updateVoiceSettingsMutation.mutateAsync({
                characterId,
                voiceType: voiceType as 'qwen-designed' | 'uploaded' | 'custom' | null,
                voiceId,
                customVoiceUrl,
            })

            // 🔥 localized text
            refreshAssets()
        } catch (error: unknown) {
            _ulogError('localized text:', getErrorMessage(error, t('common.unknownError')))
        }
    }

    // localized text AI localized text
    const handleOpenVoiceDesign = (characterId: string, characterName: string) => {
        const character = characters.find(c => c.id === characterId)
        setVoiceDesignCharacter({
            id: characterId,
            name: characterName,
            hasExistingVoice: !!character?.customVoiceUrl
        })
    }

    // save AI localized text
    const handleVoiceDesignSave = async (voiceId: string, audioBase64: string) => {
        if (!voiceDesignCharacter) return

        try {
            await saveDesignedVoiceMutation.mutateAsync({
                characterId: voiceDesignCharacter.id,
                voiceId,
                audioBase64,
            })
            refreshAssets()
            alert(t('tts.voiceDesignSaved', { name: voiceDesignCharacter.name }))
        } catch (error: unknown) {
            alert(t('tts.saveVoiceDesignFailed', { error: getErrorMessage(error, t('common.unknownError')) }))
        } finally {
            setVoiceDesignCharacter(null)
        }
    }

    // localized text
    const handleCloseVoiceDesign = () => {
        setVoiceDesignCharacter(null)
    }

    return {
        // 🔥 localized text characters localized text
        characters,
        voiceDesignCharacter,
        handleVoiceChange,
        handleOpenVoiceDesign,
        handleVoiceDesignSave,
        handleCloseVoiceDesign
    }
}
