import { describe, expect, it } from 'vitest'
import { renderAssistantSystemPrompt } from '@/lib/assistant-platform/system-prompts'

describe('assistant-platform system prompts', () => {
  it('loads api-config-template prompt from lib/prompts/skills and injects providerId', () => {
    const prompt = renderAssistantSystemPrompt('api-config-template', {
      providerId: 'openai-compatible:oa-1',
    })

    expect(prompt).toContain('localized text API localized text')
    expect(prompt).toContain('localized text providerId=openai-compatible:oa-1')
    expect(prompt).not.toContain('{{providerId}}')
  })

  it('loads tutorial prompt from lib/prompts/skills', () => {
    const prompt = renderAssistantSystemPrompt('tutorial')

    expect(prompt).toContain('localized text')
    expect(prompt).toContain('localized text')
  })
})
