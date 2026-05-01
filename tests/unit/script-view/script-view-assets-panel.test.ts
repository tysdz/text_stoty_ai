import * as React from 'react'
import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import ScriptViewAssetsPanel from '@/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/script-view/ScriptViewAssetsPanel'

const messages = {
  scriptView: {
    inSceneAssets: 'active assets',
    assetView: {
      allClips: 'all clips',
    },
    segment: {
      title: 'localized text {index}',
    },
    asset: {
      activeCharacters: 'active characters',
      activeLocations: 'active locations',
      defaultAppearance: 'default appearance',
    },
    screenplay: {
      noCharacter: 'no character selected for this clip',
      noLocation: 'no location selected for this clip',
    },
    generate: {
      startGenerate: 'start generation',
    },
  },
  assets: {
    character: {
      primary: 'initial appearance',
    },
  },
  novelPromotion: {
    buttons: {
      assetLibrary: 'asset library',
    },
  },
  common: {
    edit: 'edit',
    cancel: 'cancel',
    confirm: 'confirm',
  },
} as const

function renderWithIntl(node: ReactElement) {
  const providerProps: ComponentProps<typeof NextIntlClientProvider> = {
    locale: 'vi',
    messages: messages as unknown as AbstractIntlMessages,
    timeZone: 'Asia/Shanghai',
    children: node,
  }

  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, providerProps),
  )
}

function renderPanel(propsCount: number) {
  Reflect.set(globalThis, 'React', React)

  const props = Array.from({ length: propsCount }, (_, index) => ({
    id: `prop-${index + 1}`,
    name: `Prop${index + 1}`,
    summary: `localized text${index + 1}`,
    selectedImageId: null,
    images: [],
  }))

  return renderWithIntl(
    createElement(ScriptViewAssetsPanel, {
      clips: [{ id: 'clip-1', location: null, props: null }],
      assetViewMode: 'all',
      setAssetViewMode: () => undefined,
      setSelectedClipId: () => undefined,
      characters: [],
      locations: [],
      props,
      activeCharIds: [],
      activeLocationIds: [],
      activePropIds: [],
      selectedAppearanceKeys: new Set<string>(),
      onUpdateClipAssets: async () => undefined,
      onOpenAssetLibrary: () => undefined,
      assetsLoading: false,
      assetsLoadingState: null,
      allAssetsHaveImages: true,
      globalCharIds: [],
      globalLocationIds: [],
      globalPropIds: [],
      missingAssetsCount: 0,
      onGenerateStoryboard: () => undefined,
      isSubmittingStoryboardBuild: false,
      getSelectedAppearances: () => [],
      tScript: (key: string, values?: Record<string, unknown>) => {
        if (key === 'inSceneAssets') return 'active assets'
        if (key === 'assetView.allClips') return 'all clips'
        if (key === 'segment.title') return `localized text ${String(values?.index ?? '')}`
        if (key === 'asset.activeCharacters') return 'active characters'
        if (key === 'asset.activeLocations') return 'active locations'
        if (key === 'screenplay.noCharacter') return 'no character selected for this clip'
        if (key === 'screenplay.noLocation') return 'no location selected for this clip'
        if (key === 'generate.startGenerate') return 'start generation'
        if (key === 'asset.defaultAppearance') return 'default appearance'
        return key
      },
      tAssets: (key: string) => (key === 'character.primary' ? 'initial appearance' : key),
      tNP: (key: string) => (key === 'buttons.assetLibrary' ? 'asset library' : key),
      tCommon: (key: string) => {
        if (key === 'edit') return 'edit'
        if (key === 'cancel') return 'cancel'
        if (key === 'confirm') return 'confirm'
        return key
      },
    }),
  )
}

describe('ScriptViewAssetsPanel', () => {
  it('hides the prop section when the project has no prop assets', () => {
    const html = renderPanel(0)

    expect(html).not.toContain('Prop (0)')
    expect(html).not.toContain('localized text')
  })

  it('keeps the prop section visible when the project has prop assets even if none are selected in the current clip', () => {
    const html = renderPanel(1)

    expect(html).toContain('Prop (0)')
    expect(html).toContain('localized text')
  })
})
