import { describe, expect, it } from 'vitest'
import { buildPromptAssetContext, compileAssetPromptFragments } from '@/lib/assets/services/asset-prompt-context'

describe('asset prompt context', () => {
  it('compiles subject, environment, and prop prompt fragments from the centralized asset context', () => {
    const context = buildPromptAssetContext({
      characters: [
        {
          name: 'localized text/localized text',
          appearances: [
            {
              changeReason: 'initial appearance',
              descriptions: ['localized text，localized text，localized text'],
              selectedIndex: 0,
              description: 'fallback description',
            },
          ],
        },
      ],
      locations: [
        {
          name: 'localized text',
          images: [
            {
              isSelected: true,
              description: 'localized text，localized text，localized text',
            },
          ],
        },
      ],
      props: [
        {
          name: 'localized text',
          summary: 'localized text，localized text',
        },
      ],
      clipCharacters: [{ name: 'localized text' }],
      clipLocation: 'localized text',
      clipProps: ['localized text'],
    })

    expect(compileAssetPromptFragments(context)).toEqual({
      appearanceListText: 'localized text/localized text: ["initial appearance"]',
      fullDescriptionText: '【localized text/localized text - initial appearance】localized text，localized text，localized text',
      locationDescriptionText: 'localized text，localized text，localized text',
      propsDescriptionText: '【localized text】localized text，localized text',
      charactersIntroductionText: 'No character introductions yet',
    })
  })
})
