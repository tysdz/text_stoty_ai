import * as React from 'react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

describe('SegmentedControl', () => {
  it('compact localized text -> localized text', () => {
    Reflect.set(globalThis, 'React', React)

    const html = renderToStaticMarkup(
      createElement(SegmentedControl, {
        options: [
          { value: 'all', label: 'all (24)' },
          { value: 'character', label: 'Character (11)' },
          { value: 'location', label: 'Location (13)' },
          { value: 'prop', label: 'Prop (0)' },
        ],
        value: 'all',
        onChange: () => undefined,
        layout: 'compact',
      }),
    )

    expect(html).toContain('inline-block max-w-full')
    expect(html).toContain('inline-grid grid-flow-col auto-cols-[minmax(96px,max-content)]')
    expect(html).not.toContain('grid-template-columns:repeat(4,minmax(0,1fr))')
  })
})
