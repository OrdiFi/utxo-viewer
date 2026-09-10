import type {
  StructuralDirection,
  StructuralRelation,
  StructuralSpec,
} from './types'

const LEVEL_PATTERN = /^[A-J]$/

function readLevel(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    !LEVEL_PATTERN.test(value)
  ) {
    throw new Error(
      `${label} level must be one uppercase letter from A to J`,
    )
  }

  return value
}

function readDirection(value: unknown): StructuralDirection {
  if (value === '+' || value === '-') {
    return value
  }

  throw new Error('invalid structural direction')
}

function levelIndex(level: string): number {
  return level.charCodeAt(0) - 'A'.charCodeAt(0)
}

export function readStructuralSpec(
  value: unknown,
): StructuralSpec {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error('spec must be an object')
  }

  const document = value as Record<string, unknown>

  if (
    typeof document.structure !== 'object' ||
    document.structure === null ||
    Array.isArray(document.structure)
  ) {
    throw new Error('spec contains no canonical structure')
  }

  const structure = document.structure as Record<
    string,
    unknown
  >

  if (structure.version !== 1) {
    throw new Error(
      `unsupported structural spec version: ${String(
        structure.version,
      )}`,
    )
  }

  const rootLevel = readLevel(
    structure.rootLevel,
    'root',
  )

  if (
    !Array.isArray(structure.relations) ||
    structure.relations.length === 0
  ) {
    throw new Error(
      'structural spec must contain at least one relation',
    )
  }

  const seenRelations = new Set<string>()

  const relations: StructuralRelation[] =
    structure.relations.map((raw) => {
      if (
        typeof raw !== 'object' ||
        raw === null ||
        Array.isArray(raw)
      ) {
        throw new Error('invalid structural relation')
      }

      const relation = raw as Record<string, unknown>

      const parentLevel = readLevel(
        relation.parentLevel,
        'relation parent',
      )

      const childLevel = readLevel(
        relation.childLevel,
        'relation child',
      )

      if (
        levelIndex(childLevel) !==
        levelIndex(parentLevel) + 1
      ) {
        throw new Error(
          `child level ${childLevel} must directly follow parent level ${parentLevel}`,
        )
      }

      const direction = readDirection(
        relation.direction,
      )

      const maxChildren = relation.maxChildren

      if (
        typeof maxChildren !== 'number' ||
        !Number.isInteger(maxChildren) ||
        maxChildren <= 0
      ) {
        throw new Error(
          `maxChildren must be greater than zero for ${parentLevel} -> ${childLevel} ${direction}`,
        )
      }

      const relationKey =
        `${parentLevel}:${childLevel}:${direction}`

      if (seenRelations.has(relationKey)) {
        throw new Error(
          `duplicate structural relation ${parentLevel} -> ${childLevel} ${direction}`,
        )
      }

      seenRelations.add(relationKey)

      return {
        parentLevel,
        childLevel,
        direction,
        maxChildren,
      }
    })

  const reachable = new Set<string>([rootLevel])

  let changed = true

  while (changed) {
    changed = false

    for (const relation of relations) {
      if (
        reachable.has(relation.parentLevel) &&
        !reachable.has(relation.childLevel)
      ) {
        reachable.add(relation.childLevel)
        changed = true
      }
    }
  }

  for (const relation of relations) {
    if (
      !reachable.has(relation.parentLevel) ||
      !reachable.has(relation.childLevel)
    ) {
      throw new Error(
        `relation ${relation.parentLevel} -> ${relation.childLevel} is not reachable from root level ${rootLevel}`,
      )
    }
  }

  return {
    version: 1,
    rootLevel,
    relations,
  }
}
