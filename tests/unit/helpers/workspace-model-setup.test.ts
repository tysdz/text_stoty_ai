import { describe, expect, it } from 'vitest'
import { hasConfiguredAnalysisModel, readConfiguredAnalysisModel, shouldGuideToModelSetup } from '@/lib/workspace/model-setup'

describe('workspace model setup guidance', () => {
  it('localized text analysisModel -> localized text', () => {
    const payload = {
      preference: {
        analysisModel: 'openai::gpt-4.1',
      },
    }

    expect(hasConfiguredAnalysisModel(payload)).toBe(true)
    expect(readConfiguredAnalysisModel(payload)).toBe('openai::gpt-4.1')
    expect(shouldGuideToModelSetup(payload)).toBe(false)
  })

  it('analysisModel localized text -> localized text', () => {
    const payload = {
      preference: {
        analysisModel: '   ',
      },
    }

    expect(hasConfiguredAnalysisModel(payload)).toBe(false)
    expect(readConfiguredAnalysisModel(payload)).toBeNull()
    expect(shouldGuideToModelSetup(payload)).toBe(true)
  })

  it('payload localized text -> localized text', () => {
    expect(hasConfiguredAnalysisModel(null)).toBe(false)
    expect(readConfiguredAnalysisModel(null)).toBeNull()
    expect(hasConfiguredAnalysisModel({})).toBe(false)
    expect(readConfiguredAnalysisModel({})).toBeNull()
    expect(shouldGuideToModelSetup({})).toBe(true)
  })
})
