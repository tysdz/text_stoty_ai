import * as React from 'react'
import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import { LocationCreationModal } from '@/components/shared/assets/LocationCreationModal'

vi.mock('@/lib/query/hooks', () => ({
  useAiCreateProjectLocation: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useAiDesignLocation: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useCreateAssetHubLocation: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useGenerateLocationImage: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useCreateProjectLocation: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useGenerateProjectLocationImage: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

const messages = {
  assetModal: {
    location: {
      title: 'create location',
      name: 'location name',
      namePlaceholder: 'localized text',
      description: 'location description',
      descPlaceholder: 'localized text...',
    },
    artStyle: { title: 'visual style' },
    aiDesign: {
      title: 'AI localized text',
      placeholderLocation: 'localized text...',
      generating: 'designing...',
      generate: 'generate',
      tip: 'localized text，AI localized text',
    },
    common: {
      cancel: 'cancel',
      addOnlyLocation: 'localized text',
      addOnlyToAssetHubLocation: 'localized text',
      addAndGeneratePrefix: 'localized text',
      generateCountSuffix: 'localized text',
      selectGenerateCount: 'localized text',
      optional: '（localized text）',
    },
    errors: {
      createFailed: 'creation failed',
      aiDesignFailed: 'AI design failed',
      insufficientBalance: 'insufficient balance',
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

describe('LocationCreationModal', () => {
  it('renders add-only and add-and-generate actions in the fixed footer', () => {
    Reflect.set(globalThis, 'React', React)
    const html = renderWithIntl(
      createElement(LocationCreationModal, {
        mode: 'asset-hub',
        onClose: () => undefined,
        onSuccess: () => undefined,
      }),
    )

    expect(html).toContain('localized text')
    expect(html).toContain('localized text')
    expect(html).toContain('cancel')
  })
})
