import { describe, expect, it } from 'vitest'
import {
  serializeStructuredJsonField,
  syncPanelCharacterDependentJson,
} from '@/lib/novel-promotion/panel-ai-data-sync'

describe('panel ai data sync helpers', () => {
  it('removes deleted character from acting notes and photography rules', () => {
    const synced = syncPanelCharacterDependentJson({
      characters: [
        { name: 'localized text/localized text', appearance: 'initial appearance' },
        { name: 'localized text/localized text', appearance: 'initial appearance' },
      ],
      removeIndex: 0,
      actingNotesJson: JSON.stringify([
        { name: 'localized text/localized text', acting: 'localized text' },
        { name: 'localized text/localized text', acting: 'localized text' },
      ]),
      photographyRulesJson: JSON.stringify({
        lighting: {
          direction: 'localized text',
          quality: 'localized text',
        },
        characters: [
          { name: 'localized text/localized text', screen_position: 'left' },
          { name: 'localized text/localized text', screen_position: 'right' },
        ],
      }),
    })

    expect(synced.characters).toEqual([{ name: 'localized text/localized text', appearance: 'initial appearance' }])
    expect(JSON.parse(synced.actingNotesJson || 'null')).toEqual([
      { name: 'localized text/localized text', acting: 'localized text' },
    ])
    expect(JSON.parse(synced.photographyRulesJson || 'null')).toEqual({
      lighting: {
        direction: 'localized text',
        quality: 'localized text',
      },
      characters: [
        { name: 'localized text/localized text', screen_position: 'right' },
      ],
    })
  })

  it('keeps notes by character name when another appearance of same name remains', () => {
    const synced = syncPanelCharacterDependentJson({
      characters: [
        { name: 'localized text/localized text', appearance: 'localized text' },
        { name: 'localized text/localized text', appearance: 'localized text' },
      ],
      removeIndex: 1,
      actingNotesJson: JSON.stringify([
        { name: 'localized text/localized text', acting: 'localized text' },
      ]),
      photographyRulesJson: JSON.stringify({
        characters: [
          { name: 'localized text/localized text', screen_position: 'center' },
        ],
      }),
    })

    expect(JSON.parse(synced.actingNotesJson || 'null')).toEqual([
      { name: 'localized text/localized text', acting: 'localized text' },
    ])
    expect(JSON.parse(synced.photographyRulesJson || 'null')).toEqual({
      characters: [
        { name: 'localized text/localized text', screen_position: 'center' },
      ],
    })
  })

  it('supports double-serialized JSON string inputs', () => {
    const actingNotes = JSON.stringify([{ name: 'localized text', acting: 'localized text' }])
    const doubleSerialized = JSON.stringify(actingNotes)
    expect(serializeStructuredJsonField(doubleSerialized, 'actingNotes')).toBe(actingNotes)
  })

  it('throws on malformed acting notes to avoid silent fallback', () => {
    expect(() => syncPanelCharacterDependentJson({
      characters: [{ name: 'localized text', appearance: 'initial appearance' }],
      removeIndex: 0,
      actingNotesJson: '[{"name":"localized text","acting":"localized text"}, {"acting":"localized text"}]',
      photographyRulesJson: null,
    })).toThrowError('actingNotes item.name must be a non-empty string')
  })
})
