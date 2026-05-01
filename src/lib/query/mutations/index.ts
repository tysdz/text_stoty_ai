/**
 * Mutations localized text
 */

// ==================== Asset Hub (localized text) ====================
export {
    // localized text
    useGenerateCharacterImage,
    useModifyCharacterImage,
    useSelectCharacterImage,
    useUndoCharacterImage,
    useUploadCharacterImage,
    useDeleteCharacter,
    useDeleteCharacterAppearance,
    useUploadCharacterVoice,
    // localized text
    useGenerateLocationImage,
    useModifyLocationImage,
    useSelectLocationImage,
    useUndoLocationImage,
    useUploadLocationImage,
    useDeleteLocation,
    // localized text
    useDeleteVoice,
    // localized text
    useUpdateCharacterName,
    useUpdateLocationName,
    useUpdateCharacterAppearanceDescription,
    useUpdateLocationSummary,
    useAiModifyCharacterDescription,
    useAiModifyLocationDescription,
    useUploadAssetHubTempMedia,
    useAiDesignCharacter,
    useExtractAssetHubReferenceCharacterDescription,
    useCreateAssetHubCharacter,
} from './useAssetHubMutations'

// ==================== Project (localized text) ====================
export * from './useCharacterMutations'
export * from './useLocationMutations'
export * from './useStoryboardMutations'
export * from './useVideoMutations'
export * from './useVoiceMutations'
export * from './useProjectConfigMutations'
export * from './useEpisodeMutations'
