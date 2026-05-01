'use client'

/**
 * asset library - localized text,localized text
 * localized textAssetsStagelocalized text,localized text
 * 
 * 🔥 V6.5 localized text：delete characters/locations props，AssetsStage localized text
 * 🔥 V6.6 localized text：delete onGenerateImage prop，AssetsStage localized text mutation hooks
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import AssetsStage from './AssetsStage'
import { AppIcon } from '@/components/ui/icons'
import { useAssets } from '@/lib/query/hooks'
import JSZip from 'jszip'
import { logError as _logError } from '@/lib/logging/core'

interface AssetLibraryProps {
  projectId: string
  isAnalyzingAssets: boolean
}

export default function AssetLibrary({
  projectId,
  isAnalyzingAssets
}: AssetLibraryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const t = useTranslations('assets')

  // localized text
  const { data: assets = [] } = useAssets({
    scope: 'project',
    projectId,
  })

  const handleDownloadAll = async () => {
    // localized text
    const imageEntries: Array<{ filename: string; url: string }> = []

    // localized text
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
      const selectedVariant = asset.variants.find((variant) => variant.renders[0]?.isSelected) ?? asset.variants[0]
      const url = selectedVariant?.renders[0]?.imageUrl
      if (!url) continue
      const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
      imageEntries.push({ filename: `locations/${safeName}.jpg`, url })
    }

    for (const asset of assets) {
      if (asset.kind !== 'prop') continue
      const selectedVariant = asset.variants.find((variant) => variant.renders[0]?.isSelected) ?? asset.variants[0]
      const url = selectedVariant?.renders[0]?.imageUrl
      if (!url) continue
      const safeName = asset.name.replace(/[/\\:*?"<>|]/g, '_')
      imageEntries.push({ filename: `props/${safeName}.jpg`, url })
    }

    if (imageEntries.length === 0) {
      alert(t('assetLibrary.downloadEmpty'))
      return
    }

    setIsDownloading(true)
    try {
      const zip = new JSZip()
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
      link.download = `assets_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (error) {
      _logError('localized text:', error)
      alert(t('assetLibrary.downloadFailed'))
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      {/* localized text - localized text */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-40 flex items-center gap-2 px-5 py-2.5 glass-btn-base glass-btn-secondary text-[var(--glass-text-secondary)] font-medium"
      >
        <AppIcon name="folderCards" className="w-5 h-5" />
        {t('assetLibrary.button')}
      </button>

      {/* localized text - localized text */}
      {isOpen && (
        <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-6">
          <div className="glass-surface-modal w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden">
            {/* localized text */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--glass-stroke-base)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--glass-accent-from)] rounded-2xl flex items-center justify-center shadow-[var(--glass-shadow-md)]">
                  <AppIcon name="folderCards" className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--glass-text-primary)]">{t('assetLibrary.title')}</h2>

                {/* localized text - localized text */}
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  title={t('common.download')}
                  className="w-9 h-9 glass-btn-base glass-btn-secondary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AppIcon
                    name={isDownloading ? 'refresh' : 'download'}
                    className={`w-4 h-4${isDownloading ? ' animate-spin' : ''}`}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 glass-btn-base glass-btn-secondary flex items-center justify-center"
              >
                <AppIcon name="close" className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
              </button>
            </div>

            {/* localized text - localized textAssetsStage，localized text AssetsStage localized text */}
            <div className="flex-1 overflow-y-auto p-8">
              <AssetsStage
                projectId={projectId}
                isAnalyzingAssets={isAnalyzingAssets}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
