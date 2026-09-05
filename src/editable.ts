const KEYBOARD_CAPABLE_INPUT_TYPES = new Set([
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
])

function hasEditableContent(element: Element): boolean {
  if ((element as HTMLElement).isContentEditable) {
    return true
  }

  const contentEditable = element.getAttribute('contenteditable')

  return contentEditable !== null && contentEditable.toLowerCase() !== 'false'
}

export function isKeyboardCapableElement(element: Element | null): boolean {
  if (element === null) {
    return false
  }

  if (hasEditableContent(element)) {
    return true
  }

  if (element.tagName === 'TEXTAREA') {
    const textarea = element as HTMLTextAreaElement

    return !textarea.disabled && !textarea.readOnly
  }

  if (element.tagName === 'SELECT') {
    return !(element as HTMLSelectElement).disabled
  }

  if (element.tagName !== 'INPUT') {
    return false
  }

  const input = element as HTMLInputElement

  return !input.disabled && !input.readOnly && KEYBOARD_CAPABLE_INPUT_TYPES.has(input.type)
}
