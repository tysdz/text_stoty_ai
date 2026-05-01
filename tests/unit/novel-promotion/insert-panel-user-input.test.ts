import { describe, expect, it } from 'vitest'
import { resolveInsertPanelUserInput } from '@/lib/novel-promotion/insert-panel'

describe('insert panel user input normalization', () => {
  it('uses localized default instruction when AI analyze sends empty input', () => {
    expect(resolveInsertPanelUserInput({ userInput: '' }, 'vi')).toBe(
      'Automatically analyze surrounding shots and insert a naturally connected new panel。',
    )
    expect(resolveInsertPanelUserInput({ userInput: '   ' }, 'en')).toBe(
      'Automatically analyze the surrounding panels and insert a naturally connected new panel.',
    )
  })

  it('prefers explicit user input over fallback prompt or default', () => {
    expect(resolveInsertPanelUserInput({
      userInput: '  add a close-up reaction shot  ',
      prompt: 'unused prompt',
    }, 'vi')).toBe('add a close-up reaction shot')
  })

  it('falls back to prompt when userInput is missing', () => {
    expect(resolveInsertPanelUserInput({
      prompt: '  Insert a pause beat between these panels.  ',
    }, 'en')).toBe('Insert a pause beat between these panels.')
  })
})
