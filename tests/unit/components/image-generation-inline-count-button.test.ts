import * as React from 'react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ImageGenerationInlineCountButton from '@/components/image-generation/ImageGenerationInlineCountButton'

describe('ImageGenerationInlineCountButton', () => {
  it('keeps the select enabled when only the action is disabled', () => {
    Reflect.set(globalThis, 'React', React)

    const html = renderToStaticMarkup(
      createElement(ImageGenerationInlineCountButton, {
        prefix: createElement('span', null, 'generate'),
        suffix: createElement('span', null, 'localized text'),
        value: 3,
        options: [1, 2, 3],
        onValueChange: () => undefined,
        onClick: () => undefined,
        actionDisabled: true,
        selectDisabled: false,
        ariaLabel: 'localized text',
      }),
    )

    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('opacity-60 cursor-not-allowed')
    expect(html).not.toContain('<select disabled=""')
  })
})
