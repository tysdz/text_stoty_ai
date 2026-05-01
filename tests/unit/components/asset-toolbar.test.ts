import * as React from 'react'
import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import AssetToolbar from '@/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/assets/AssetToolbar'

vi.mock('@/lib/query/hooks', () => ({
  useProjectAssets: vi.fn(() => ({ data: { characters: [], locations: [], props: [] } })),
  useProjectData: vi.fn(() => ({ data: { name: 'ProjectA' } })),
}))

const messages = {
  assets: {
    common: {
      refresh: 'refresh',
    },
    filterBar: {
      allEpisodes: 'localized text',
    },
    toolbar: {
      assetManagement: 'localized text',
      assetCount: 'localized text {total} localized text（{appearances} localized text + {locations} Location + {props} Prop）',
      globalAnalyze: 'localized text',
      globalAnalyzeHint: 'localized text',
      downloadAll: 'localized text',
      generateAll: 'localized text',
      regenerateAll: 'localized text',
      regenerateAllHint: 'localized text',
    },
    assetLibrary: {
      downloadEmpty: 'localized text',
      downloadFailed: 'localized text',
    },
  },
} as const

const renderWithIntl = (node: ReactElement) => {
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

describe('AssetToolbar', () => {
  it('localized text -> localized text', () => {
    Reflect.set(globalThis, 'React', React)

    const html = renderWithIntl(
      createElement(AssetToolbar, {
        projectId: 'project-1',
        totalAssets: 24,
        totalAppearances: 11,
        totalLocations: 13,
        totalProps: 0,
        isBatchSubmitting: false,
        isAnalyzingAssets: false,
        isGlobalAnalyzing: false,
        onGlobalAnalyze: () => undefined,
        episodeId: null,
        onEpisodeChange: () => undefined,
        episodes: [],
      }),
    )

    expect(html).toContain('localized text')
    expect(html).toContain('title="localized text"')
    expect(html).not.toContain('localized text')
    expect(html).not.toContain('localized text')
    expect(html).not.toContain('>refresh<')
  })
})
