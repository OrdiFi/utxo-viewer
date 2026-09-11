import type {
  ContentSpec,
  StructuralDirection,
  StructuralLevel,
  StructuralNumber,
} from './types'

export type StructuralGroupDirective = {
  /*
   * Local role of this inscription in its parent's relation.
   */
  incomingLevel: StructuralLevel | null

  /*
   * Local role of this inscription when it acts as a parent.
   */
  parentLevel: StructuralLevel | null

  /*
   * Local role assigned to this inscription's direct children.
   */
  childLevel: StructuralLevel | null

  /*
   * Ordering among siblings in the incoming relation.
   */
  number: StructuralNumber | null

  /*
   * Direction of this inscription's outgoing child relation.
   */
  childDirection: StructuralDirection

  /*
   * Maximum direct children declared by this local relation.
   */
  maxChildren: StructuralNumber | null
}

export type StructuralCompositionRelation = {
  direction: StructuralDirection
  offset: number
}

function readLevel(
  value: unknown,
): StructuralLevel | null {
  if (typeof value !== 'string') {
    return null
  }

  const level = value.trim().toUpperCase()

  if (!/^[A-J]$/.test(level)) {
    return null
  }

  return level
}

function readDirection(
  value: unknown,
): StructuralDirection | null {
  return value === '+' || value === '-'
    ? value
    : null
}

function readObject(
  value: unknown,
): Record<string, unknown> | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return null
  }

  return value as Record<string, unknown>
}

/*
 * Reads explicit structural instance metadata.
 *
 * Anchor detection:
 *
 *   LEVEL present
 *   OR
 *   DIRECTION present
 *
 * NUMBER alone never creates a structural anchor.
 *
 * Direction defaults to "+" only after structural
 * context has already been established.
 */
export function readStructuralGroupDirective(
  spec: ContentSpec,
): StructuralGroupDirective | null {
  const groups =
    readObject(spec.groups)

  const compose =
    readObject(spec.compose)

  const root =
    readObject(compose?.root)

  const children =
    readObject(compose?.children)

  const displayedContent =
    readObject(compose?.displayedContent) ??
    readObject(spec.displayedContent)

  const incomingLevel =
    readLevel(groups?.level)

  const parentLevel =
    readLevel(root?.level)

  const childLevel =
    readLevel(groups?.childrenLevel) ??
    readLevel(children?.level)

  const explicitDirection =
    readDirection(groups?.side) ??
    readDirection(children?.direction) ??
    readDirection(children?.side) ??
    readDirection(
      displayedContent?.direction,
    )

  const rawNumber =
    Number(groups?.group)

  const number =
    Number.isInteger(rawNumber) &&
    rawNumber > 0
      ? rawNumber
      : null

  const rawMaxChildren =
    Number(
      groups?.maxChildren ??
      children?.maxItems,
    )

  const maxChildren =
    Number.isInteger(rawMaxChildren) &&
    rawMaxChildren > 0
      ? rawMaxChildren
      : null

  const hasStructuralLevel =
    incomingLevel !== null ||
    parentLevel !== null ||
    childLevel !== null

  const hasStructuralDirection =
    explicitDirection !== null

  if (
    !hasStructuralLevel &&
    !hasStructuralDirection
  ) {
    return null
  }

  return {
    incomingLevel,
    parentLevel,
    childLevel,
    number,
    childDirection:
      explicitDirection ?? '+',
    maxChildren,
  }
}

/*
 * Reads the direct physical relationship authored
 * by an anchor.
 */
export function readCompositionRelation(
  spec: ContentSpec,
): StructuralCompositionRelation | null {
  const compose =
    readObject(spec.compose)

  const displayedContent =
    readObject(compose?.displayedContent) ??
    readObject(spec.displayedContent)

  if (!displayedContent) {
    return null
  }

  const direction =
    readDirection(
      displayedContent.direction,
    )

  if (!direction) {
    return null
  }

  const rawOffset =
    Number(displayedContent.offset)

  return {
    direction,
    offset:
      Number.isInteger(rawOffset) &&
      rawOffset >= 0
        ? rawOffset
        : 0,
  }
}
