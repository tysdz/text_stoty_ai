import { describe, expect, it } from 'vitest'
import { canGenerateLocationBackedAsset, resolveLocationBackedGenerateType } from '@/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/assets/location-backed-asset'

describe('location-backed asset generation rules', () => {
  it('allows props to generate from summary even before any image slot exists', () => {
    expect(canGenerateLocationBackedAsset({
      id: 'prop-1',
      name: 'localized text',
      summary: 'localized text',
      images: [],
    })).toBe(true)
  })

  it('allows locations to generate from seeded image descriptions', () => {
    expect(canGenerateLocationBackedAsset({
      id: 'location-1',
      name: 'rainy night street',
      summary: null,
      images: [
        {
          id: 'image-1',
          imageIndex: 0,
          description: 'localized text',
          imageUrl: null,
          previousImageUrl: null,
          previousDescription: null,
          isSelected: false,
        },
      ],
    })).toBe(true)
  })

  it('routes prop generation through the prop branch', () => {
    expect(resolveLocationBackedGenerateType('prop')).toBe('prop')
    expect(resolveLocationBackedGenerateType('location')).toBe('location')
  })
})
