import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSafeAreaProbe } from '../../src/safe-area.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('createSafeAreaProbe', () => {
  it('appends one hidden, non-interactive node and measures fractional CSS inset values', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: '1.5px',
      paddingRight: '2.25px',
      paddingBottom: '3.75px',
      paddingLeft: '4px',
    } as CSSStyleDeclaration)

    const probe = createSafeAreaProbe(document)
    const node = document.body.firstElementChild as HTMLElement

    expect(document.body.childElementCount).toBe(1)
    expect(node.style.position).toBe('fixed')
    expect(node.style.width).toBe('0px')
    expect(node.style.height).toBe('0px')
    expect(node.style.visibility).toBe('hidden')
    expect(node.style.pointerEvents).toBe('none')
    expect(probe.measure()).toEqual({ top: 1.5, right: 2.25, bottom: 3.75, left: 4 })
  })

  it('normalizes invalid computed padding values to zero', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: 'invalid',
      paddingRight: '-2px',
      paddingBottom: 'Infinitypx',
      paddingLeft: '3px trailing-content',
    } as CSSStyleDeclaration)

    const probe = createSafeAreaProbe(document)

    expect(probe.measure()).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })

  it('removes only its own node and can be destroyed repeatedly', () => {
    const unrelatedNode = document.createElement('div')
    document.body.append(unrelatedNode)
    const probe = createSafeAreaProbe(document)

    probe.destroy()
    probe.destroy()

    expect(document.body.children).toHaveLength(1)
    expect(document.body.firstElementChild).toBe(unrelatedNode)
  })
})
