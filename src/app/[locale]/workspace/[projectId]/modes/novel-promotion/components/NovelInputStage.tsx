'use client'

/**
 * localized text - localized text (Story View)
 * V3.2 UI: localized text，localized text，localized text
 */

import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect, useCallback } from 'react'
import '@/styles/animations.css'
import { ART_STYLES, VIDEO_RATIOS } from '@/lib/constants'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'
import { RatioSelector, StyleSelector } from '@/components/selectors/RatioStyleSelectors'

/** localized text */
const LONG_TEXT_THRESHOLD = 1000



interface NovelInputStageProps {
  // localized text
  novelText: string
  // localized text
  episodeName?: string
  // localized text
  onNovelTextChange: (value: string) => void
  onNext: () => void
  /** localized text（localized text） */
  onSmartSplit?: (text: string) => void
  // localized text
  isSubmittingTask?: boolean
  isSwitchingStage?: boolean
  // localized text
  enableNarration?: boolean
  onEnableNarrationChange?: (enabled: boolean) => void
  // localized text - localized text
  videoRatio?: string
  artStyle?: string
  onVideoRatioChange?: (value: string) => void
  onArtStyleChange?: (value: string) => void
}

export default function NovelInputStage({
  novelText,
  episodeName,
  onNovelTextChange,
  onNext,
  onSmartSplit,
  isSubmittingTask = false,
  isSwitchingStage = false,
  enableNarration = false,
  onEnableNarrationChange,
  videoRatio = '9:16',
  artStyle = 'american-comic',
  onVideoRatioChange,
  onArtStyleChange
}: NovelInputStageProps) {
  const t = useTranslations('novelPromotion')

  // ── IME localized text ──
  // Vietnamese/localized text/localized text（composing）localized text onChange，
  // localized text（localized text API localized text + React Query invalidation），
  // localized text，localized text。
  // localized text：localized text state，localized text。
  const isComposingRef = useRef(false)
  const [localText, setLocalText] = useState(novelText)

  // localized text novelText localized text（localized text）localized text，localized text state
  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalText(novelText)
    }
  }, [novelText])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalText(newValue)
    // localized text IME localized text
    if (!isComposingRef.current) {
      onNovelTextChange(newValue)
    }
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false
    // localized text，localized text
    onNovelTextChange(e.currentTarget.value)
  }

  const hasContent = localText.trim().length > 0
  const [showLongTextPrompt, setShowLongTextPrompt] = useState(false)

  /** localized text"localized text"localized text，localized text */
  const handleStartClick = useCallback(() => {
    const textLength = localText.trim().length
    if (textLength > LONG_TEXT_THRESHOLD && onSmartSplit) {
      setShowLongTextPrompt(true)
    } else {
      onNext()
    }
  }, [localText, onNext, onSmartSplit])

  // localized text
  const ratioDisplayLabel = (VIDEO_RATIOS.find((option) => option.value === videoRatio) ?? VIDEO_RATIOS[0])?.label
  const artStyleDisplayLabel = (ART_STYLES.find((option) => option.value === artStyle) ?? ART_STYLES[0])?.label

  // localized text（localized text，localized text info localized text）
  const ratioUsageTextMap: Record<string, string> = {
    '1:1': t('storyInput.ratioUsage.1_1'),
    '9:16': t('storyInput.ratioUsage.9_16'),
    '16:9': t('storyInput.ratioUsage.16_9'),
    '4:3': t('storyInput.ratioUsage.4_3'),
    '3:4': t('storyInput.ratioUsage.3_4'),
    '2:3': t('storyInput.ratioUsage.2_3'),
    '3:2': t('storyInput.ratioUsage.3_2'),
    '4:5': t('storyInput.ratioUsage.4_5'),
    '5:4': t('storyInput.ratioUsage.5_4'),
    '21:9': t('storyInput.ratioUsage.21_9'),
  }

  // localized text（localized text）
  const ratioUsageTagMap: Record<string, string> = {
    '1:1': t('storyInput.ratioUsageTag.1_1'),
    '9:16': t('storyInput.ratioUsageTag.9_16'),
    '16:9': t('storyInput.ratioUsageTag.16_9'),
    '4:3': t('storyInput.ratioUsageTag.4_3'),
    '3:4': t('storyInput.ratioUsageTag.3_4'),
    '2:3': t('storyInput.ratioUsageTag.2_3'),
    '3:2': t('storyInput.ratioUsageTag.3_2'),
    '4:5': t('storyInput.ratioUsageTag.4_5'),
    '5:4': t('storyInput.ratioUsageTag.5_4'),
    '21:9': t('storyInput.ratioUsageTag.21_9'),
  }

  const getRatioUsageText = (ratio: string): string =>
    ratioUsageTextMap[ratio] ?? t('storyInput.videoRatioHint')

  const getRatioUsageTag = (ratio: string): string =>
    ratioUsageTagMap[ratio] ?? ''

  const ratioUsageText = getRatioUsageText(videoRatio)
  const stageSwitchingState = isSwitchingStage
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'text',
      hasOutput: false,
    })
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* localized text - localized text */}
      {episodeName && (
        <div className="text-center py-1">
          <div className="text-lg font-semibold text-[var(--glass-text-primary)]">
            {t("storyInput.currentEditing", { name: episodeName })}
          </div>
          <div className="text-sm text-[var(--glass-text-tertiary)] mt-1">{t("storyInput.editingTip")}</div>
        </div>
      )}

      {/* localized text（localized text） */}
      <div className="glass-surface-elevated overflow-hidden relative z-10">
        <div className="p-6 pb-0">
          {/* localized text */}
          <div className="flex items-center justify-end mb-3">
            <span className="glass-chip glass-chip-neutral text-xs">
              {t("storyInput.wordCount")} {localText.length}
            </span>
          </div>

          {/* localized text */}
          <textarea
            value={localText}
            onChange={handleTextChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={`localized text...\n\nAI localized text：\n• localized text\n• localized text\n• localized text\n\nlocalized text：\nlocalized text，localized text。localized text，localized text——localized text！localized text，localized text...`}
            className="glass-textarea-base custom-scrollbar h-80 px-4 py-3 text-base resize-none placeholder:text-[var(--glass-text-tertiary)]"
            disabled={isSubmittingTask || isSwitchingStage}
          />
        </div>

        {/* localized text：localized text + localized text + localized text（localized text） */}
        <div className="flex items-end gap-3 px-6 py-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-[160px] flex-shrink-0">
              <RatioSelector
                value={videoRatio}
                onChange={(value) => onVideoRatioChange?.(value)}
                options={VIDEO_RATIOS.map((option) => ({
                  ...option,
                  recommended: option.value === '9:16'
                }))}
                getUsage={getRatioUsageTag}
              />
            </div>
            <div className="w-[160px] flex-shrink-0">
              <StyleSelector
                value={artStyle}
                onChange={(value) => onArtStyleChange?.(value)}
                options={ART_STYLES.map((option) => ({
                  ...option,
                  recommended: option.value === 'realistic'
                }))}
              />
            </div>
          </div>
          <button
            onClick={handleStartClick}
            disabled={!hasContent || isSubmittingTask || isSwitchingStage}
            className="glass-btn-base glass-btn-primary px-5 py-2.5 text-sm flex-shrink-0 disabled:opacity-50 flex items-center gap-2"
          >
            {isSwitchingStage ? (
              <TaskStatusInline state={stageSwitchingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              <>
                <span>{t("smartImport.manualCreate.button")}</span>
                <AppIcon name="arrowRight" className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* localized text */}
        <div className="px-6 pb-4 space-y-1 text-center">
          <p className="text-xs text-[var(--glass-text-secondary)]">
            {t("storyInput.currentConfigSummary", {
              ratio: ratioDisplayLabel,
              style: artStyleDisplayLabel
            })}
          </p>
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {t("storyInput.moreConfig")}
          </p>
        </div>
      </div>

      {/* localized text */}
      <div className="glass-surface p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 glass-surface-soft rounded-xl flex items-center justify-center flex-shrink-0">
            <AppIcon name="folderCards" className="w-5 h-5 text-[var(--glass-text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--glass-text-secondary)] mb-1">{t("storyInput.assetLibraryTip.title")}</div>
            <p className="text-sm text-[var(--glass-text-tertiary)] leading-relaxed">
              {t("storyInput.assetLibraryTip.description")}
            </p>
          </div>
        </div>
      </div>

      {/* localized text */}
      {onEnableNarrationChange && (
        <div className="glass-surface p-6">
          <div className="glass-surface-soft flex items-center justify-between p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] font-semibold text-sm">VO</span>
              <div>
                <div className="font-medium text-[var(--glass-text-primary)]">{t("storyInput.narration.title")}</div>
                <div className="text-xs text-[var(--glass-text-tertiary)]">{t("storyInput.narration.description")}</div>
              </div>
            </div>
            <button
              onClick={() => onEnableNarrationChange(!enableNarration)}
              className={`relative w-14 h-8 rounded-full transition-colors ${enableNarration
                ? 'bg-[var(--glass-accent-from)]'
                : 'bg-[var(--glass-stroke-strong)]'
                }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-[var(--glass-bg-surface)] rounded-full shadow-sm transition-transform ${enableNarration ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* localized text — localized text */}
      {showLongTextPrompt && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 relative">
            {/* localized text */}
            <div
              className="rounded-2xl p-[1.5px]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)' }}
            >
              <div className="glass-surface-modal rounded-2xl p-6 space-y-5">
                {/* localized text */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))' }}
                  >
                    <AppIcon name="sparkles" className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--glass-text-primary)]">
                    {t('storyInput.longTextDetection.title')}
                  </h3>
                </div>

                {/* localized text */}
                <p className="text-sm text-[var(--glass-text-secondary)] leading-relaxed">
                  {t('storyInput.longTextDetection.description', { count: localText.trim().length.toLocaleString() })}
                </p>

                {/* localized text */}
                <div
                  className="p-4 rounded-xl text-sm leading-relaxed"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))' }}
                >
                  <p
                    className="font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t('storyInput.longTextDetection.strongRecommend')}
                  </p>
                </div>

                {/* localized text */}
                <div className="flex flex-col gap-3 pt-1">
                  {/* localized text — localized text */}
                  <button
                    onClick={() => {
                      setShowLongTextPrompt(false)
                      onSmartSplit?.(localText)
                    }}
                    className="w-full py-3.5 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}
                  >
                    <AppIcon name="sparkles" className="w-5 h-5" />
                    <span>{t('storyInput.longTextDetection.smartSplit')}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {t('storyInput.longTextDetection.smartSplitRecommend')}
                    </span>
                  </button>

                  {/* localized text — localized text */}
                  <button
                    onClick={() => {
                      setShowLongTextPrompt(false)
                      onNext()
                    }}
                    className="w-full py-2.5 text-sm text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] transition-colors"
                  >
                    {t('storyInput.longTextDetection.continueAnyway')}
                    <span className="text-xs ml-1 opacity-60">
                      — {t('storyInput.longTextDetection.singleEpisodeWarning')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
