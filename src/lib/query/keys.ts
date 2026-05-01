/**
 * localized text Query Keys localized text
 * localized text key localized text，localized text
 */
const globalAssetsRoot = () => ['global-assets'] as const
const projectAssetsRoot = (projectId: string) => ['project-assets', projectId] as const
const unifiedAssetsRoot = (
    scope: 'global' | 'project',
    projectId?: string | null,
) => scope === 'global'
    ? [...globalAssetsRoot(), 'unified'] as const
    : [...projectAssetsRoot(projectId ?? ''), 'unified'] as const

export const queryKeys = {
    assets: {
        all: (scope: 'global' | 'project', projectId?: string | null) =>
            unifiedAssetsRoot(scope, projectId),
        list: (params: {
            scope: 'global' | 'project'
            projectId?: string | null
            folderId?: string | null
            kind?: 'character' | 'location' | 'voice' | 'prop' | null
        }) => [
            ...unifiedAssetsRoot(params.scope, params.projectId),
            params.folderId ?? '',
            params.kind ?? '',
        ] as const,
    },

    // ============ localized text（Asset Hub）============
    globalAssets: {
        all: globalAssetsRoot,
        characters: (folderId?: string | null) =>
            folderId ? ['global-assets', 'characters', folderId] as const : ['global-assets', 'characters'] as const,
        locations: (folderId?: string | null) =>
            folderId ? ['global-assets', 'locations', folderId] as const : ['global-assets', 'locations'] as const,
        voices: (folderId?: string | null) =>
            folderId ? ['global-assets', 'voices', folderId] as const : ['global-assets', 'voices'] as const,
        folders: () => ['global-assets', 'folders'] as const,
    },

    // ============ localized text ============
    projectAssets: {
        all: projectAssetsRoot,
        characters: (projectId: string) => ['project-assets', projectId, 'characters'] as const,
        locations: (projectId: string) => ['project-assets', projectId, 'locations'] as const,
        detail: (projectId: string) => ['project-assets', projectId, 'detail'] as const,
    },

    // ============ localized text（Storyboard）============
    storyboards: {
        all: (episodeId: string) => ['storyboards', episodeId] as const,
        panels: (episodeId: string) => ['storyboards', episodeId, 'panels'] as const,
        groups: (episodeId: string) => ['storyboards', episodeId, 'groups'] as const,
    },

    // ============ localized text ============
    videos: {
        all: (episodeId: string) => ['videos', episodeId] as const,
        panels: (episodeId: string) => ['videos', episodeId, 'panels'] as const,
    },

    // ============ localized text（Voice）============
    voiceLines: {
        all: (episodeId: string) => ['voice-lines', episodeId] as const,
        list: (episodeId: string) => ['voice-lines', episodeId, 'list'] as const,
        matched: (projectId: string, episodeId: string) =>
            ['voice-lines', projectId, episodeId, 'matched'] as const,
    },

    // ============ localized text ============
    userModels: {
        all: () => ['user-models'] as const,
    },

    // ============ localized text ============
    tasks: {
        all: (projectId: string) => ['tasks', projectId] as const,
        target: (projectId: string, targetType: string, targetId: string) =>
            ['tasks', projectId, targetType, targetId] as const,
        snapshot: (projectId: string, targetType: string, targetId: string, typeKey: string) =>
            ['tasks', projectId, targetType, targetId, 'snapshot', typeKey] as const,
        targetStatesAll: (projectId: string) =>
            ['task-target-states', projectId] as const,
        targetStates: (projectId: string, serializedTargets: string) =>
            ['task-target-states', projectId, serializedTargets] as const,
        targetStateOverlay: (projectId: string) =>
            ['task-target-states-overlay', projectId] as const,
        pending: (projectId: string, episodeId?: string) =>
            episodeId
                ? ['pending-tasks', projectId, episodeId] as const
                : ['pending-tasks', projectId] as const,
    },

    // ============ localized text ============
    project: {
        detail: (projectId: string) => ['project', projectId] as const,
        episodes: (projectId: string) => ['project', projectId, 'episodes'] as const,
        data: (projectId: string) => ['project', projectId, 'data'] as const,
    },

    // ============ localized text ============
    /**
     * localized text
     */
    projectData: (projectId: string) => ['project-data', projectId] as const,

    /**
     * localized text
     */
    episodeData: (projectId: string, episodeId: string) =>
        ['episode-data', projectId, episodeId] as const,
} as const

/**
 * localized text，localized text
 */
export type QueryKeys = typeof queryKeys
