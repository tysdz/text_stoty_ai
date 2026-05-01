import { describe, expect, it, vi } from 'vitest'
import { runScriptToStoryboardOrchestrator } from '@/lib/novel-promotion/script-to-storyboard/orchestrator'

describe('script-to-storyboard orchestrator retry', () => {
  it('retries retryable step failures up to 3 attempts', async () => {
    const attemptsByAction = new Map<string, number>()
    const phase1Metas: Array<{ stepId: string; stepAttempt?: number }> = []
    const runStep = vi.fn(async (meta, _prompt, action: string) => {
      attemptsByAction.set(action, (attemptsByAction.get(action) || 0) + 1)

      if (action === 'storyboard_phase1_plan') {
        phase1Metas.push({ stepId: meta.stepId, stepAttempt: meta.stepAttempt })
        const attempt = attemptsByAction.get(action) || 0
        if (attempt < 3) {
          throw new TypeError('terminated')
        }
        return {
          text: JSON.stringify([{ panel_number: 1, description: 'localized text', location: 'LocationA', source_text: 'localized text', characters: [] }]),
          reasoning: '',
        }
      }

      if (action === 'storyboard_phase2_cinematography') {
        return { text: JSON.stringify([{ panel_number: 1, composition: 'localized text' }]), reasoning: '' }
      }
      if (action === 'storyboard_phase2_acting') {
        return { text: JSON.stringify([{ panel_number: 1, characters: [] }]), reasoning: '' }
      }
      return {
        text: JSON.stringify([{ panel_number: 1, description: 'localized text', location: 'LocationA', source_text: 'localized text', characters: [] }]),
        reasoning: '',
      }
    })

    const result = await runScriptToStoryboardOrchestrator({
      clips: [
        {
          id: 'clip-1',
          content: 'localized text',
          characters: JSON.stringify([{ name: 'CharacterA' }]),
          location: 'LocationA',
          screenplay: null,
        },
      ],
      novelPromotionData: {
        characters: [{ name: 'CharacterA', appearances: [] }],
        locations: [{ name: 'LocationA', images: [] }],
      },
      promptTemplates: {
        phase1PlanTemplate: '{clip_content} {clip_json} {characters_lib_name} {locations_lib_name} {characters_introduction} {characters_appearance_list} {characters_full_description}',
        phase2CinematographyTemplate: '{panels_json} {panel_count} {locations_description} {characters_info}',
        phase2ActingTemplate: '{panels_json} {panel_count} {characters_info}',
        phase3DetailTemplate: '{panels_json} {characters_age_gender} {locations_description}',
      },
      runStep,
    })

    expect(result.summary.clipCount).toBe(1)
    expect(runStep).toHaveBeenCalled()
    expect(attemptsByAction.get('storyboard_phase1_plan')).toBe(3)
    expect(phase1Metas).toEqual([
      { stepId: 'clip_clip-1_phase1', stepAttempt: undefined },
      { stepId: 'clip_clip-1_phase1', stepAttempt: 2 },
      { stepId: 'clip_clip-1_phase1', stepAttempt: 3 },
    ])
  })

  it('does not retry non-retryable step failure', async () => {
    let callCount = 0
    const runStep = vi.fn(async () => {
      callCount += 1
      throw new Error('SENSITIVE_CONTENT: blocked')
    })

    await expect(
      runScriptToStoryboardOrchestrator({
        clips: [
          {
            id: 'clip-1',
            content: 'localized text',
            characters: JSON.stringify([{ name: 'CharacterA' }]),
            location: 'LocationA',
            screenplay: null,
          },
        ],
        novelPromotionData: {
          characters: [{ name: 'CharacterA', appearances: [] }],
          locations: [{ name: 'LocationA', images: [] }],
        },
        promptTemplates: {
          phase1PlanTemplate: '{clip_content} {clip_json} {characters_lib_name} {locations_lib_name} {characters_introduction} {characters_appearance_list} {characters_full_description}',
          phase2CinematographyTemplate: '{panels_json} {panel_count} {locations_description} {characters_info}',
          phase2ActingTemplate: '{panels_json} {panel_count} {characters_info}',
          phase3DetailTemplate: '{panels_json} {characters_age_gender} {locations_description}',
        },
        runStep,
      }),
    ).rejects.toThrow('SENSITIVE_CONTENT')

    expect(callCount).toBe(1)
  })

  it('does not retry Ark invalid parameter error even when message contains json', async () => {
    let callCount = 0
    const runStep = vi.fn(async () => {
      callCount += 1
      throw new Error(
        'Ark Responses localized text: 400 - {"error":{"code":"InvalidParameter","message":"json: unknown field \\"reasoning_effort\\""}}',
      )
    })

    await expect(
      runScriptToStoryboardOrchestrator({
        clips: [
          {
            id: 'clip-1',
            content: 'localized text',
            characters: JSON.stringify([{ name: 'CharacterA' }]),
            location: 'LocationA',
            screenplay: null,
          },
        ],
        novelPromotionData: {
          characters: [{ name: 'CharacterA', appearances: [] }],
          locations: [{ name: 'LocationA', images: [] }],
        },
        promptTemplates: {
          phase1PlanTemplate: '{clip_content} {clip_json} {characters_lib_name} {locations_lib_name} {characters_introduction} {characters_appearance_list} {characters_full_description}',
          phase2CinematographyTemplate: '{panels_json} {panel_count} {locations_description} {characters_info}',
          phase2ActingTemplate: '{panels_json} {panel_count} {characters_info}',
          phase3DetailTemplate: '{panels_json} {characters_age_gender} {locations_description}',
        },
        runStep,
      }),
    ).rejects.toThrow('unknown field')

    expect(callCount).toBe(1)
  })

  it('enforces topology: phase3 runs after both phase2 steps complete', async () => {
    const actionOrder: string[] = []
    const runStep = vi.fn(async (_meta, _prompt, action: string) => {
      actionOrder.push(action)
      if (action === 'storyboard_phase1_plan') {
        return {
          text: JSON.stringify([{ panel_number: 1, description: 'localized text', location: 'LocationA', source_text: 'localized text', characters: [] }]),
          reasoning: '',
        }
      }
      if (action === 'storyboard_phase2_cinematography') {
        return { text: JSON.stringify([{ panel_number: 1, composition: 'localized text' }]), reasoning: '' }
      }
      if (action === 'storyboard_phase2_acting') {
        return { text: JSON.stringify([{ panel_number: 1, characters: [] }]), reasoning: '' }
      }
      if (action === 'storyboard_phase3_detail') {
        return {
          text: JSON.stringify([{ panel_number: 1, description: 'localized text', location: 'LocationA', source_text: 'localized text', characters: [] }]),
          reasoning: '',
        }
      }
      throw new Error(`unexpected action: ${action}`)
    })

    const result = await runScriptToStoryboardOrchestrator({
      clips: [
        {
          id: 'clip-1',
          content: 'localized text',
          characters: JSON.stringify([{ name: 'CharacterA' }]),
          location: 'LocationA',
          screenplay: null,
        },
      ],
      novelPromotionData: {
        characters: [{ name: 'CharacterA', appearances: [] }],
        locations: [{ name: 'LocationA', images: [] }],
      },
      promptTemplates: {
        phase1PlanTemplate: '{clip_content} {clip_json} {characters_lib_name} {locations_lib_name} {characters_introduction} {characters_appearance_list} {characters_full_description}',
        phase2CinematographyTemplate: '{panels_json} {panel_count} {locations_description} {characters_info}',
        phase2ActingTemplate: '{panels_json} {panel_count} {characters_info}',
        phase3DetailTemplate: '{panels_json} {characters_age_gender} {locations_description}',
      },
      runStep,
    })

    expect(result.summary.clipCount).toBe(1)
    const phase3Index = actionOrder.indexOf('storyboard_phase3_detail')
    const phase2CineIndex = actionOrder.indexOf('storyboard_phase2_cinematography')
    const phase2ActingIndex = actionOrder.indexOf('storyboard_phase2_acting')
    expect(phase3Index).toBeGreaterThan(phase2CineIndex)
    expect(phase3Index).toBeGreaterThan(phase2ActingIndex)
  })

  it('limits clip fan-out by configured concurrency', async () => {
    let activePhase1 = 0
    let maxActivePhase1 = 0

    const runStep = vi.fn(async (_meta, _prompt, action: string) => {
      if (action === 'storyboard_phase1_plan') {
        activePhase1 += 1
        maxActivePhase1 = Math.max(maxActivePhase1, activePhase1)
        await new Promise((resolve) => setTimeout(resolve, 5))
        activePhase1 -= 1
        return {
          text: JSON.stringify([{ panel_number: 1, description: 'localized text', location: 'LocationA', source_text: 'localized text', characters: [] }]),
          reasoning: '',
        }
      }
      if (action === 'storyboard_phase2_cinematography') {
        return {
          text: JSON.stringify([{
            panel_number: 1,
            composition: 'localized text',
            lighting: 'localized text',
            color_palette: 'localized text',
            atmosphere: 'localized text',
            technical_notes: 'note',
          }]),
          reasoning: '',
        }
      }
      if (action === 'storyboard_phase2_acting') {
        return { text: JSON.stringify([{ panel_number: 1, characters: [] }]), reasoning: '' }
      }
      if (action === 'storyboard_phase3_detail') {
        return {
          text: JSON.stringify([{ panel_number: 1, description: 'localized text', location: 'LocationA', source_text: 'localized text', characters: [] }]),
          reasoning: '',
        }
      }
      throw new Error(`unexpected action: ${action}`)
    })

    const result = await runScriptToStoryboardOrchestrator({
      concurrency: 1,
      clips: [
        {
          id: 'clip-1',
          content: 'localized text1',
          characters: JSON.stringify([{ name: 'CharacterA' }]),
          location: 'LocationA',
          screenplay: null,
        },
        {
          id: 'clip-2',
          content: 'localized text2',
          characters: JSON.stringify([{ name: 'CharacterA' }]),
          location: 'LocationA',
          screenplay: null,
        },
        {
          id: 'clip-3',
          content: 'localized text3',
          characters: JSON.stringify([{ name: 'CharacterA' }]),
          location: 'LocationA',
          screenplay: null,
        },
      ],
      novelPromotionData: {
        characters: [{ name: 'CharacterA', appearances: [] }],
        locations: [{ name: 'LocationA', images: [] }],
      },
      promptTemplates: {
        phase1PlanTemplate: '{clip_content} {clip_json} {characters_lib_name} {locations_lib_name} {characters_introduction} {characters_appearance_list} {characters_full_description}',
        phase2CinematographyTemplate: '{panels_json} {panel_count} {locations_description} {characters_info}',
        phase2ActingTemplate: '{panels_json} {panel_count} {characters_info}',
        phase3DetailTemplate: '{panels_json} {characters_age_gender} {locations_description}',
      },
      runStep,
    })

    expect(result.summary.clipCount).toBe(3)
    expect(maxActivePhase1).toBe(1)
  })
})
