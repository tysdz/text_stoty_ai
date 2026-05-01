import { logWarn as _ulogWarn } from '@/lib/logging/core'
import { VideoEditorProject } from '../types/editor.types'

/**
 * localized text
 * localized text
 */
export function migrateProjectData(data: unknown): VideoEditorProject {
    const project = data as Record<string, unknown>

    // check schema localized text
    const version = project.schemaVersion as string

    switch (version) {
        case '1.0':
            // localized text，localized text
            return project as unknown as VideoEditorProject

        default:
            // localized text，localized text 1.0 localized text
            _ulogWarn(`Unknown schema version: ${version}, treating as 1.0`)
            return {
                ...project,
                schemaVersion: '1.0'
            } as VideoEditorProject
    }
}

/**
 * localized text
 */
export function validateProjectData(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const project = data as Record<string, unknown>

    if (!project.id) errors.push('Missing project id')
    if (!project.episodeId) errors.push('Missing episodeId')
    if (!project.schemaVersion) errors.push('Missing schemaVersion')
    if (!project.config) errors.push('Missing config')
    if (!Array.isArray(project.timeline)) errors.push('Invalid timeline')
    if (!Array.isArray(project.bgmTrack)) errors.push('Invalid bgmTrack')

    return {
        valid: errors.length === 0,
        errors
    }
}
