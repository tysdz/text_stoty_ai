import type { UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import { extractMessageContent } from '@/components/assistant/AssistantChatModal'

function createAssistantMessage(parts: Array<Record<string, unknown>>): UIMessage {
  return {
    id: 'assistant-message',
    role: 'assistant',
    parts,
  } as unknown as UIMessage
}

describe('assistant chat modal message content parser', () => {
  it('keeps reasoning parts out of normal visible lines', () => {
    const message = createAssistantMessage([
      { type: 'reasoning', text: 'localized text' },
      { type: 'text', text: 'localized text status localized text。' },
    ])

    const content = extractMessageContent(message)

    expect(content.lines).toEqual(['localized text status localized text。'])
    expect(content.reasoningLines).toEqual(['localized text'])
  })

  it('extracts think tags from text into reasoning section', () => {
    const message = createAssistantMessage([
      {
        type: 'text',
        text: '<think>localized text create/status/content localized text</think>localized text status back JSON',
      },
    ])

    const content = extractMessageContent(message)

    expect(content.lines).toEqual(['localized text status back JSON'])
    expect(content.reasoningLines).toEqual(['localized text create/status/content localized text'])
  })

  it('extracts reasoning from unclosed think tag during streaming', () => {
    const message = createAssistantMessage([
      {
        type: 'text',
        text: '<think>localized text',
      },
    ])

    const content = extractMessageContent(message)

    expect(content.lines).toEqual([])
    expect(content.reasoningLines).toEqual(['localized text'])
  })

  it('preserves tool output and issues as visible lines', () => {
    const message = createAssistantMessage([
      {
        type: 'tool-saveModelTemplate',
        state: 'output-available',
        output: {
          message: 'localized text',
          issues: [{ field: 'response.statusPath', message: 'missing' }],
        },
      },
    ])

    const content = extractMessageContent(message)

    expect(content.lines).toEqual(['localized text', 'response.statusPath: missing'])
    expect(content.reasoningLines).toEqual([])
  })
})
