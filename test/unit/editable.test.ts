import { describe, expect, it } from 'vitest'

import { isKeyboardCapableElement } from '../../src/editable.js'

describe('isKeyboardCapableElement', () => {
  it.each([
    'text',
    'email',
    'number',
    'search',
    'tel',
    'url',
    'password',
    'date',
    'datetime-local',
    'month',
    'time',
    'week',
  ])('accepts input[type=%s]', (type) => {
    const input = document.createElement('input')
    input.type = type

    expect(isKeyboardCapableElement(input)).toBe(true)
  })

  it('accepts textarea, contenteditable, and select elements', () => {
    const textarea = document.createElement('textarea')
    const editable = document.createElement('div')
    const select = document.createElement('select')
    editable.setAttribute('contenteditable', 'true')

    expect(isKeyboardCapableElement(textarea)).toBe(true)
    expect(isKeyboardCapableElement(editable)).toBe(true)
    expect(isKeyboardCapableElement(select)).toBe(true)
  })

  it('rejects disabled or readonly editable controls', () => {
    const disabledInput = document.createElement('input')
    const readonlyInput = document.createElement('input')
    const disabledTextarea = document.createElement('textarea')
    const readonlyTextarea = document.createElement('textarea')
    const disabledSelect = document.createElement('select')
    disabledInput.disabled = true
    readonlyInput.readOnly = true
    disabledTextarea.disabled = true
    readonlyTextarea.readOnly = true
    disabledSelect.disabled = true

    expect(isKeyboardCapableElement(disabledInput)).toBe(false)
    expect(isKeyboardCapableElement(readonlyInput)).toBe(false)
    expect(isKeyboardCapableElement(disabledTextarea)).toBe(false)
    expect(isKeyboardCapableElement(readonlyTextarea)).toBe(false)
    expect(isKeyboardCapableElement(disabledSelect)).toBe(false)
  })

  it.each([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
  ])('rejects input[type=%s]', (type) => {
    const input = document.createElement('input')
    input.type = type

    expect(isKeyboardCapableElement(input)).toBe(false)
  })

  it('rejects null and ordinary elements', () => {
    expect(isKeyboardCapableElement(null)).toBe(false)
    expect(isKeyboardCapableElement(document.createElement('button'))).toBe(false)
  })

  it('classifies editable elements created by another window', () => {
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const input = frame.contentDocument!.createElement('input')
    input.type = 'email'

    expect(isKeyboardCapableElement(input)).toBe(true)

    frame.remove()
  })
})
