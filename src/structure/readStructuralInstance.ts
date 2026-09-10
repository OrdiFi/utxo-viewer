import type {
  ContentSpec,
  StructuralDirection,
  StructuralLevel,
  StructuralNumber,
} from './types'

export type StructuralGroupDirective = {
  level: StructuralLevel
  number: StructuralNumber | null
  direction: StructuralDirection
  childLevel: StructuralLevel | null
}

export type StructuralCompositionRelation = {
  direction: StructuralDirection
  offset: number
}

function readLevel(value: unknown): StructuralLevel | null {
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

/*
 * Reads explicit structural instance metadata.
 *
 * This represents a concrete numbered structural group.
 */
export function readStructuralGroupDirective(
  spec: ContentSpec,
): StructuralGroupDirective | null {
  const groups = spec.groups

  if (
    typeof groups !== 'object' ||
    groups === null ||
    Array.isArray(groups)
  ) {
    return null
  }

  const group = groups as Record<string, unknown>

  const level = readLevel(group.level)
  const direction = readDirection(group.side)
  const childLevel = readLevel(group.childrenLevel)

  const rawNumber = Number(group.group)

  const number =
    Number.isInteger(rawNumber) && rawNumber > 0
      ? rawNumber
      : null

  if (!level || !direction) {
    return null
  }

  return {
    level,
    number,
    direction,
    childLevel,
  }
}

/*
 * Reads the structural relationship between an anchor
 * and content at a relative physical position.
 */
export function readCompositionRelation(
  spec: ContentSpec,
): StructuralCompositionRelation | null {
  const compose =
    typeof spec.compose === 'object' &&
    spec.compose !== null &&
    !Array.isArray(spec.compose)
      ? spec.compose as Record<string, unknown>
      : null

  const displayedContent =
    compose &&
    typeof compose.displayedContent === 'object' &&
    compose.displayedContent !== null &&
    !Array.isArray(compose.displayedContent)
      ? compose.displayedContent as Record<string, unknown>
      : (
          typeof spec.displayedContent === 'object' &&
          spec.displayedContent !== null &&
          !Array.isArray(spec.displayedContent)
            ? spec.displayedContent as Record<string, unknown>
            : null
        )

  if (displayedContent) {
    const direction = readDirection(
      displayedContent.direction,
    )

    if (direction) {
      const rawOffset = Number(
        displayedContent.offset,
      )

      return {
        direction,
        offset:
          Number.isInteger(rawOffset) &&
          rawOffset >= 0
            ? rawOffset
            : 0,
      }
    }
  }

  return null
}
