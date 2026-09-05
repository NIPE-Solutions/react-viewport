import { getViewportCssVariableValues, type ViewportCssVariableName } from './css-variables.js'
import type { ViewportState } from './types.js'

export type ViewportCssVariableOwner = object

interface InlineProperty {
  readonly value: string
  readonly priority: string
}

interface PropertyOwnership {
  restore: InlineProperty
  lastWrite: InlineProperty
  readonly owners: Map<ViewportCssVariableOwner, string | null>
}

const ownershipByTarget = new WeakMap<
  HTMLElement,
  Map<ViewportCssVariableName, PropertyOwnership>
>()

export function writeOwnedViewportCssVariables(
  target: HTMLElement,
  owner: ViewportCssVariableOwner,
  state: ViewportState,
): void {
  const targetOwnership = getTargetOwnership(target)

  for (const [name, value] of getViewportCssVariableValues(state)) {
    const property = getPropertyOwnership(target, targetOwnership, name)
    captureConsumerWrite(target, name, property)
    property.owners.set(owner, value)
    applyWinningValue(target, name, property)
  }
}

export function releaseOwnedViewportCssVariables(
  target: HTMLElement,
  owner: ViewportCssVariableOwner,
): void {
  const targetOwnership = ownershipByTarget.get(target)

  if (targetOwnership === undefined) {
    return
  }

  for (const [name, property] of targetOwnership) {
    if (!property.owners.has(owner)) {
      continue
    }

    captureConsumerWrite(target, name, property)
    property.owners.delete(owner)

    if (property.owners.size > 0) {
      applyWinningValue(target, name, property)
      continue
    }

    if (propertiesEqual(readProperty(target, name), property.lastWrite)) {
      writeProperty(target, name, property.restore)
    }
    targetOwnership.delete(name)
  }

  if (targetOwnership.size === 0) {
    ownershipByTarget.delete(target)
  }
}

function getTargetOwnership(target: HTMLElement): Map<ViewportCssVariableName, PropertyOwnership> {
  let ownership = ownershipByTarget.get(target)

  if (ownership === undefined) {
    ownership = new Map()
    ownershipByTarget.set(target, ownership)
  }

  return ownership
}

function getPropertyOwnership(
  target: HTMLElement,
  targetOwnership: Map<ViewportCssVariableName, PropertyOwnership>,
  name: ViewportCssVariableName,
): PropertyOwnership {
  let property = targetOwnership.get(name)

  if (property === undefined) {
    const current = readProperty(target, name)
    property = { restore: current, lastWrite: current, owners: new Map() }
    targetOwnership.set(name, property)
  }

  return property
}

function captureConsumerWrite(
  target: HTMLElement,
  name: ViewportCssVariableName,
  property: PropertyOwnership,
): void {
  const current = readProperty(target, name)

  if (!propertiesEqual(current, property.lastWrite)) {
    property.restore = current
  }
}

function applyWinningValue(
  target: HTMLElement,
  name: ViewportCssVariableName,
  property: PropertyOwnership,
): void {
  const value = [...property.owners.values()].at(-1)

  if (value === undefined) {
    return
  }

  if (value === null) {
    target.style.removeProperty(name)
  } else {
    target.style.setProperty(name, value)
  }
  property.lastWrite = readProperty(target, name)
}

function readProperty(target: HTMLElement, name: ViewportCssVariableName): InlineProperty {
  return {
    value: target.style.getPropertyValue(name),
    priority: target.style.getPropertyPriority(name),
  }
}

function writeProperty(
  target: HTMLElement,
  name: ViewportCssVariableName,
  property: InlineProperty,
): void {
  if (property.value === '') {
    target.style.removeProperty(name)
  } else {
    target.style.setProperty(name, property.value, property.priority)
  }
}

function propertiesEqual(first: InlineProperty, second: InlineProperty): boolean {
  return first.value === second.value && first.priority === second.priority
}
