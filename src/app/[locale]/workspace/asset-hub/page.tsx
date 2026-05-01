'use client'
import { logError as _ulogError } from '@/lib/logging/core'
import { apiFetch } from '@/lib/api-fetch'
import JSZip from 'jszip'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import Navbar from '@/components/Navbar'
import { FolderSidebar } from './components/FolderSidebar'
import { AssetGrid } from './components/AssetGrid'
import { CharacterCreationModal, LocationCreationModal, PropCreationModal, CharacterEditModal, LocationEditModal, PropEditModal } from '@/components/shared/assets'
import { FolderModal } from './components/FolderModal'
import ImagePreviewModal from '@/components/ui/ImagePreviewModal'
import ImageEditModal from '@/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/assets/ImageEditModal'
import VoiceDesignDialog from './components/VoiceDesignDialog'
import VoiceCreationModal from './components/VoiceCreationModal'
import VoicePickerDialog from './components/VoicePickerDialog'
import {
    useAssets,
    useAssetActions,
    useRefreshAssets,
    useGlobalFolders,
    useSSE,
} from '@/lib/query/hooks'
import { queryKeys } from '@/lib/query/keys'
import { AppIcon } from '@/components/ui/icons'
import { Link } from '@/i18n/navigation'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'

export default function AssetHubPage() {
    const t = useTranslations('assetHub')
    const queryClient = useQueryClient()
    const { count: characterGenerationCount } = useImageGenerationCount('character')
    const { count: locationGenerationCount } = useImageGenerationCount('location')

    // localized text
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

    // localized text React Query localized text
    const { data: folders = [], isLoading: foldersLoading } = useGlobalFolders()
    const { data: assets = [], isLoading: assetsLoading } = useAssets({
        scope: 'global',
        folderId: selectedFolderId,
    })
    const characterActions = useAssetActions({ scope: 'global', kind: 'character' })
    const locationActions = useAssetActions({ scope: 'global', kind: 'location' })
    const refreshAssets = useRefreshAssets({ scope: 'global' })

    const loading = foldersLoading || assetsLoading
    useSSE({ projectId: 'global-asset-hub', enabled: true })

    // localized text
    const [showAddCharacter, setShowAddCharacter] = useState(false)
    const [showAddLocation, setShowAddLocation] = useState(false)
    const [showAddProp, setShowAddProp] = useState(false)
    const [showFolderModal, setShowFolderModal] = useState(false)
    const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [imageEditModal, setImageEditModal] = useState<{
        type: 'character' | 'location'
        id: string
        name: string
        imageIndex: number
        appearanceIndex?: number
    } | null>(null)

    const [voiceDesignCharacter, setVoiceDesignCharacter] = useState<{
        id: string
        name: string
        hasExistingVoice: boolean
    } | null>(null)

    // localized text
    const [showAddVoice, setShowAddVoice] = useState(false)
    const [voicePickerCharacterId, setVoicePickerCharacterId] = useState<string | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)


    // localized text
    const [characterEditModal, setCharacterEditModal] = useState<{
        characterId: string
        characterName: string
        appearanceId: string
        appearanceIndex: number
        changeReason: string
        artStyle: string | null
        description: string
    } | null>(null)

    // localized text
    const [locationEditModal, setLocationEditModal] = useState<{
        locationId: string
        locationName: string
        summary: string
        imageIndex: number
        artStyle: string | null
        description: string
    } | null>(null)
    const [propEditModal, setPropEditModal] = useState<{
        propId: string
        propName: string
        summary: string
        variantId?: string
    } | null>(null)

    // localized text
    const handleCreateFolder = async (name: string) => {
        try {
            const res = await apiFetch('/api/asset-hub/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.folders() })
                setShowFolderModal(false)
            }
        } catch (error) {
            _ulogError('localized text:', error)
        }
    }

    // localized text
    const handleUpdateFolder = async (folderId: string, name: string) => {
        try {
            const res = await apiFetch(`/api/asset-hub/folders/${folderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.folders() })
                setEditingFolder(null)
                setShowFolderModal(false)
            }
        } catch (error) {
            _ulogError('localized text:', error)
        }
    }

    // localized text
    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm(t('confirmDeleteFolder'))) return

        try {
            const res = await apiFetch(`/api/asset-hub/folders/${folderId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                if (selectedFolderId === folderId) {
                    setSelectedFolderId(null)
                }
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.all() })
            }
        } catch (error) {
            _ulogError('localized text:', error)
        }
    }

    // localized text
    const handleOpenImageEdit = (type: 'character' | 'location', id: string, name: string, imageIndex: number, appearanceIndex?: number) => {
        setImageEditModal({ type, id, name, imageIndex, appearanceIndex })
    }

    // localized text - localized text mutation
    const handleImageEdit = async (modifyPrompt: string, extraImageUrls?: string[]) => {
        if (!imageEditModal) return

        const { type, id, imageIndex, appearanceIndex } = imageEditModal
        setImageEditModal(null)

        if (type === 'character' && appearanceIndex !== undefined) {
            void characterActions.modifyRender({
                id,
                appearanceIndex,
                imageIndex,
                modifyPrompt,
                extraImageUrls
            }).catch(() => {
                alert(t('editFailed'))
            })
        } else if (type === 'location') {
            void locationActions.modifyRender({
                id,
                imageIndex,
                modifyPrompt,
                extraImageUrls
            }).catch(() => {
                alert(t('editFailed'))
            })
        }
    }

    // localized text AI localized text
    const handleOpenVoiceDesign = (characterId: string, characterName: string) => {
        const character = assets.find((asset) => asset.kind === 'character' && asset.id === characterId)
        setVoiceDesignCharacter({
            id: characterId,
            name: characterName,
            hasExistingVoice: character?.kind === 'character' ? !!character.voice.customVoiceUrl : false,
        })
    }

    // save AI localized text
    const handleVoiceDesignSave = async (voiceId: string, audioBase64: string) => {
        if (!voiceDesignCharacter) return

        try {
            const res = await apiFetch('/api/asset-hub/character-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterId: voiceDesignCharacter.id,
                    voiceId,
                    audioBase64
                })
            })

            if (res.ok) {
                alert(t('voiceDesignSaved', { name: voiceDesignCharacter.name }))
                queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
                refreshAssets()
            } else {
                const data = await res.json()
                alert(
                    typeof data.error === 'string'
                        ? t('saveVoiceFailedDetail', { error: data.error })
                        : t('saveVoiceFailed'),
                )
            }
        } catch (error) {
            _ulogError('localized text:', error)
            alert(t('saveVoiceFailed'))
        }
    }

    // localized text
    const handleOpenCharacterEdit = (character: unknown, appearance: unknown) => {
        const typedCharacter = character as {
            id: string
            name: string
            appearances: Array<{
                id: string
                appearanceIndex: number
                changeReason: string
                description: string | null
            }>
        }
        const typedAppearance = appearance as {
            id: string
            appearanceIndex: number
            changeReason: string
            artStyle?: string | null
            description: string | null
        }
        setCharacterEditModal({
            characterId: typedCharacter.id,
            characterName: typedCharacter.name,
            appearanceId: typedAppearance.id,
            appearanceIndex: typedAppearance.appearanceIndex,
            changeReason: typedAppearance.changeReason || t('appearanceLabel', { index: typedAppearance.appearanceIndex }),
            artStyle: typedAppearance.artStyle || null,
            description: typedAppearance.description || ''
        })
    }

    // localized text
    const handleOpenLocationEdit = (location: unknown, imageIndex: number) => {
        const typedLocation = location as {
            id: string
            name: string
            summary: string | null
            artStyle: string | null
            images: Array<{ imageIndex: number; description: string | null }>
        }
        const image = typedLocation.images.find(img => img.imageIndex === imageIndex)
        setLocationEditModal({
            locationId: typedLocation.id,
            locationName: typedLocation.name,
            summary: typedLocation.summary || '',
            imageIndex: imageIndex,
            artStyle: typedLocation.artStyle || null,
            description: image?.description || typedLocation.summary || ''
        })
    }

    const handleOpenPropEdit = (prop: unknown, imageIndex: number) => {
        const typedProp = prop as {
            id: string
            name: string
            summary: string | null
            images: Array<{ id: string; imageIndex: number }>
        }
        const variant = typedProp.images.find((image) => image.imageIndex === imageIndex)
        setPropEditModal({
            propId: typedProp.id,
            propName: typedProp.name,
            summary: typedProp.summary || '',
            variantId: variant?.id,
        })
    }

    // localized text
    const handleCharacterEditGenerate = async () => {
        if (!characterEditModal) return

        try {
            await characterActions.generate({
                id: characterEditModal.characterId,
                appearanceIndex: characterEditModal.appearanceIndex,
                artStyle: characterEditModal.artStyle || undefined,
                count: characterGenerationCount,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
        } catch (error) {
            _ulogError('localized text:', error)
        }
    }

    // localized text
    const handleLocationEditGenerate = async () => {
        if (!locationEditModal) return

        try {
            await locationActions.generate({
                id: locationEditModal.locationId,
                artStyle: locationEditModal.artStyle || undefined,
                count: locationGenerationCount,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.locations() })
        } catch (error) {
            _ulogError('localized text:', error)
        }
    }

    // localized text
    const handleVoiceSelect = async (voice: { id: string; customVoiceUrl: string | null }) => {
        if (!voicePickerCharacterId) return

        try {
            await characterActions.bindVoice({
                characterId: voicePickerCharacterId,
                globalVoiceId: voice.id,
                customVoiceUrl: voice.customVoiceUrl,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
            setVoicePickerCharacterId(null)
        } catch (error) {
            _ulogError('localized text:', error)
            alert(t('bindVoiceFailed'))
        }
    }

    // localized text
    const handleDownloadAll = async () => {
        // localized text
        const imageEntries: Array<{ filename: string; url: string }> = []

        // localized text：localized text
        for (const asset of assets) {
            if (asset.kind !== 'character') continue
            for (const variant of asset.variants) {
                const selectedRender = variant.renders.find((render) => render.isSelected) ?? variant.renders[0]
                const url = selectedRender?.imageUrl
                if (!url) continue
                const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
                const filename = variant.index === 0
                    ? `characters/${safeName}.jpg`
                    : `characters/${safeName}_appearance${variant.index}.jpg`
                imageEntries.push({ filename, url })
            }
        }

        // localized text：localized text
        for (const asset of assets) {
            if (asset.kind !== 'location') continue
            for (const variant of asset.variants) {
                const render = variant.renders[0]
                const url = render?.imageUrl
                if (!url) continue
                const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
                const filename = asset.variants.length <= 1
                    ? `locations/${safeName}.jpg`
                    : `locations/${safeName}_${variant.index + 1}.jpg`
                imageEntries.push({ filename, url })
            }
        }

        for (const asset of assets) {
            if (asset.kind !== 'prop') continue
            for (const variant of asset.variants) {
                const render = variant.renders[0]
                const url = render?.imageUrl
                if (!url) continue
                const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
                const filename = asset.variants.length <= 1
                    ? `props/${safeName}.jpg`
                    : `props/${safeName}_${variant.index + 1}.jpg`
                imageEntries.push({ filename, url })
            }
        }

        if (imageEntries.length === 0) {
            alert(t('downloadEmpty'))
            return
        }

        setIsDownloading(true)
        try {
            const zip = new JSZip()
            // localized text fetch localized text
            await Promise.all(
                imageEntries.map(async ({ filename, url }) => {
                    try {
                        const response = await fetch(url)
                        if (!response.ok) return
                        const blob = await response.blob()
                        zip.file(filename, blob)
                    } catch {
                        // localized text
                    }
                })
            )
            const content = await zip.generateAsync({ type: 'blob' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(content)
            link.download = `asset-hub_${new Date().toISOString().slice(0, 10)}.zip`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        } catch (error) {
            _ulogError('localized text:', error)
            alert(t('downloadFailed'))
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className="glass-page min-h-screen">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* localized text */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--glass-text-primary)]">{t('title')}</h1>
                    <p className="text-sm text-[var(--glass-text-secondary)] mt-1">{t('description')}</p>
                    <p className="text-xs text-[var(--glass-text-tertiary)] mt-2 flex items-center gap-1">
                        <AppIcon name="info" className="w-3.5 h-3.5" />
                        {t('modelHint')}
                        <Link href={{ pathname: '/profile' }} className="text-[var(--glass-tone-info-fg)] hover:underline">{t('modelHintLink')}</Link>
                        {t('modelHintSuffix')}
                    </p>
                </div>

                <div className="flex gap-6">
                    {/* localized text */}
                    <FolderSidebar
                        folders={folders}
                        selectedFolderId={selectedFolderId}
                        onSelectFolder={setSelectedFolderId}
                        onCreateFolder={() => {
                            setEditingFolder(null)
                            setShowFolderModal(true)
                        }}
                        onEditFolder={(folder) => {
                            setEditingFolder(folder)
                            setShowFolderModal(true)
                        }}
                        onDeleteFolder={handleDeleteFolder}
                    />

                    {/* localized text */}
                    <AssetGrid
                        assets={assets}
                        loading={loading}
                        onAddCharacter={() => setShowAddCharacter(true)}
                        onAddLocation={() => setShowAddLocation(true)}
                        onAddProp={() => setShowAddProp(true)}
                        onAddVoice={() => setShowAddVoice(true)}
                        onDownloadAll={handleDownloadAll}
                        isDownloading={isDownloading}
                        selectedFolderId={selectedFolderId}
                        onImageClick={setPreviewImage}
                        onImageEdit={handleOpenImageEdit}
                        onVoiceDesign={handleOpenVoiceDesign}
                        onCharacterEdit={handleOpenCharacterEdit}
                        onLocationEdit={handleOpenLocationEdit}
                        onPropEdit={handleOpenPropEdit}
                        onVoiceSelect={(characterId) => setVoicePickerCharacterId(characterId)}
                    />
                </div>
            </div>

            {/* localized text */}
            {showAddCharacter && (
                <CharacterCreationModal
                    mode="asset-hub"
                    folderId={selectedFolderId}
                    onClose={() => setShowAddCharacter(false)}
                    onSuccess={() => {
                        setShowAddCharacter(false)
                        queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.characters() })
                        refreshAssets()
                    }}
                />
            )}

            {/* localized text */}
            {showAddLocation && (
                <LocationCreationModal
                    mode="asset-hub"
                    folderId={selectedFolderId}
                    onClose={() => setShowAddLocation(false)}
                    onSuccess={() => {
                        setShowAddLocation(false)
                        queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.locations() })
                        refreshAssets()
                    }}
                />
            )}

            {showAddProp && (
                <PropCreationModal
                    mode="asset-hub"
                    folderId={selectedFolderId}
                    onClose={() => setShowAddProp(false)}
                    onSuccess={() => {
                        setShowAddProp(false)
                        refreshAssets()
                    }}
                />
            )}

            {/* localized text */}
            {showFolderModal && (
                <FolderModal
                    folder={editingFolder}
                    onClose={() => {
                        setShowFolderModal(false)
                        setEditingFolder(null)
                    }}
                    onSave={(name) => {
                        if (editingFolder) {
                            handleUpdateFolder(editingFolder.id, name)
                        } else {
                            handleCreateFolder(name)
                        }
                    }}
                />
            )}

            {/* localized text */}
            {previewImage && (
                <ImagePreviewModal
                    imageUrl={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}

            {/* localized text */}
            {imageEditModal && (
                <ImageEditModal
                    type={imageEditModal.type}
                    name={imageEditModal.name}
                    onClose={() => setImageEditModal(null)}
                    onConfirm={handleImageEdit}
                />
            )}

            {/* AI localized text */}
            {voiceDesignCharacter && (
                <VoiceDesignDialog
                    isOpen={!!voiceDesignCharacter}
                    speaker={voiceDesignCharacter.name}
                    hasExistingVoice={voiceDesignCharacter.hasExistingVoice}
                    onClose={() => setVoiceDesignCharacter(null)}
                    onSave={handleVoiceDesignSave}
                />
            )}

            {/* localized text */}
            {characterEditModal && (
                <CharacterEditModal
                    mode="asset-hub"
                    characterId={characterEditModal.characterId}
                    characterName={characterEditModal.characterName}
                    appearanceId={characterEditModal.appearanceId}
                    appearanceIndex={characterEditModal.appearanceIndex}
                    changeReason={characterEditModal.changeReason}
                    description={characterEditModal.description}
                    onClose={() => setCharacterEditModal(null)}
                    onSave={handleCharacterEditGenerate}
                />
            )}

            {/* localized text */}
            {locationEditModal && (
                <LocationEditModal
                    mode="asset-hub"
                    locationId={locationEditModal.locationId}
                    locationName={locationEditModal.locationName}
                    summary={locationEditModal.summary}
                    imageIndex={locationEditModal.imageIndex}
                    description={locationEditModal.description}
                    onClose={() => setLocationEditModal(null)}
                    onSave={handleLocationEditGenerate}
                />
            )}

            {propEditModal && (
                <PropEditModal
                    mode="asset-hub"
                    propId={propEditModal.propId}
                    propName={propEditModal.propName}
                    summary={propEditModal.summary}
                    variantId={propEditModal.variantId}
                    onClose={() => setPropEditModal(null)}
                    onRefresh={refreshAssets}
                />
            )}

            {/* localized text */}
            {showAddVoice && (
                <VoiceCreationModal
                    isOpen={showAddVoice}
                    folderId={selectedFolderId}
                    onClose={() => setShowAddVoice(false)}
                    onSuccess={() => {
                        setShowAddVoice(false)
                        queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.voices() })
                        refreshAssets()
                    }}
                />
            )}

            {/* localized text */}
            {voicePickerCharacterId && (
                <VoicePickerDialog
                    isOpen={!!voicePickerCharacterId}
                    onClose={() => setVoicePickerCharacterId(null)}
                    onSelect={handleVoiceSelect}
                />
            )}
        </div>
    )
}
