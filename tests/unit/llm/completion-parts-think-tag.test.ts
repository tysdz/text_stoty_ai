import type OpenAI from 'openai'
import { describe, expect, it } from 'vitest'
import { getCompletionParts } from '@/lib/llm/completion-parts'

function buildCompletion(content: string): OpenAI.Chat.Completions.ChatCompletion {
  return {
    id: 'chatcmpl_test',
    object: 'chat.completion',
    created: 1,
    model: 'minimax-m2.5',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
  } as OpenAI.Chat.Completions.ChatCompletion
}

describe('llm completion parts think-tag parsing', () => {
  it('splits think tag content into reasoning and clean text', () => {
    const completion = buildCompletion(`<think>
localized text，localized text。
</think>

{
  "locations": []
}`)

    const parts = getCompletionParts(completion)

    expect(parts.reasoning).toContain('localized text')
    expect(parts.text).toBe(`{
  "locations": []
}`)
  })

  it('keeps plain content untouched when no think tag exists', () => {
    const completion = buildCompletion('{ "locations": [] }')

    const parts = getCompletionParts(completion)

    expect(parts.reasoning).toBe('')
    expect(parts.text).toBe('{ "locations": [] }')
  })
})
