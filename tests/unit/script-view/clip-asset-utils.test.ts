import { describe, expect, it } from 'vitest'
import { getAllClipsAssets, parseClipAssets } from '@/app/[locale]/workspace/[projectId]/modes/novel-promotion/components/script-view/clip-asset-utils'

describe('clip asset utils', () => {
  it('parses prop names from clip JSON payloads', () => {
    const parsed = parseClipAssets({
      characters: '[{"name":"localized text","appearance":"initial appearance"}]',
      location: 'localized text',
      props: '["localized text","localized text"]',
    })

    expect(Array.from(parsed.propNames)).toEqual(['localized text', 'localized text'])
  })

  it('aggregates prop names across clips', () => {
    const all = getAllClipsAssets([
      { props: '["localized text"]' },
      { props: '["localized text","localized text"]' },
    ])

    expect(Array.from(all.allPropNames)).toEqual(['localized text', 'localized text', 'localized text'])
  })
})
