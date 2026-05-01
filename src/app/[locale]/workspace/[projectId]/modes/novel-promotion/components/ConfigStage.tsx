'use client'

import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import NovelInputStage from './NovelInputStage'
import SmartImportWizard from './SmartImportWizard'
import { useWorkspaceStageRuntime } from '../WorkspaceStageRuntimeContext'
import { useWorkspaceEpisodeStageData } from '../hooks/useWorkspaceEpisodeStageData'
import type { SplitEpisode } from './smart-import/types'

/**
 * localized text — localized text NovelInputStage + localized text
 * 
 * localized text（>1000words）localized text"localized text"localized text，
 * localized text。
 * select"localized text"localized text，localized text SmartImportWizard localized text。
 */
export default function ConfigStage() {
  const runtime = useWorkspaceStageRuntime()
  const { episodeName, novelText } = useWorkspaceEpisodeStageData()
  const params = useParams<{ projectId: string }>()
  const projectId = params?.projectId ?? ''

  // localized text
  const [smartSplitMode, setSmartSplitMode] = useState(false)
  const [smartSplitText, setSmartSplitText] = useState('')

  const handleSmartSplit = useCallback((text: string) => {
    setSmartSplitText(text)
    setSmartSplitMode(true)
  }, [])

  const handleSmartSplitComplete = useCallback((episodes: SplitEpisode[], triggerGlobalAnalysis?: boolean) => {
    // localized text，localized text
    // localized text window.location.reload localized text，localized text
    void episodes
    void triggerGlobalAnalysis
    window.location.reload()
  }, [])

  // localized text，localized text SmartImportWizard
  if (smartSplitMode) {
    return (
      <SmartImportWizard
        projectId={projectId}
        onManualCreate={() => setSmartSplitMode(false)}
        onImportComplete={handleSmartSplitComplete}
        initialRawContent={smartSplitText}
      />
    )
  }

  return (
    <NovelInputStage
      novelText={novelText}
      episodeName={episodeName}
      onNovelTextChange={runtime.onNovelTextChange}
      isSubmittingTask={runtime.isSubmittingTTS || runtime.isStartingStoryToScript}
      isSwitchingStage={runtime.isTransitioning}
      videoRatio={runtime.videoRatio ?? undefined}
      artStyle={runtime.artStyle ?? undefined}
      onVideoRatioChange={runtime.onVideoRatioChange}
      onArtStyleChange={runtime.onArtStyleChange}
      onNext={runtime.onRunStoryToScript}
      onSmartSplit={handleSmartSplit}
    />
  )
}
