import * as React from 'react'
import { createElement } from 'react'
import type { ComponentProps, ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import LLMStageStreamCard from '@/components/llm-console/LLMStageStreamCard'

const messages = {
  progress: {
    status: {
      completed: 'completed',
      failed: 'failed',
      processing: 'processing',
      queued: 'queued',
      pending: 'pending',
    },
    stageCard: {
      stage: 'stage',
      realtimeStream: 'live stream',
      currentStage: 'current stage',
      outputTitle: 'AI localized text · {stage}',
      waitingModelOutput: 'localized text...',
      reasoningNotProvided: 'localized text',
    },
    streamStep: {
      analyzeProps: 'prop analysis',
    },
    runtime: {
      llm: {
        processing: 'model processing...',
      },
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

describe('LLMStageStreamCard error rendering', () => {
  it('renders the error without any feedback action entry', () => {
    Reflect.set(globalThis, 'React', React)
    const html = renderWithIntl(
      createElement(LLMStageStreamCard, {
        title: 'content to script',
        stages: [{
          id: 'story_to_script',
          title: 'content to script',
          status: 'failed',
          progress: 0,
        }],
        activeStageId: 'story_to_script',
        outputText: '',
        errorMessage: 'Failed to fetch',
      }),
    )

    expect(html).toContain('Failed to fetch')
    expect(html).not.toContain('localized text')
    expect(html).not.toContain('localized text')
    expect(html).not.toContain('Copy error detail')
    expect(html).not.toContain('Open feedback form')
  })

  it('resolves analyze props progress keys without missing message errors', () => {
    Reflect.set(globalThis, 'React', React)
    const html = renderWithIntl(
      createElement(LLMStageStreamCard, {
        title: 'progress.streamStep.analyzeProps',
        stages: [{
          id: 'analyze_props',
          title: 'progress.streamStep.analyzeProps',
          subtitle: 'progress.streamStep.analyzeProps',
          status: 'processing',
          progress: 35,
        }],
        activeStageId: 'analyze_props',
        activeMessage: 'progress.streamStep.analyzeProps',
        outputText: '',
      }),
    )

    expect(html).toContain('prop analysis')
    expect(html).not.toContain('progress.streamStep.analyzeProps')
    expect(html).not.toContain('MISSING_MESSAGE')
  })
})
