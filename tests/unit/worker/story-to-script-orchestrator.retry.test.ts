import { describe, expect, it, vi } from 'vitest'
import { runStoryToScriptOrchestrator } from '@/lib/novel-promotion/story-to-script/orchestrator'

describe('story-to-script orchestrator retry', () => {
  it('retries retryable step failure up to 3 attempts', async () => {
    const actionCalls = new Map<string, number>()
    const characterMetas: Array<{ stepId: string; stepAttempt?: number }> = []
    const runStep = vi.fn(async (meta, _prompt, action: string) => {
      actionCalls.set(action, (actionCalls.get(action) || 0) + 1)

      if (action === 'analyze_characters') {
        characterMetas.push({ stepId: meta.stepId, stepAttempt: meta.stepAttempt })
        const count = actionCalls.get(action) || 0
        if (count < 3) {
          throw new TypeError('terminated')
        }
        return { text: JSON.stringify({ characters: [{ name: 'localized text', introduction: 'localized text' }] }), reasoning: '' }
      }
      if (action === 'analyze_locations') {
        return { text: JSON.stringify({ locations: [{ name: 'localized textA' }] }), reasoning: '' }
      }
      if (action === 'analyze_props') {
        return { text: JSON.stringify({ props: [] }), reasoning: '' }
      }
      if (action === 'split_clips') {
        return {
          text: JSON.stringify([
            {
              start: 'localized text',
              end: 'localized text',
              summary: 'localized text',
              location: 'localized textA',
              characters: ['localized text'],
            },
          ]),
          reasoning: '',
        }
      }
      return { text: JSON.stringify({ scenes: [{ id: 1 }] }), reasoning: '' }
    })

    const result = await runStoryToScriptOrchestrator({
      content: 'localized text。localized text。',
      baseCharacters: [],
      baseLocations: [],
      baseCharacterIntroductions: [],
      promptTemplates: {
        characterPromptTemplate: '{input} {characters_lib_name} {characters_lib_info}',
        locationPromptTemplate: '{input} {locations_lib_name}',
        propPromptTemplate: '{input} {props_lib_name}',
        clipPromptTemplate: '{input} {locations_lib_name} {characters_lib_name} {characters_introduction}',
        screenplayPromptTemplate: '{clip_content} {locations_lib_name} {characters_lib_name} {characters_introduction} {clip_id}',
      },
      runStep,
    })

    expect(result.summary.clipCount).toBe(1)
    expect(actionCalls.get('analyze_characters')).toBe(3)
    expect(characterMetas).toEqual([
      { stepId: 'analyze_characters', stepAttempt: undefined },
      { stepId: 'analyze_characters', stepAttempt: 2 },
      { stepId: 'analyze_characters', stepAttempt: 3 },
    ])
  })

  it('does not retry non-retryable failures', async () => {
    const actionCalls = new Map<string, number>()
    const runStep = vi.fn(async (_meta, _prompt, action: string) => {
      actionCalls.set(action, (actionCalls.get(action) || 0) + 1)
      if (action === 'analyze_characters') {
        throw new Error('SENSITIVE_CONTENT: blocked')
      }
      return { text: JSON.stringify({ locations: [{ name: 'localized textA' }] }), reasoning: '' }
    })

    await expect(
      runStoryToScriptOrchestrator({
        content: 'localized text。localized text。',
        baseCharacters: [],
        baseLocations: [],
        baseCharacterIntroductions: [],
        promptTemplates: {
          characterPromptTemplate: '{input} {characters_lib_name} {characters_lib_info}',
          locationPromptTemplate: '{input} {locations_lib_name}',
          propPromptTemplate: '{input} {props_lib_name}',
          clipPromptTemplate: '{input} {locations_lib_name} {characters_lib_name} {characters_introduction}',
          screenplayPromptTemplate: '{clip_content} {locations_lib_name} {characters_lib_name} {characters_introduction} {clip_id}',
        },
        runStep,
      }),
    ).rejects.toThrow('SENSITIVE_CONTENT')

    expect(actionCalls.get('analyze_characters')).toBe(1)
  })

  it('does not retry Ark invalid parameter errors even if message contains json', async () => {
    const actionCalls = new Map<string, number>()
    const runStep = vi.fn(async (_meta, _prompt, action: string) => {
      actionCalls.set(action, (actionCalls.get(action) || 0) + 1)
      if (action === 'analyze_characters') {
        throw new Error(
          'Ark Responses localized text: 400 - {"error":{"code":"InvalidParameter","message":"json: unknown field \\"reasoning_effort\\""}}',
        )
      }
      return { text: JSON.stringify({ locations: [{ name: 'localized textA' }] }), reasoning: '' }
    })

    await expect(
      runStoryToScriptOrchestrator({
        content: 'localized text。localized text。',
        baseCharacters: [],
        baseLocations: [],
        baseCharacterIntroductions: [],
        promptTemplates: {
          characterPromptTemplate: '{input} {characters_lib_name} {characters_lib_info}',
          locationPromptTemplate: '{input} {locations_lib_name}',
          propPromptTemplate: '{input} {props_lib_name}',
          clipPromptTemplate: '{input} {locations_lib_name} {characters_lib_name} {characters_introduction}',
          screenplayPromptTemplate: '{clip_content} {locations_lib_name} {characters_lib_name} {characters_introduction} {clip_id}',
        },
        runStep,
      }),
    ).rejects.toThrow('unknown field')

    expect(actionCalls.get('analyze_characters')).toBe(1)
  })

  it('parses first balanced JSON block when model appends extra JSON text', async () => {
    const runStep = vi.fn(async (_meta, _prompt, action: string) => {
      if (action === 'analyze_characters') {
        return {
          text: '{"characters":[{"name":"localized text","introduction":"localized text"}]}\n{"extra":"ignored"}',
          reasoning: '',
        }
      }
      if (action === 'analyze_locations') {
        return {
          text: '{"locations":[{"name":"localized textA"}]}\n{"extra":"ignored"}',
          reasoning: '',
        }
      }
      if (action === 'analyze_props') {
        return {
          text: '{"props":[]}\n{"extra":"ignored"}',
          reasoning: '',
        }
      }
      if (action === 'split_clips') {
        return {
          text: '[{"start":"localized text","end":"localized text","summary":"localized text","location":"localized textA","characters":["localized text"]}]\n{"extra":"ignored"}',
          reasoning: '',
        }
      }
      if (action === 'screenplay_conversion') {
        return {
          text: '{"scenes":[{"scene_number":1,"content":[{"type":"action","text":"localized text。"}]}]}\n{"extra":"ignored"}',
          reasoning: '',
        }
      }
      throw new Error(`unexpected action: ${action}`)
    })

    const result = await runStoryToScriptOrchestrator({
      content: 'localized text。localized text。',
      baseCharacters: [],
      baseLocations: [],
      baseCharacterIntroductions: [],
      promptTemplates: {
        characterPromptTemplate: '{input} {characters_lib_name} {characters_lib_info}',
        locationPromptTemplate: '{input} {locations_lib_name}',
        propPromptTemplate: '{input} {props_lib_name}',
        clipPromptTemplate: '{input} {locations_lib_name} {characters_lib_name} {characters_introduction}',
        screenplayPromptTemplate: '{clip_content} {locations_lib_name} {characters_lib_name} {characters_introduction} {clip_id}',
      },
      runStep,
    })

    expect(result.summary.clipCount).toBe(1)
    expect(result.summary.screenplayFailedCount).toBe(0)
    expect(result.summary.screenplaySuccessCount).toBe(1)
    expect(result.screenplayResults[0]).toMatchObject({
      clipId: 'clip_1',
      success: true,
      sceneCount: 1,
    })
  })

  it('enforces topology: split waits for analyses, screenplay waits for split', async () => {
    const actionOrder: string[] = []
    const runStep = vi.fn(async (_meta, _prompt, action: string) => {
      actionOrder.push(action)
      if (action === 'analyze_characters') {
        return { text: JSON.stringify({ characters: [{ name: 'localized text', introduction: 'localized text' }] }), reasoning: '' }
      }
      if (action === 'analyze_locations') {
        return { text: JSON.stringify({ locations: [{ name: 'localized textA' }] }), reasoning: '' }
      }
      if (action === 'analyze_props') {
        return { text: JSON.stringify({ props: [] }), reasoning: '' }
      }
      if (action === 'split_clips') {
        return {
          text: JSON.stringify([
            {
              start: 'localized text',
              end: 'localized text',
              summary: 'localized text',
              location: 'localized textA',
              characters: ['localized text'],
            },
          ]),
          reasoning: '',
        }
      }
      if (action === 'screenplay_conversion') {
        return {
          text: JSON.stringify({ scenes: [{ scene_number: 1 }] }),
          reasoning: '',
        }
      }
      throw new Error(`unexpected action: ${action}`)
    })

    const result = await runStoryToScriptOrchestrator({
      content: 'localized text。localized text。',
      baseCharacters: [],
      baseLocations: [],
      baseCharacterIntroductions: [],
      promptTemplates: {
        characterPromptTemplate: '{input} {characters_lib_name} {characters_lib_info}',
        locationPromptTemplate: '{input} {locations_lib_name}',
        propPromptTemplate: '{input} {props_lib_name}',
        clipPromptTemplate: '{input} {locations_lib_name} {characters_lib_name} {characters_introduction}',
        screenplayPromptTemplate: '{clip_content} {locations_lib_name} {characters_lib_name} {characters_introduction} {clip_id}',
      },
      runStep,
    })

    expect(result.summary.clipCount).toBe(1)
    const analyzeCharactersIndex = actionOrder.indexOf('analyze_characters')
    const analyzeLocationsIndex = actionOrder.indexOf('analyze_locations')
    const splitIndex = actionOrder.indexOf('split_clips')
    const screenplayIndex = actionOrder.indexOf('screenplay_conversion')
    expect(splitIndex).toBeGreaterThan(Math.max(analyzeCharactersIndex, analyzeLocationsIndex))
    expect(screenplayIndex).toBeGreaterThan(splitIndex)
  })

  it('limits screenplay conversion fan-out by configured concurrency', async () => {
    let activeScreenplay = 0
    let maxActiveScreenplay = 0

    const runStep = vi.fn(async (_meta, _prompt, action: string) => {
      if (action === 'analyze_characters') {
        return { text: JSON.stringify({ characters: [{ name: 'localized text', introduction: 'localized text' }] }), reasoning: '' }
      }
      if (action === 'analyze_locations') {
        return { text: JSON.stringify({ locations: [{ name: 'localized textA' }] }), reasoning: '' }
      }
      if (action === 'analyze_props') {
        return { text: JSON.stringify({ props: [] }), reasoning: '' }
      }
      if (action === 'split_clips') {
        return {
          text: JSON.stringify([
            { start: 'localized text', end: 'localized text', summary: 'localized text1', location: 'localized textA', characters: ['localized text'] },
            { start: 'localized text', end: 'localized text', summary: 'localized text2', location: 'localized textA', characters: ['localized text'] },
            { start: 'localized text', end: 'localized text', summary: 'localized text3', location: 'localized textA', characters: ['localized text'] },
          ]),
          reasoning: '',
        }
      }
      if (action === 'screenplay_conversion') {
        activeScreenplay += 1
        maxActiveScreenplay = Math.max(maxActiveScreenplay, activeScreenplay)
        await new Promise((resolve) => setTimeout(resolve, 5))
        activeScreenplay -= 1
        return { text: JSON.stringify({ scenes: [{ scene_number: 1 }] }), reasoning: '' }
      }
      throw new Error(`unexpected action: ${action}`)
    })

    const result = await runStoryToScriptOrchestrator({
      concurrency: 1,
      content: 'localized text。localized text。localized text。localized text。localized text。localized text。',
      baseCharacters: [],
      baseLocations: [],
      baseCharacterIntroductions: [],
      promptTemplates: {
        characterPromptTemplate: '{input} {characters_lib_name} {characters_lib_info}',
        locationPromptTemplate: '{input} {locations_lib_name}',
        propPromptTemplate: '{input} {props_lib_name}',
        clipPromptTemplate: '{input} {locations_lib_name} {characters_lib_name} {characters_introduction}',
        screenplayPromptTemplate: '{clip_content} {locations_lib_name} {characters_lib_name} {characters_introduction} {clip_id}',
      },
      runStep,
    })

    expect(result.summary.clipCount).toBe(3)
    expect(result.summary.screenplaySuccessCount).toBe(3)
    expect(maxActiveScreenplay).toBe(1)
  })
})
