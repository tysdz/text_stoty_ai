import { logError as _ulogError } from '@/lib/logging/core'
import { useState, useCallback } from 'react'
import { Project } from '@/types/project'
import { apiFetch } from '@/lib/api-fetch'

/**
 * localized text
 * - all: localized text + localized text
 * - project: localized text
 * - assets: localized text
 */
export type RefreshScope = 'all' | 'project' | 'assets'

/**
 * localized text
 * - full: localized text loading localized text
 * - silent: localized text，localized text loading
 */
export type RefreshMode = 'full' | 'silent'

/**
 * localized text
 */
export interface RefreshOptions {
  scope?: RefreshScope    // Default 'all'
  mode?: RefreshMode      // Default 'silent'
}

/**
 * localized textHook
 * 
 * 🔥 V2: localized text
 * - localized text refresh(options) localized text，localized text loadProject/loadAssets/silentRefresh/silentRefreshAssets
 * - localized text scope localized text mode localized text
 * - localized text
 */
export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  const [assetsLoading, setAssetsLoading] = useState(false)

  /**
   * 🔥 localized text
   * 
   * @param options.scope - localized text：'all' | 'project' | 'assets'，Default 'all'
   * @param options.mode - localized text：'full' | 'silent'，Default 'silent'
   * 
   * localized text：
   * - refresh()                        → localized text（localized text）
   * - refresh({ scope: 'assets' })     → localized text
   * - refresh({ scope: 'project' })    → localized text（localized text）
   * - refresh({ mode: 'full' })        → localized text loading
   */
  const refresh = useCallback(async (options: RefreshOptions = {}) => {
    const { scope = 'all', mode = 'silent' } = options

    // localized text：localized text loading
    if (mode === 'full') {
      setLoading(true)
      setError(null)
    }

    // localized text assetsLoading
    if (scope === 'assets') {
      setAssetsLoading(true)
    }

    try {
      // localized text
      if (scope === 'all' || scope === 'project') {
        const res = await apiFetch(`/api/projects/${projectId}/data`)
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to load project')
        }
        const data = await res.json()
        setProject(data.project)

        // localized text
        if (mode === 'full') {
          setAssetsLoaded(false)
        }
      }

      // localized text
      if (scope === 'all' || scope === 'assets') {
        const res = await apiFetch(`/api/projects/${projectId}/assets`)
        if (res.ok) {
          const assets = await res.json()
          setProject(prev => {
            if (!prev?.novelPromotionData) return prev
            return {
              ...prev,
              novelPromotionData: {
                ...prev.novelPromotionData,
                characters: assets.characters || [],
                locations: assets.locations || [],
                props: assets.props || [],
              }
            }
          })
          setAssetsLoaded(true)
        }
      }
    } catch (err: unknown) {
      _ulogError('Refresh error:', err)
      if (mode === 'full') {
        setError(getErrorMessage(err))
      }
      // localized text，localized text
    } finally {
      if (mode === 'full') {
        setLoading(false)
      }
      if (scope === 'assets') {
        setAssetsLoading(false)
      }
    }
  }, [projectId])

  /**
   * localized text（localized text）
   */
  const updateProject = useCallback((updates: Partial<Project>) => {
    setProject(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  return {
    // localized text
    project,
    loading,
    error,
    assetsLoaded,
    assetsLoading,

    // 🔥 localized text
    refresh,

    // localized text
    updateProject
  }
}
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message
    return String(err)
  }
