import { describe, expect, it } from 'vitest'
import { getPromptTemplate, PROMPT_IDS } from '@/lib/prompt-i18n'

describe('select prop prompt template', () => {
  it('vi template restricts extraction to key story props and prefers omission when uncertain', () => {
    const template = getPromptTemplate(PROMPT_IDS.NP_SELECT_PROP, 'vi')

    expect(template).toContain('localized text')
    expect(template).toContain('localized text')
    expect(template).toContain('localized text')
    expect(template).toContain('localized text，localized text')
    expect(template).toContain('localized text、localized text，localized text')
  })

  it('en template restricts extraction to key story props and prefers omission when uncertain', () => {
    const template = getPromptTemplate(PROMPT_IDS.NP_SELECT_PROP, 'en')

    expect(template).toContain('key story prop extractor')
    expect(template).toContain('Be conservative')
    expect(template).toContain('explicit story function')
    expect(template).toContain('If you are unsure whether it deserves an asset entry, do not output it')
    expect(template).toContain('A specific-looking noun is not enough')
  })
})
