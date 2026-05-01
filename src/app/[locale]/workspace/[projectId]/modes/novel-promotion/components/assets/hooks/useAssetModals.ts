'use client'

/**
 * useAssetModals - localized text
 * localized text AssetsStage.tsx localized text
 * 
 * 🔥 V6.5 localized text：localized text useProjectAssets，localized text props drilling
 */

import { useState, useCallback } from 'react'
import { CharacterAppearance } from '@/types/project'
import { useProjectAssets, type Character, type Location, type Prop } from '@/lib/query/hooks'

// localized text
interface EditingAppearance {
    characterId: string
    characterName: string
    appearanceId: string  // UUID
    description: string
    descriptionIndex?: number
    introduction?: string | null  // localized text
}

interface EditingLocation {
    locationId: string
    locationName: string
    description: string
}

interface EditingProp {
    propId: string
    propName: string
    summary: string
    variantId?: string
}

interface ImageEditModal {
    locationId: string
    imageIndex: number
    locationName: string
}

interface CharacterImageEditModal {
    characterId: string
    appearanceId: string
    imageIndex: number
    characterName: string
}

interface UseAssetModalsProps {
    projectId: string
}

export function useAssetModals({
    projectId
}: UseAssetModalsProps) {
    // 🔥 localized text - localized text props drilling
    const { data: assets } = useProjectAssets(projectId)
    const characters = assets?.characters ?? []
    const locations = assets?.locations ?? []
    const props = assets?.props ?? []

    // localized text（localized text）
    const getAppearances = useCallback((character: Character): CharacterAppearance[] => {
        return character.appearances || []
    }, [])

    // localized text
    const [editingAppearance, setEditingAppearance] = useState<EditingAppearance | null>(null)
    // localized text
    const [editingLocation, setEditingLocation] = useState<EditingLocation | null>(null)
    const [editingProp, setEditingProp] = useState<EditingProp | null>(null)
    // localized text
    const [showAddCharacter, setShowAddCharacter] = useState(false)
    const [showAddLocation, setShowAddLocation] = useState(false)
    const [showAddProp, setShowAddProp] = useState(false)
    // localized text
    const [imageEditModal, setImageEditModal] = useState<ImageEditModal | null>(null)
    const [characterImageEditModal, setCharacterImageEditModal] = useState<CharacterImageEditModal | null>(null)
    // localized text
    const [showAssetSettingModal, setShowAssetSettingModal] = useState(false)

    // localized text
    const handleEditCharacterDescription = (characterId: string, appearanceIndex: number, descriptionIndex: number) => {
        const character = characters.find(c => c.id === characterId)
        if (!character) return
        const appearances = getAppearances(character)
        const appearance = appearances.find(a => a.appearanceIndex === appearanceIndex)
        if (!appearance) return

        const descriptions = appearance.descriptions || [appearance.description || '']
        const description = descriptions[descriptionIndex] || appearance.description || ''

        setEditingAppearance({
            characterId,
            characterName: character.name,
            appearanceId: appearance.id,
            description: description,
            descriptionIndex
        })
    }

    // localized text
    const handleEditLocationDescription = (locationId: string, imageIndex: number) => {
        const location = locations.find(l => l.id === locationId)
        if (!location) return

        const image = location.images?.find(img => img.imageIndex === imageIndex)
        const description = image?.description || ''

        setEditingLocation({
            locationId,
            locationName: location.name,
            description: description
        })
    }

    // localized text
    const handleEditAppearance = (characterId: string, characterName: string, appearance: CharacterAppearance, introduction?: string | null) => {
        setEditingAppearance({
            characterId,
            characterName,
            appearanceId: appearance.id,
            description: appearance.description || '',
            introduction
        })
    }

    // localized text
    const handleEditLocation = (location: Location) => {
        const firstImage = location.images?.[0]
        setEditingLocation({
            locationId: location.id,
            locationName: location.name,
            description: firstImage?.description || ''
        })
    }

    const handleEditProp = (prop: Prop) => {
        setEditingProp({
            propId: prop.id,
            propName: prop.name,
            summary: prop.summary || prop.images?.[0]?.description || '',
            variantId: prop.images?.[0]?.id,
        })
    }

    // localized text
    const handleOpenLocationImageEdit = (locationId: string, imageIndex: number) => {
        const location = locations.find(l => l.id === locationId)
        if (!location) return

        setImageEditModal({
            locationId,
            imageIndex,
            locationName: location.name
        })
    }

    // localized text
    const handleOpenCharacterImageEdit = (characterId: string, appearanceId: string, imageIndex: number, characterName: string) => {
        setCharacterImageEditModal({
            characterId,
            appearanceId,
            imageIndex,
            characterName
        })
    }

    // localized text
    const closeEditingAppearance = () => setEditingAppearance(null)
    const closeEditingLocation = () => setEditingLocation(null)
    const closeEditingProp = () => setEditingProp(null)
    const closeAddCharacter = () => setShowAddCharacter(false)
    const closeAddLocation = () => setShowAddLocation(false)
    const closeAddProp = () => setShowAddProp(false)
    const closeImageEditModal = () => setImageEditModal(null)
    const closeCharacterImageEditModal = () => setCharacterImageEditModal(null)
    const closeAssetSettingModal = () => setShowAssetSettingModal(false)

    return {
        // 🔥 localized text
        characters,
        locations,
        props,
        getAppearances,
        // localized text
        editingAppearance,
        editingLocation,
        editingProp,
        showAddCharacter,
        showAddLocation,
        showAddProp,
        imageEditModal,
        characterImageEditModal,
        showAssetSettingModal,
        // Setters
        setEditingAppearance,
        setEditingLocation,
        setEditingProp,
        setShowAddCharacter,
        setShowAddLocation,
        setShowAddProp,
        setImageEditModal,
        setCharacterImageEditModal,
        setShowAssetSettingModal,
        // Handlers
        handleEditCharacterDescription,
        handleEditLocationDescription,
        handleEditAppearance,
        handleEditLocation,
        handleEditProp,
        handleOpenLocationImageEdit,
        handleOpenCharacterImageEdit,
        // Close helpers
        closeEditingAppearance,
        closeEditingLocation,
        closeEditingProp,
        closeAddCharacter,
        closeAddLocation,
        closeAddProp,
        closeImageEditModal,
        closeCharacterImageEditModal,
        closeAssetSettingModal
    }
}
