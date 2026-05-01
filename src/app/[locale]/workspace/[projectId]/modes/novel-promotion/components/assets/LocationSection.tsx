'use client'
import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { useTranslations } from 'next-intl'

/**
 * LocationSection - localized text
 * localized text AssetsStage.tsx localized text，localized text
 * 
 * 🔥 V6.5 localized text：localized text useProjectAssets，localized text props drilling
 */

import { Location, Prop } from '@/types/project'
import { useProjectAssets } from '@/lib/query/hooks/useProjectAssets'
import LocationCard from './LocationCard'
import { AppIcon } from '@/components/ui/icons'
import { resolveLocationBackedGenerateType } from './location-backed-asset'

interface LocationSectionProps {
    // 🔥 V6.5 delete：locations prop - localized text
    projectId: string
    assetType?: 'location' | 'prop'
    activeTaskKeys: Set<string>
    onClearTaskKey: (key: string) => void
    onRegisterTransientTaskKey: (key: string) => void
    // localized text
    onAddLocation: () => void
    onDeleteLocation: (locationId: string) => void
    onEditLocation: (location: Location | Prop) => void
    // 🔥 V6.6 localized text：localized text handleGenerateImage
    handleGenerateImage: (type: 'character' | 'location' | 'prop', id: string, appearanceId?: string, count?: number) => Promise<void>
    onSelectImage: (locationId: string, imageIndex: number | null) => void
    onConfirmSelection: (locationId: string) => void
    onRegenerateSingle: (locationId: string, imageIndex: number) => Promise<void>
    onRegenerateGroup: (locationId: string, count?: number) => Promise<void>
    onUndo: (locationId: string) => void
    onImageClick: (imageUrl: string) => void
    onImageEdit: (locationId: string, imageIndex: number, locationName: string) => void
    onCopyFromGlobal: (locationId: string) => void  // 🆕 localized text
    /** localized text：localized text ID localized text/Prop，null localized text */
    filterIds?: Set<string> | null
}

export default function LocationSection({
    // 🔥 V6.5 delete：locations prop - localized text
    projectId,
    assetType = 'location',
    activeTaskKeys,
    onClearTaskKey,
    onRegisterTransientTaskKey,
    onAddLocation,
    onDeleteLocation,
    onEditLocation,
    handleGenerateImage,
    onSelectImage,
    onConfirmSelection,
    onRegenerateSingle,
    onRegenerateGroup,
    onUndo,
    onImageClick,
    onImageEdit,
    onCopyFromGlobal,
    filterIds = null,
}: LocationSectionProps) {
    const t = useTranslations('assets')

    const { data: assets } = useProjectAssets(projectId)
    const allLocations: Array<Location | Prop> = assetType === 'prop'
        ? assets?.props ?? []
        : assets?.locations ?? []
    const locations = filterIds ? allLocations.filter((l) => filterIds.has(l.id)) : allLocations
    const assetKey = assetType === 'prop' ? 'prop' : 'location'
    const generateType = resolveLocationBackedGenerateType(assetType)

    return (
        <div className="glass-surface p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]">
                        <AppIcon name="imageLandscape" className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-bold text-[var(--glass-text-primary)]">
                        {assetType === 'prop' ? t('stage.propAssets') : t("stage.locationAssets")}
                    </h3>
                    <span className="text-sm text-[var(--glass-text-tertiary)] bg-[var(--glass-bg-muted)]/50 px-2 py-1 rounded-lg">
                        {assetType === 'prop'
                            ? t('stage.propCounts', { count: locations.length })
                            : t("stage.locationCounts", { count: locations.length })}
                    </span>
                </div>
                <button
                    onClick={onAddLocation}
                    className="glass-btn-base glass-btn-primary flex items-center gap-2 px-4 py-2 font-medium"
                >
                    + {t(`${assetKey}.add`)}
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-6">
                {locations.map(location => (
                    <LocationCard
                        key={location.id}
                        location={location}
                        assetType={assetType}
                        onEdit={() => onEditLocation(location)}
                        onDelete={() => onDeleteLocation(location.id)}
                        onRegenerate={(count) => {
                            // localized text
                            const validImages = location.images?.filter(img => img.imageUrl) || []

                            _ulogInfo('[LocationSection] localized text:', {
                                locationName: location.name,
                                images: location.images,
                                validImages,
                                validImageCount: validImages.length
                            })

                            // localized text：localized text
                            if (validImages.length === 1) {
                                const imageIndex = validImages[0].imageIndex
                                const taskKey = `location-${location.id}-${imageIndex}`
                                _ulogInfo('[LocationSection] localized text, imageIndex:', imageIndex)
                                onRegisterTransientTaskKey(taskKey)
                                void onRegenerateSingle(location.id, imageIndex).catch(() => {
                                    onClearTaskKey(taskKey)
                                })
                            }
                            // localized text：localized text
                            else {
                                const taskKey = `location-${location.id}-group`
                                _ulogInfo('[LocationSection] localized text')
                                onRegisterTransientTaskKey(taskKey)
                                void onRegenerateGroup(location.id, count).catch(() => {
                                    onClearTaskKey(taskKey)
                                })
                            }
                        }}
                        onGenerate={(count) => {
                            const taskKey = `location-${location.id}-group`
                            onRegisterTransientTaskKey(taskKey)
                            void handleGenerateImage(generateType, location.id, undefined, count).catch(() => {
                                onClearTaskKey(taskKey)
                            })
                        }}
                        onUndo={() => onUndo(location.id)}
                        onImageClick={onImageClick}
                        onSelectImage={onSelectImage}
                        onImageEdit={(locId, imgIdx) => onImageEdit(locId, imgIdx, location.name)}
                        onCopyFromGlobal={() => onCopyFromGlobal(location.id)}
                        activeTaskKeys={activeTaskKeys}
                        onClearTaskKey={onClearTaskKey}
                        projectId={projectId}
                        onConfirmSelection={assetType === 'location' ? onConfirmSelection : undefined}
                    />
                ))}
            </div>
        </div>
    )
}
