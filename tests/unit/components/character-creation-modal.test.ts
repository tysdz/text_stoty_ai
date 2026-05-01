import * as React from 'react'
import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import { CharacterCreationModal } from '@/components/shared/assets/CharacterCreationModal'

vi.mock('@/lib/query/hooks', () => ({
  useProjectAssets: vi.fn(() => ({ data: { characters: [] } })),
}))

vi.mock('@/components/shared/assets/character-creation/hooks/useCharacterCreationSubmit', () => ({
  useCharacterCreationSubmit: vi.fn(() => ({
    isSubmitting: false,
    isAiDesigning: false,
    isExtracting: false,
    characterGenerationCount: 3,
    setCharacterGenerationCount: vi.fn(),
    referenceCharacterGenerationCount: 3,
    setReferenceCharacterGenerationCount: vi.fn(),
    handleExtractDescription: vi.fn(),
    handleCreateWithReference: vi.fn(),
    handleAiDesign: vi.fn(),
    handleSubmit: vi.fn(),
    handleSubmitAndGenerate: vi.fn(),
  })),
}))

const messages = {
  assetModal: {
    character: {
      title: 'create character',
      name: 'character name',
      namePlaceholder: 'localized text',
      modeReference: 'reference image mode',
      modeDescription: 'description mode',
      uploadReference: 'upload reference image',
      pasteHint: 'Ctrl+V paste',
      generationMode: 'localized text',
      directGenerate: 'localized text',
      extractPrompt: 'localized text',
      extractFirst: 'localized text',
      description: 'localized text',
      descPlaceholder: 'localized text...',
      isSubAppearance: 'localized text',
      isSubAppearanceHint: 'localized text',
      selectMainCharacter: 'localized text',
      selectCharacterPlaceholder: 'localized text...',
      appearancesCount: '{count} localized text',
      changeReason: 'localized text',
      changeReasonPlaceholder: 'localized text',
      useReferenceGeneratePrefix: 'localized text',
      generateCountSuffix: 'localized text',
      selectReferenceGenerateCount: 'localized text',
    },
    artStyle: { title: 'visual style' },
    aiDesign: {
      title: 'AI localized text',
      placeholder: 'localized text...',
      generating: 'designing...',
      generate: 'generate',
    },
    common: {
      creating: 'localized text...',
      cancel: 'cancel',
      adding: 'localized text...',
      add: 'add',
      addOnly: 'localized text',
      addOnlyToAssetHub: 'localized text',
      addAndGeneratePrefix: 'localized text',
      generateCountSuffix: 'localized text',
      selectGenerateCount: 'localized text',
      optional: '（localized text）',
    },
    errors: {
      uploadFailed: 'localized text',
      extractDescriptionFailed: 'localized text',
      createFailed: 'creation failed',
      aiDesignFailed: 'AI design failed',
      addSubAppearanceFailed: 'localized text',
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

describe('CharacterCreationModal', () => {
  it('renders add-only and add-and-generate actions in the fixed footer', () => {
    Reflect.set(globalThis, 'React', React)
    const html = renderWithIntl(
      createElement(CharacterCreationModal, {
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
