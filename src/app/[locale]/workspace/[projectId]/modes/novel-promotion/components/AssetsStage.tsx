'use client'

import { useTranslations } from 'next-intl'
/**
 * localized text - localized text
 * containsTTSlocalized text
 * 
 * localized text v2:
 * - localized text hooks/useCharacterActions localized text hooks/useLocationActions
 * - localized text hooks/useBatchGeneration
 * - TTS/localized text hooks/useTTSGeneration
 * - localized text hooks/useAssetModals
 * - localized text hooks/useProfileManagement
 * - UIlocalized text CharacterSection, LocationSection, AssetToolbar, AssetModals localized text
 */

import { useState, useCallback, useMemo } from 'react'
// localized text useRouter localized text，localized text URL
import { Character, CharacterAppearance, NovelPromotionClip } from '@/types/project'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import {
  useAssetActions,
  useGenerateProjectCharacterImage,
  useGenerateProjectLocationImage,
  useAssets,
  useRefreshProjectAssets,
  useEpisodes,
  useEpisodeData,
} from '@/lib/query/hooks'
import {
  getAllClipsAssets,
  fuzzyMatchLocation,
} from './script-view/clip-asset-utils'

// Hooks
import { useCharacterActions } from './assets/hooks/useCharacterActions'
import { useLocationActions } from './assets/hooks/useLocationActions'
import { useBatchGeneration } from './assets/hooks/useBatchGeneration'
import { useTTSGeneration } from './assets/hooks/useTTSGeneration'
import { useAssetModals } from './assets/hooks/useAssetModals'
import { useProfileManagement } from './assets/hooks/useProfileManagement'
import { useAssetsCopyFromHub } from './assets/hooks/useAssetsCopyFromHub'
import { useAssetsGlobalActions } from './assets/hooks/useAssetsGlobalActions'
import { useAssetsImageEdit } from './assets/hooks/useAssetsImageEdit'

// Components
import CharacterSection from './assets/CharacterSection'
import LocationSection from './assets/LocationSection'
import AssetToolbar from './assets/AssetToolbar'
import AssetFilterBar, { type AssetKindFilter } from './assets/AssetFilterBar'
import AssetsStageStatusOverlays from './assets/AssetsStageStatusOverlays'
import AssetsStageModals from './assets/AssetsStageModals'

interface AssetsStageProps {
  projectId: string
  isAnalyzingAssets: boolean
  focusCharacterId?: string | null
  focusCharacterRequestId?: number
  // 🔥 localized text props localized text（localized text URL localized text）
  triggerGlobalAnalyze?: boolean
  onGlobalAnalyzeComplete?: () => void
}

export default function AssetsStage({
  projectId,
  isAnalyzingAssets,
  focusCharacterId = null,
  focusCharacterRequestId = 0,
  triggerGlobalAnalyze = false,
  onGlobalAnalyzeComplete
}: AssetsStageProps) {
  const { data: assets = [] } = useAssets({
    scope: 'project',
    projectId,
  })
  const characters = useMemo(
    () => assets.filter((asset) => asset.kind === 'character'),
    [assets],
  )
  const locations = useMemo(
    () => assets.filter((asset) => asset.kind === 'location'),
    [assets],
  )
  const props = useMemo(
    () => assets.filter((asset) => asset.kind === 'prop'),
    [assets],
  )
  const propAssetActions = useAssetActions({
    scope: 'project',
    projectId,
    kind: 'prop',
  })
  // 🔥 localized text React Query refresh，localized text onRefresh prop
  const refreshAssets = useRefreshProjectAssets(projectId)
  const onRefresh = useCallback(() => { refreshAssets() }, [refreshAssets])

  // 🔥 V6.6 localized text：localized text mutation hooks localized text onGenerateImage prop
  const generateCharacterImage = useGenerateProjectCharacterImage(projectId)
  const generateLocationImage = useGenerateProjectLocationImage(projectId)

  // 🔥 localized text - localized text mutation hooks localized text
  const handleGenerateImage = useCallback(async (
    type: 'character' | 'location' | 'prop',
    id: string,
    appearanceId?: string,
    count?: number,
  ) => {
    if (type === 'character' && appearanceId) {
      await generateCharacterImage.mutateAsync({ characterId: id, appearanceId, count })
    } else if (type === 'location') {
      await generateLocationImage.mutateAsync({ locationId: id, count })
    } else if (type === 'prop') {
      await propAssetActions.generate({ id, count })
    }
  }, [generateCharacterImage, generateLocationImage, propAssetActions])

  const t = useTranslations('assets')
  // localized text
  const totalAppearances = characters.reduce((sum, character) => sum + character.variants.length, 0)
  const totalLocations = locations.length
  const totalProps = props.length
  const totalAssets = totalAppearances + totalLocations + totalProps

  // localized text UI localized text
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null)
  const [kindFilter, setKindFilter] = useState<AssetKindFilter>('all')
  const [episodeFilter, setEpisodeFilter] = useState<string | null>(null)

  // localized text
  const { episodes } = useEpisodes(projectId)
  const episodeOptions = useMemo(
    () => episodes.map((ep) => ({ id: ep.id, episodeNumber: ep.episodeNumber, name: ep.name })),
    [episodes],
  )

  // localized text：localized text clips，localized text
  const { data: episodeData } = useEpisodeData(projectId, episodeFilter)
  const episodeClips = useMemo(() => {
    if (!episodeFilter || !episodeData) return null
    return ((episodeData as { clips?: NovelPromotionClip[] }).clips) ?? null
  }, [episodeFilter, episodeData])

  // localized text ID localized text
  const episodeAssetIds = useMemo(() => {
    if (!episodeClips) return null // null localized text
    const { allCharNames, allLocNames, allPropNames } = getAllClipsAssets(episodeClips)

    const charIds = new Set(
      characters
        .filter((c) => {
          const aliases = c.name.split('/').map((a) => a.trim())
          return aliases.some((alias) => allCharNames.has(alias)) || allCharNames.has(c.name)
        })
        .map((c) => c.id),
    )
    const locIds = new Set(
      locations
        .filter((l) => Array.from(allLocNames).some((clipLocName) => fuzzyMatchLocation(clipLocName, l.name)))
        .map((l) => l.id),
    )
    const propIds = new Set(
      props
        .filter((p) => Array.from(allPropNames).some((clipPropName) => clipPropName.toLowerCase() === p.name.toLowerCase()))
        .map((p) => p.id),
    )

    return { charIds, locIds, propIds }
  }, [episodeClips, characters, locations, props])

  // localized text（localized text、localized text）
  const filteredCharacters = useMemo(
    () => episodeAssetIds ? characters.filter((c) => episodeAssetIds.charIds.has(c.id)) : characters,
    [characters, episodeAssetIds],
  )
  const filteredLocations = useMemo(
    () => episodeAssetIds ? locations.filter((l) => episodeAssetIds.locIds.has(l.id)) : locations,
    [locations, episodeAssetIds],
  )
  const filteredProps = useMemo(
    () => episodeAssetIds ? props.filter((p) => episodeAssetIds.propIds.has(p.id)) : props,
    [props, episodeAssetIds],
  )

  // localized text
  const filteredAppearances = filteredCharacters.reduce((sum, character) => sum + character.variants.length, 0)
  const filteredLocCount = filteredLocations.length
  const filteredPropCount = filteredProps.length
  const filteredTotal = filteredAppearances + filteredLocCount + filteredPropCount

  // localized text：localized text
  const getAppearances = (character: Character): CharacterAppearance[] => {
    return character.appearances || []
  }

  // localized text
  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success', duration = 3000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [])

  // === localized text Hooks ===

  // 🔥 V6.5 localized text：hooks localized text useProjectAssets，localized text characters/locations

  // localized text
  const {
    isBatchSubmitting,
    activeTaskKeys,
    registerTransientTaskKey,
    clearTransientTaskKey,
  } = useBatchGeneration({
    projectId,
    handleGenerateImage
  })

  const {
    isGlobalAnalyzing,
    globalAnalyzingState,
    handleGlobalAnalyze,
  } = useAssetsGlobalActions({
    projectId,
    triggerGlobalAnalyze,
    onGlobalAnalyzeComplete,
    onRefresh,
    showToast,
    t,
  })

  const {
    copyFromGlobalTarget,
    isGlobalCopyInFlight,
    handleCopyFromGlobal,
    handleCopyLocationFromGlobal,
    handleCopyPropFromGlobal,
    handleVoiceSelectFromHub,
    handleConfirmCopyFromGlobal,
    handleCloseCopyPicker,
  } = useAssetsCopyFromHub({
    projectId,
    onRefresh,
    showToast,
  })

  // localized text
  const {
    handleDeleteCharacter,
    handleDeleteAppearance,
    handleSelectCharacterImage,
    handleConfirmSelection,
    handleRegenerateSingleCharacter,
    handleRegenerateCharacterGroup
  } = useCharacterActions({
    projectId,
    showToast
  })

  // localized text
  const {
    handleDeleteLocation,
    handleSelectLocationImage,
    handleConfirmLocationSelection,
    handleRegenerateSingleLocation,
    handleRegenerateLocationGroup
  } = useLocationActions({
    projectId,
    showToast
  })
  const {
    handleDeleteLocation: handleDeleteProp,
    handleSelectLocationImage: handleSelectPropImage,
    handleConfirmLocationSelection: handleConfirmPropSelection,
    handleRegenerateSingleLocation: handleRegenerateSingleProp,
    handleRegenerateLocationGroup: handleRegeneratePropGroup,
  } = useLocationActions({
    projectId,
    assetType: 'prop',
    showToast,
  })

  // TTS/localized text
  const {
    voiceDesignCharacter,
    handleVoiceChange,
    handleOpenVoiceDesign,
    handleVoiceDesignSave,
    handleCloseVoiceDesign
  } = useTTSGeneration({
    projectId
  })

  // localized text
  const {
    editingAppearance,
    editingLocation,
    editingProp,
    showAddCharacter,
    showAddLocation,
    showAddProp,
    imageEditModal,
    characterImageEditModal,
    setShowAddCharacter,
    setShowAddLocation,
    setShowAddProp,
    handleEditAppearance,
    handleEditLocation,
    handleEditProp,
    handleOpenLocationImageEdit,
    handleOpenCharacterImageEdit,
    closeEditingAppearance,
    closeEditingLocation,
    closeEditingProp,
    closeAddCharacter,
    closeAddLocation,
    closeAddProp,
    closeImageEditModal,
    closeCharacterImageEditModal
  } = useAssetModals({
    projectId
  })
  // localized text
  const {
    unconfirmedCharacters,
    isConfirmingCharacter,
    deletingCharacterId,
    batchConfirming,
    editingProfile,
    handleEditProfile,
    handleConfirmProfile,
    handleBatchConfirm,
    handleDeleteProfile,
    setEditingProfile
  } = useProfileManagement({
    projectId,
    showToast
  })
  const batchConfirmingState = batchConfirming
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'modify',
      resource: 'image',
      hasOutput: false,
    })
    : null

  const {
    handleUndoCharacter,
    handleUndoLocation,
    handleLocationImageEdit,
    handleCharacterImageEdit,
    handleUpdateAppearanceDescription,
    handleUpdateLocationDescription,
  } = useAssetsImageEdit({
    projectId,
    t,
    showToast,
    onRefresh,
    editingAppearance,
    editingLocation,
    imageEditModal,
    characterImageEditModal,
    closeEditingAppearance,
    closeEditingLocation,
    closeImageEditModal,
    closeCharacterImageEditModal,
  })

  return (
    <div className="space-y-4">
      <AssetsStageStatusOverlays
        toast={toast}
        onCloseToast={() => setToast(null)}
        isGlobalAnalyzing={isGlobalAnalyzing}
        globalAnalyzingState={globalAnalyzingState}
        globalAnalyzingTitle={t('toolbar.globalAnalyzing')}
        globalAnalyzingHint={t('toolbar.globalAnalyzingHint')}
        globalAnalyzingTip={t('toolbar.globalAnalyzingTip')}
      />

      {/* localized text */}
      <AssetToolbar
        projectId={projectId}
        totalAssets={totalAssets}
        totalAppearances={totalAppearances}
        totalLocations={totalLocations}
        totalProps={totalProps}
        isBatchSubmitting={isBatchSubmitting}
        isAnalyzingAssets={isAnalyzingAssets}
        isGlobalAnalyzing={isGlobalAnalyzing}
        onGlobalAnalyze={handleGlobalAnalyze}
        episodeId={episodeFilter}
        onEpisodeChange={setEpisodeFilter}
        episodes={episodeOptions}
      />

      {/* localized text */}
      <AssetFilterBar
        kindFilter={kindFilter}
        onKindFilterChange={setKindFilter}
        counts={{
          all: filteredTotal,
          character: filteredAppearances,
          location: filteredLocCount,
          prop: filteredPropCount,
        }}
      />

      {(kindFilter === 'all' || kindFilter === 'character') && (
          <CharacterSection
            key="character"
            projectId={projectId}
            focusCharacterId={focusCharacterId}
            focusCharacterRequestId={focusCharacterRequestId}
            activeTaskKeys={activeTaskKeys}
            onClearTaskKey={clearTransientTaskKey}
            onRegisterTransientTaskKey={registerTransientTaskKey}
            isAnalyzingAssets={isAnalyzingAssets}
            onAddCharacter={() => setShowAddCharacter(true)}
            onDeleteCharacter={handleDeleteCharacter}
            onDeleteAppearance={handleDeleteAppearance}
            onEditAppearance={handleEditAppearance}
            handleGenerateImage={handleGenerateImage}
            onSelectImage={handleSelectCharacterImage}
            onConfirmSelection={handleConfirmSelection}
            onRegenerateSingle={handleRegenerateSingleCharacter}
            onRegenerateGroup={handleRegenerateCharacterGroup}
            onUndo={handleUndoCharacter}
            onImageClick={setPreviewImage}
            onImageEdit={(charId, appIdx, imgIdx, name) => handleOpenCharacterImageEdit(charId, appIdx, imgIdx, name)}
            onVoiceChange={(characterId, customVoiceUrl) => handleVoiceChange(characterId, 'custom', characterId, customVoiceUrl)}
            onVoiceDesign={handleOpenVoiceDesign}
            onVoiceSelectFromHub={handleVoiceSelectFromHub}
            onCopyFromGlobal={handleCopyFromGlobal}
            getAppearances={getAppearances}
            filterIds={episodeAssetIds?.charIds ?? null}
            // 🔥 V7：localized text CharacterSection
            unconfirmedCharacters={unconfirmedCharacters}
            isConfirmingCharacter={isConfirmingCharacter}
            deletingCharacterId={deletingCharacterId}
            batchConfirming={batchConfirming}
            batchConfirmingState={batchConfirmingState}
            onBatchConfirm={handleBatchConfirm}
            onEditProfile={handleEditProfile}
            onConfirmProfile={handleConfirmProfile}
            onUseExistingProfile={handleCopyFromGlobal}
            onDeleteProfile={handleDeleteProfile}
          />
      )}
      {(kindFilter === 'all' || kindFilter === 'location') && (
          <LocationSection
            key="location"
            projectId={projectId}
            activeTaskKeys={activeTaskKeys}
            onClearTaskKey={clearTransientTaskKey}
            onRegisterTransientTaskKey={registerTransientTaskKey}
            onAddLocation={() => setShowAddLocation(true)}
            onDeleteLocation={handleDeleteLocation}
            onEditLocation={handleEditLocation}
            handleGenerateImage={handleGenerateImage}
            onSelectImage={handleSelectLocationImage}
            onConfirmSelection={handleConfirmLocationSelection}
            onRegenerateSingle={handleRegenerateSingleLocation}
            onRegenerateGroup={handleRegenerateLocationGroup}
            onUndo={handleUndoLocation}
            onImageClick={setPreviewImage}
            onImageEdit={(locId, imgIdx) => handleOpenLocationImageEdit(locId, imgIdx)}
            onCopyFromGlobal={handleCopyLocationFromGlobal}
            filterIds={episodeAssetIds?.locIds ?? null}
          />
      )}
      {(kindFilter === 'all' || kindFilter === 'prop') && (
          <LocationSection
            key="prop"
            projectId={projectId}
            assetType="prop"
            activeTaskKeys={activeTaskKeys}
            onClearTaskKey={clearTransientTaskKey}
            onRegisterTransientTaskKey={registerTransientTaskKey}
            onAddLocation={() => setShowAddProp(true)}
            onDeleteLocation={handleDeleteProp}
            onEditLocation={handleEditProp}
            handleGenerateImage={handleGenerateImage}
            onSelectImage={handleSelectPropImage}
            onConfirmSelection={handleConfirmPropSelection}
            onRegenerateSingle={handleRegenerateSingleProp}
            onRegenerateGroup={handleRegeneratePropGroup}
            onUndo={(propId) => {
              void propAssetActions.revertRender({ id: propId }).catch(() => undefined)
            }}
            onImageClick={setPreviewImage}
            onImageEdit={() => undefined}
            onCopyFromGlobal={handleCopyPropFromGlobal}
            filterIds={episodeAssetIds?.propIds ?? null}
          />
      )}

      <AssetsStageModals
        projectId={projectId}
        onRefresh={onRefresh}
        onClosePreview={() => setPreviewImage(null)}
        handleGenerateImage={handleGenerateImage}
        handleUpdateAppearanceDescription={handleUpdateAppearanceDescription}
        handleUpdateLocationDescription={handleUpdateLocationDescription}
        handleLocationImageEdit={handleLocationImageEdit}
        handleCharacterImageEdit={handleCharacterImageEdit}
        handleCloseVoiceDesign={handleCloseVoiceDesign}
        handleVoiceDesignSave={handleVoiceDesignSave}
        handleCloseCopyPicker={handleCloseCopyPicker}
        handleConfirmCopyFromGlobal={handleConfirmCopyFromGlobal}
        handleConfirmProfile={handleConfirmProfile}
        closeEditingAppearance={closeEditingAppearance}
        closeEditingLocation={closeEditingLocation}
        closeEditingProp={closeEditingProp}
        closeAddCharacter={closeAddCharacter}
        closeAddLocation={closeAddLocation}
        closeAddProp={closeAddProp}
        closeImageEditModal={closeImageEditModal}
        closeCharacterImageEditModal={closeCharacterImageEditModal}
        isConfirmingCharacter={isConfirmingCharacter}
        setEditingProfile={setEditingProfile}
        previewImage={previewImage}
        imageEditModal={imageEditModal}
        characterImageEditModal={characterImageEditModal}
        editingAppearance={editingAppearance}
        editingLocation={editingLocation}
        editingProp={editingProp}
        showAddCharacter={showAddCharacter}
        showAddLocation={showAddLocation}
        showAddProp={showAddProp}
        voiceDesignCharacter={voiceDesignCharacter}
        editingProfile={editingProfile}
        copyFromGlobalTarget={copyFromGlobalTarget}
        isGlobalCopyInFlight={isGlobalCopyInFlight}
      />
    </div>
  )
}
