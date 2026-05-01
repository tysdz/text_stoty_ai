/**
 * React Query Hooks localized text
 * 
 * localized text：
 * import { useProjectAssets, useGenerateProjectCharacterImage } from '@/lib/query/hooks'
 */

// localized text
export {
    useAssets,
    useAssetActions,
    useRefreshAssets,
} from './useAssets'

export {
    useGlobalCharacters,
    useGlobalLocations,
    useGlobalProps,
    useGlobalVoices,
    useGlobalFolders,
    useCreateFolder,
    useUpdateFolder,
    useDeleteFolder,
    useRefreshGlobalAssets,
    type GlobalCharacter,
    type GlobalCharacterAppearance,
    type GlobalLocation,
    type GlobalLocationImage,
    type GlobalProp,
    type GlobalVoice,
    type GlobalFolder,
} from './useGlobalAssets'
export {
    useGenerateCharacterImage,
    useModifyCharacterImage,
    useSelectCharacterImage,
    useUndoCharacterImage,
    useUploadCharacterImage,
    useDeleteCharacter,
    useDeleteCharacterAppearance,
    useUploadCharacterVoice,
    useGenerateLocationImage,
    useModifyLocationImage,
    useSelectLocationImage,
    useUndoLocationImage,
    useUploadLocationImage,
    useDeleteLocation,
    useDeleteVoice,
    useUpdateCharacterName,
    useUpdateLocationName,
    useUpdateCharacterAppearanceDescription,
    useUpdateLocationSummary,
    useAiModifyCharacterDescription,
    useAiModifyLocationDescription,
    useDesignAssetHubVoice,
    useSaveDesignedAssetHubVoice,
    useUploadAssetHubVoice,
    useAiDesignLocation,
    useCreateAssetHubLocation,
    useUploadAssetHubTempMedia,
    useAiDesignCharacter,
    useExtractAssetHubReferenceCharacterDescription,
    useCreateAssetHubCharacter,
} from '../mutations/useAssetHubMutations'

// localized text
export {
    useProjectAssets,
    useProjectCharacters,
    useProjectLocations,
    useProjectProps,
    useRefreshProjectAssets,
    type ProjectAssetsData,
} from './useProjectAssets'
export {
    useGenerateProjectCharacterImage,
    useModifyProjectCharacterImage,
    useRegenerateCharacterGroup,
    useRegenerateSingleCharacterImage,
    useSelectProjectCharacterImage,
    useUndoProjectCharacterImage,
    useUploadProjectCharacterImage,
    useDeleteProjectCharacter,
    useDeleteProjectAppearance,
    useUpdateProjectCharacterName,
    useUploadProjectCharacterVoice,
    useGenerateProjectLocationImage,
    useModifyProjectLocationImage,
    useRegenerateLocationGroup,
    useRegenerateSingleLocationImage,
    useSelectProjectLocationImage,
    useUndoProjectLocationImage,
    useUploadProjectLocationImage,
    useDeleteProjectLocation,
    useUpdateProjectLocationName,
    useUpdateProjectAppearanceDescription,
    useUpdateProjectLocationDescription,
    useUpdateProjectCharacterIntroduction,
    useAiModifyProjectAppearanceDescription,
    useAiModifyProjectLocationDescription,
    useAiCreateProjectLocation,
    useCreateProjectLocation,
    useAiCreateProjectCharacter,
    useUploadProjectTempMedia,
    useExtractProjectReferenceCharacterDescription,
    useCreateProjectCharacter,
    useCreateProjectCharacterAppearance,
    useAnalyzeProjectGlobalAssets,
    useCopyProjectAssetFromGlobal,
    useAiModifyProjectShotPrompt,
    useUpdateProjectConfig,
    useUpdateProjectEpisodeField,
    useAnalyzeProjectAssets,
    useGetProjectStoryboardStats,
    useUpdateProjectPanelVideoPrompt,
    useRegenerateProjectPanelImage,
    useModifyProjectStoryboardImage,
    useDownloadProjectImages,
    useUpdateProjectPanel,
    useCreateProjectPanel,
    useDeleteProjectPanel,
    useDeleteProjectStoryboardGroup,
    useRegenerateProjectStoryboardText,
    useCreateProjectStoryboardGroup,
    useMoveProjectStoryboardGroup,
    useInsertProjectPanel,
    useConfirmProjectCharacterSelection,
    useConfirmProjectLocationSelection,
    useConfirmProjectCharacterProfile,
    useBatchConfirmProjectCharacterProfiles,
    useUpdateProjectCharacterVoiceSettings,
    useSaveProjectDesignedVoice,
    useUpdateProjectClip,
    useFetchProjectVoiceStageData,
    useAnalyzeProjectVoice,
    useGenerateProjectVoice,
    useCreateProjectVoiceLine,
    useUpdateProjectVoiceLine,
    useDeleteProjectVoiceLine,
    useDownloadProjectVoices,
    useBatchGenerateCharacterImages,
    useBatchGenerateLocationImages,
    useDesignProjectVoice,
    useAnalyzeProjectShotVariants,
    useUpdateProjectPhotographyPlan,
    useUpdateProjectPanelActingNotes,
    useListProjectEpisodeVideoUrls,
    useUpdateProjectPanelLink,
    useListProjectEpisodes,
    useSplitProjectEpisodes,
    useSplitProjectEpisodesByMarkers,
    useSaveProjectEpisodesBatch,
    useDownloadRemoteBlob,
    useCreateProjectPanelVariant,
    useClearProjectStoryboardError,
    useUpdateSpeakerVoice,
} from '../mutations/useProjectMutations'

export type {
    Character,
    CharacterAppearance,
    Location,
    LocationImage,
    Prop,
    PropImage,
} from '@/types/project'

// localized text
export {
    useStoryboards,
    useRegeneratePanelImage,
    useModifyPanelImage,
    useGenerateVideo,
    useBatchGenerateVideos,
    useSelectPanelCandidate,
    useRefreshStoryboards,
    type StoryboardPanel,
    type StoryboardGroup,
    type StoryboardData,
    type PanelCandidate,
} from './useStoryboards'

// localized text
export {
    useVoiceLines,
    useMatchedVoiceLines,
    useGenerateVoice,
    useBatchGenerateVoices,
    useUpdateVoiceText,
    useRefreshVoiceLines,
    type VoiceLine,
    type MatchedVoiceLine,
    type VoiceLinesData,
    type MatchedVoiceLinesData,
} from './useVoiceLines'

// localized text
export {
    useSSE,
} from './useSSE'
export {
    useStoryToScriptRunStream,
} from './useStoryToScriptRunStream'
export {
    useScriptToStoryboardRunStream,
} from './useScriptToStoryboardRunStream'

export {
    useAssetTaskPresentation,
    useStoryboardTaskPresentation,
    useVideoTaskPresentation,
    useVoiceTaskPresentation,
    type TaskPresentationTarget,
} from './useTaskPresentation'

// localized text
export {
    useProjectData,
    useRefreshProjectData,
    useEpisodeData,
    useEpisodes,
    useRefreshEpisodeData,
    useRefreshAll,
    type Episode,
} from './useProjectData'

export {
    useUserModels,
    type UserModelOption as QueryUserModelOption,
    type UserModelsPayload as QueryUserModelsPayload,
} from './useUserModels'
