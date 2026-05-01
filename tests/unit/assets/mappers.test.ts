import { describe, expect, it } from 'vitest'
import { mapGlobalVoiceToAsset, mapProjectCharacterToAsset, mapProjectPropToAsset } from '@/lib/assets/mappers'
import { groupAssetsByKind } from '@/lib/assets/grouping'

describe('asset mappers', () => {
  it('maps project characters into the unified character asset contract', () => {
    const asset = mapProjectCharacterToAsset({
      id: 'character-1',
      name: 'localized text',
      introduction: 'protagonist',
      profileData: JSON.stringify({ archetype: 'lead' }),
      voiceType: 'custom',
      voiceId: 'voice-1',
      customVoiceUrl: 'https://example.com/voice.mp3',
      media: null,
      profileConfirmed: true,
      appearances: [
        {
          id: 'appearance-1',
          appearanceIndex: 0,
          changeReason: 'initial appearance',
          description: 'localized text，localized text',
          imageUrl: 'https://example.com/char.jpg',
          media: null,
          imageUrls: ['https://example.com/char.jpg'],
          imageMedias: [],
          selectedIndex: 0,
          previousImageUrl: null,
          previousMedia: null,
          previousImageUrls: [],
          previousImageMedias: [],
        },
      ],
    })

    expect(asset).toEqual(expect.objectContaining({
      id: 'character-1',
      scope: 'project',
      kind: 'character',
      introduction: 'protagonist',
      profileData: JSON.stringify({ archetype: 'lead' }),
      profileConfirmed: true,
      voice: expect.objectContaining({
        voiceType: 'custom',
        voiceId: 'voice-1',
      }),
    }))
    expect(asset.variants[0]).toEqual(expect.objectContaining({
      id: 'appearance-1',
      index: 0,
      label: 'initial appearance',
    }))
  })

  it('maps global voices into the unified audio asset contract', () => {
    const asset = mapGlobalVoiceToAsset({
      id: 'voice-1',
      name: 'localized text',
      description: 'localized text',
      voiceId: 'voice-provider-1',
      voiceType: 'designed',
      customVoiceUrl: 'https://example.com/voice.mp3',
      media: null,
      voicePrompt: 'localized text',
      gender: 'male',
      language: 'vi',
      folderId: 'folder-1',
    })

    expect(asset).toEqual(expect.objectContaining({
      id: 'voice-1',
      scope: 'global',
      kind: 'voice',
      voiceMeta: expect.objectContaining({
        voiceType: 'designed',
        gender: 'male',
        language: 'vi',
      }),
    }))
  })

  it('maps project props into the unified visual asset contract and groups them by kind', () => {
    const propAsset = mapProjectPropToAsset({
      id: 'prop-1',
      name: 'localized text',
      summary: 'localized text，localized text',
      images: [
        {
          id: 'prop-image-1',
          imageIndex: 0,
          description: 'localized text，localized text',
          imageUrl: 'https://example.com/prop.jpg',
          media: null,
          previousImageUrl: null,
          previousMedia: null,
          isSelected: true,
        },
      ],
    })
    const voiceAsset = mapGlobalVoiceToAsset({
      id: 'voice-1',
      name: 'localized text',
      description: 'localized text',
      voiceId: 'voice-provider-1',
      voiceType: 'designed',
      customVoiceUrl: 'https://example.com/voice.mp3',
      media: null,
      voicePrompt: 'localized text',
      gender: 'male',
      language: 'vi',
      folderId: 'folder-1',
    })

    expect(propAsset).toEqual(expect.objectContaining({
      id: 'prop-1',
      scope: 'project',
      kind: 'prop',
      summary: 'localized text，localized text',
      selectedVariantId: 'prop-image-1',
    }))
    expect(propAsset.variants[0]).toEqual(expect.objectContaining({
      id: 'prop-image-1',
      index: 0,
      description: 'localized text，localized text',
    }))

    const groups = groupAssetsByKind([propAsset, voiceAsset])
    expect(groups.prop.map((asset) => asset.id)).toEqual(['prop-1'])
    expect(groups.voice.map((asset) => asset.id)).toEqual(['voice-1'])
  })
})
