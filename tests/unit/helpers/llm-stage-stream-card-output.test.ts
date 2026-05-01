import { describe, expect, it } from 'vitest'
import { splitStructuredOutput } from '@/components/llm-console/LLMStageStreamCard'

describe('LLMStageStreamCard structured output parsing', () => {
  it('moves think-tagged text from final block into reasoning', () => {
    const parsed = splitStructuredOutput(`【localized text】
localized text

【localized text】
<think>localized text</think>
{"locations":[]}`)

    expect(parsed.reasoning).toContain('localized text')
    expect(parsed.reasoning).toContain('localized text')
    expect(parsed.finalText).toBe('{"locations":[]}')
  })

  it('handles unmatched think opening tag during streaming', () => {
    const parsed = splitStructuredOutput(`【localized text】
<think>localized text`)

    expect(parsed.reasoning).toBe('localized text')
    expect(parsed.finalText).toBe('')
  })
})
