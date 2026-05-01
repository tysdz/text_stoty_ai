'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { apiFetch } from '@/lib/api-fetch'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import Navbar from '@/components/Navbar'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { useProjectData, useEpisodeData, useUserModels } from '@/lib/query/hooks'
import { queryKeys } from '@/lib/query/keys'
import NovelPromotionWorkspace from './modes/novel-promotion/NovelPromotionWorkspace'
import SmartImportWizard, { SplitEpisode } from './modes/novel-promotion/components/SmartImportWizard'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { resolveSelectedEpisodeId } from './episode-selection'
import { ModelCapabilityDropdown } from '@/components/ui/config-modals/ModelCapabilityDropdown'
import { AppIcon } from '@/components/ui/icons'
import { readConfiguredAnalysisModel, shouldGuideToModelSetup } from '@/lib/workspace/model-setup'
import { useRouter } from '@/i18n/navigation'

// localized textstagelocalized text
const VALID_STAGES = ['config', 'script', 'assets', 'text-storyboard', 'storyboard', 'videos', 'voice', 'editor'] as const
type Stage = typeof VALID_STAGES[number]

interface Episode {
  id: string
  episodeNumber: number
  name: string
  description?: string | null
  novelText?: string | null
  audioUrl?: string | null
  srtContent?: string | null
  createdAt: string
}

type NovelPromotionData = {
  episodes?: Episode[]
  importStatus?: string
}

/**
 * localized text - localized text
 */
export default function ProjectDetailPage() {
  const params = useParams<{ projectId?: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  if (!params?.projectId) {
    throw new Error('ProjectDetailPage requires projectId route param')
  }
  if (!searchParams) {
    throw new Error('ProjectDetailPage requires searchParams')
  }
  const projectId = params.projectId
  const t = useTranslations('workspaceDetail')
  const tc = useTranslations('common')

  // localized textURLlocalized text
  const urlStage = searchParams.get('stage') as Stage | null
  const urlEpisodeId = searchParams.get('episode') ?? null
  const currentUrlStage = urlStage && VALID_STAGES.includes(urlStage) ? urlStage : null

  // 🔥 React Query localized text
  const queryClient = useQueryClient()
  const { data: project, isLoading: loading, error: projectError } = useProjectData(projectId)
  const error = projectError?.message || null

  // localized text（localized text UI）
  const [isGlobalAssetsView, setIsGlobalAssetsView] = useState(false)
  const [isCheckingModelSetup, setIsCheckingModelSetup] = useState(true)
  const [needsModelSetup, setNeedsModelSetup] = useState(false)
  const [analysisModelDraft, setAnalysisModelDraft] = useState('')
  const [isModelSetupModalOpen, setIsModelSetupModalOpen] = useState(false)
  const [modelSetupSaving, setModelSetupSaving] = useState(false)

  const userModelsQuery = useUserModels()
  const llmModelOptions = userModelsQuery.data?.llm || []

  // updateURLlocalized text（stage localized text/localized text episode）
  const updateUrlParams = useCallback((updates: { stage?: string; episode?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (updates.stage !== undefined) {
      params.set('stage', updates.stage)
    }
    if (updates.episode !== undefined) {
      if (updates.episode) {
        params.set('episode', updates.episode)
      } else {
        params.delete('episode')
      }
    }
    const query = Object.fromEntries(params.entries())
    router.replace(
      {
        pathname: `/workspace/${projectId}`,
        query,
      },
      { scroll: false },
    )
  }, [router, projectId, searchParams])

  // updateURLlocalized textstagelocalized text（localized text）
  const updateUrlStage = useCallback((stage: string) => {
    updateUrlParams({ stage })
  }, [updateUrlParams])

  // Stage localized text URL localized text，localized text
  // localized text URL localized text stage localized text，localized text 'config'
  // 🚧 localized text (editor) localized text，localized text (videos)
  const effectiveStage = currentUrlStage === 'editor' ? 'videos' : (currentUrlStage || 'config')

  // localized text
  const novelPromotionData = project?.novelPromotionData as NovelPromotionData | undefined
  const episodes = useMemo<Episode[]>(() => {
    const getNum = (name: string) => { const m = name.match(/\d+/); return m ? parseInt(m[0], 10) : Infinity }
    return [...(novelPromotionData?.episodes ?? [])].sort((a, b) => {
      const diff = getNum(a.name) - getNum(b.name)
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'vi')
    })
  }, [novelPromotionData?.episodes])

  // localized text：URL（localized text）
  const selectedEpisodeId = useMemo(
    () => resolveSelectedEpisodeId(episodes, urlEpisodeId),
    [episodes, urlEpisodeId],
  )

  // 🔥 localized text React Query localized text
  const { data: currentEpisode } = useEpisodeData(
    projectId,
    !isGlobalAssetsView ? selectedEpisodeId : null
  )

  // localized text
  const importStatus = novelPromotionData?.importStatus

  // localized text：localized text → localized text
  const isZeroState = episodes.length === 0
  const shouldShowImportWizard = importStatus === 'pending' // localized text wizard
  const shouldAutoCreateEpisode = isZeroState && importStatus !== 'pending'
  const autoCreateTriggered = useRef(false)

  useEffect(() => {
    if (!shouldAutoCreateEpisode || autoCreateTriggered.current || loading) return
    autoCreateTriggered.current = true
    void handleCreateEpisode(`${t('episode')} 1`)
  }, [shouldAutoCreateEpisode, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const shouldGateImportWizardByModel = shouldShowImportWizard && !isGlobalAssetsView

  useEffect(() => {
    if (!shouldGateImportWizardByModel) return

    let canceled = false
    const checkDefaultModelSetup = async () => {
      setIsCheckingModelSetup(true)
      try {
        const response = await apiFetch('/api/user-preference')
        if (!response.ok) {
          _ulogError('[ProjectDetail] localized text:', { status: response.status })
          if (!canceled) {
            setNeedsModelSetup(true)
            setAnalysisModelDraft('')
          }
          return
        }

        const payload: unknown = await response.json()
        const configuredModel = readConfiguredAnalysisModel(payload)
        if (!canceled) {
          setAnalysisModelDraft(configuredModel || '')
          setNeedsModelSetup(shouldGuideToModelSetup(payload))
        }
      } catch (err) {
        _ulogError('[ProjectDetail] localized text:', err)
        if (!canceled) {
          setNeedsModelSetup(true)
          setAnalysisModelDraft('')
        }
      } finally {
        if (!canceled) {
          setIsCheckingModelSetup(false)
        }
      }
    }

    void checkDefaultModelSetup()
    return () => {
      canceled = true
    }
  }, [shouldGateImportWizardByModel])

  // localized text URL：localized text/localized text episode localized text，localized text episode
  useEffect(() => {
    if (!project || isGlobalAssetsView || episodes.length === 0) return
    if (urlEpisodeId && episodes.some((episode) => episode.id === urlEpisodeId)) return
    if (selectedEpisodeId) {
      updateUrlParams({ episode: selectedEpisodeId })
    }
  }, [episodes, isGlobalAssetsView, project, selectedEpisodeId, updateUrlParams, urlEpisodeId])

  // localized text
  const handleCreateEpisode = async (name: string, description?: string) => {
    const res = await apiFetch(`/api/novel-promotion/${projectId}/episodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || t('createFailed'))
    }

    const data = await res.json()
    // 🔥 localized text
    queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    // localized text
    setIsGlobalAssetsView(false)
    // localized textURL
    updateUrlParams({ episode: data.episode.id })
  }

  // localized text - localized text（localized text SmartImportWizard save）
  const handleSmartImportComplete = async (splitEpisodes: SplitEpisode[], triggerGlobalAnalysis?: boolean) => {
    _ulogInfo('[Page] handleSmartImportComplete localized text，triggerGlobalAnalysis:', triggerGlobalAnalysis)

    try {
      // 🔥 localized text
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })

      // localized text
      const res = await apiFetch(`/api/projects/${projectId}/data`)
      const data = await res.json()
      // API localized text { project: { novelPromotionData: { episodes: [...] } } }
      const newEpisodes = data?.project?.novelPromotionData?.episodes || []
      _ulogInfo('[Page] localized text:', newEpisodes.length, 'localized text')

      // localized text，localized text
      if (newEpisodes.length > 0) {
        // localized text，localized text assets localized text
        if (triggerGlobalAnalysis) {
          _ulogInfo('[Page] localized text，localized text assets stage，localized text globalAnalyze=1 localized text')
          // localized text，localized text locale
          const params = new URLSearchParams()
          params.set('stage', 'assets')
          params.set('episode', newEpisodes[0].id)
          params.set('globalAnalyze', '1')
          const newUrl = `?${params.toString()}`
          _ulogInfo('[Page] localized text:', newUrl)
          router.replace(newUrl, { scroll: false })
        } else {
          _ulogInfo('[Page] localized text，localized text episode localized text')
          updateUrlParams({ episode: newEpisodes[0].id })
        }
      }
    } catch (err: unknown) {
      _ulogError('localized text:', err)
    }
  }

  // localized text
  const handleRenameEpisode = async (episodeId: string, newName: string) => {
    const res = await apiFetch(`/api/novel-promotion/${projectId}/episodes/${episodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    })

    if (!res.ok) {
      throw new Error(t('renameFailed'))
    }

    // 🔥 localized text
    queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    // localized text
    if (selectedEpisodeId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.episodeData(projectId, selectedEpisodeId) })
    }
  }

  // localized text
  const handleDeleteEpisode = async (episodeId: string) => {
    const res = await apiFetch(`/api/novel-promotion/${projectId}/episodes/${episodeId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(t('deleteFailed'))
    }
    // localized text
    queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    // localized text，localized text
    if (episodeId === selectedEpisodeId) {
      const remaining = episodes.filter(ep => ep.id !== episodeId)
      if (remaining.length > 0) {
        updateUrlParams({ episode: remaining[0].id })
      } else {
        updateUrlParams({ episode: null })
      }
    }
  }

  // localized text
  const handleEpisodeSelect = (episodeId: string) => {
    setIsGlobalAssetsView(false)
    // localized textURL
    updateUrlParams({ episode: episodeId })
  }

  const handleSaveDefaultAnalysisModel = async () => {
    const modelKey = analysisModelDraft.trim()
    if (!modelKey) {
      alert(t('modelSetup.selectModelFirst'))
      return
    }

    setModelSetupSaving(true)
    try {
      const response = await apiFetch('/api/user-preference', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisModel: modelKey }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setNeedsModelSetup(false)
      setIsModelSetupModalOpen(false)
    } catch (err) {
      _ulogError('[ProjectDetail] localized text:', err)
      alert(t('modelSetup.saveFailed'))
    } finally {
      setModelSetupSaving(false)
    }
  }

  // Loadinglocalized text：localized text
  // localized text：localized text localized text (localized textepisodelocalized text)
  // localized text：localized text，localized text
  const isInitializing = loading ||
    (!shouldShowImportWizard && !isGlobalAssetsView && episodes.length > 0 && (!selectedEpisodeId || !currentEpisode)) ||
    (project && !project.novelPromotionData)
  const initLoadingState = resolveTaskPresentationState({
    phase: 'processing',
    intent: 'generate',
    resource: 'text',
    hasOutput: false,
  })

  if (isInitializing) {
    return (
      <div className="glass-page min-h-screen">
        <Navbar />
        <main className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-[var(--glass-text-secondary)]">{tc('loading')}</div>
        </main>
      </div>
    )
  }

  // Errorlocalized text
  if (error || !project) {
    return (
      <div className="glass-page min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="glass-surface p-6 text-center">
            <p className="text-[var(--glass-tone-danger-fg)] mb-4">{error || t('projectNotFound')}</p>
            <button
              onClick={() => router.push({ pathname: '/workspace' })}
              className="glass-btn-base glass-btn-primary px-6 py-2"
            >
              {t('backToWorkspace')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="glass-page min-h-screen flex flex-col">
      <Navbar />

      {/* V3 UI: localized text Sidebar */}

      {/* localized text - localized text */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {isGlobalAssetsView && project.novelPromotionData ? (
            // localized text（localized text）
            <div>
              <h1 className="text-2xl font-bold text-[var(--glass-text-primary)] mb-6">{t('globalAssets')}</h1>
              <NovelPromotionWorkspace
                project={project}
                projectId={projectId}
                viewMode="global-assets"
                urlStage={effectiveStage}
                onStageChange={updateUrlStage}
              />
            </div>
          ) : shouldShowImportWizard && !isGlobalAssetsView ? (
            isCheckingModelSetup ? (
              <div className="glass-surface p-8 text-center">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)]">
                  <TaskStatusInline state={initLoadingState} className="[&>span]:sr-only" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--glass-text-secondary)] mb-2">{tc('loading')}</h2>
              </div>
            ) : needsModelSetup ? (
              <div className="glass-surface p-8 max-w-2xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--glass-tone-warning-bg)] text-[var(--glass-tone-warning-fg)] flex items-center justify-center shrink-0">
                    <AppIcon name="alert" className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
                      {t('modelSetup.title')}
                    </h2>
                    <p className="text-[var(--glass-text-secondary)] mb-5">
                      {t('modelSetup.description')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setIsModelSetupModalOpen(true)}
                        className="glass-btn-base glass-btn-primary px-4 py-2"
                      >
                        {t('modelSetup.configureNow')}
                      </button>
                      <button
                        onClick={() => router.push({ pathname: '/profile' })}
                        className="glass-btn-base glass-btn-secondary px-4 py-2"
                      >
                        {t('modelSetup.goProfile')}
                      </button>
                    </div>
                  </div>
                </div>

                {isModelSetupModalOpen && (
                  <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="glass-surface-modal p-6 w-full max-w-xl mx-4">
                      <h3 className="text-xl font-bold text-[var(--glass-text-primary)] mb-2">
                        {t('modelSetup.modalTitle')}
                      </h3>
                      <p className="text-sm text-[var(--glass-text-secondary)] mb-5">
                        {t('modelSetup.modalDescription')}
                      </p>

                      <div className="mb-6">
                        <label className="glass-field-label block mb-2">{t('modelSetup.selectModelLabel')}</label>
                        {userModelsQuery.isLoading ? (
                          <div className="text-sm text-[var(--glass-text-tertiary)]">{tc('loading')}</div>
                        ) : llmModelOptions.length === 0 ? (
                          <div className="text-sm text-[var(--glass-tone-warning-fg)]">
                            {t('modelSetup.noModelOptions')}
                          </div>
                        ) : (
                          <ModelCapabilityDropdown
                            models={llmModelOptions}
                            value={analysisModelDraft || undefined}
                            onModelChange={setAnalysisModelDraft}
                            capabilityFields={[]}
                            capabilityOverrides={{}}
                            onCapabilityChange={(field, rawValue, sample) => {
                              void field
                              void rawValue
                              void sample
                            }}
                            placeholder={t('modelSetup.selectModelPlaceholder')}
                          />
                        )}
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsModelSetupModalOpen(false)}
                          className="glass-btn-base glass-btn-secondary px-4 py-2"
                          disabled={modelSetupSaving}
                        >
                          {tc('cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { void handleSaveDefaultAnalysisModel() }}
                          className="glass-btn-base glass-btn-primary px-4 py-2 disabled:opacity-50"
                          disabled={modelSetupSaving || llmModelOptions.length === 0 || !analysisModelDraft.trim()}
                        >
                          {modelSetupSaving ? tc('loading') : tc('save')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // localized text（pending）：localized text
              <SmartImportWizard
                projectId={projectId}
                onManualCreate={() => handleCreateEpisode(`${t('episode')} 1`)}
                onImportComplete={handleSmartImportComplete}
                importStatus={importStatus}
              />
            )
          ) : selectedEpisodeId && currentEpisode ? (
            // localized text（localized text）
            <NovelPromotionWorkspace
              project={project}
              projectId={projectId}
              episodeId={selectedEpisodeId}
              episode={currentEpisode}
              viewMode="episode"
              urlStage={effectiveStage}
              onStageChange={updateUrlStage}
              episodes={episodes}
              onEpisodeSelect={handleEpisodeSelect}
              onEpisodeCreate={() => handleCreateEpisode(`${t('episode')} ${episodes.length + 1}`)}
              onEpisodeRename={handleRenameEpisode}
              onEpisodeDelete={handleDeleteEpisode}
            />
          ) : (
            // Loading
            <div className="glass-surface p-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)]">
                <TaskStatusInline state={initLoadingState} className="[&>span]:sr-only" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--glass-text-secondary)] mb-2">{tc('loading')}</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
