import type {
  InscriptionId,
  StructuralDirection,
  StructuralGroup,
} from './types'

import type {
  StructuralCompositionRelation,
  StructuralGroupDirective,
} from './readStructuralInstance'

export type PhysicalMember = {
  id: InscriptionId
  offset: number
  postage: number

  group: StructuralGroupDirective | null
  relation: StructuralCompositionRelation | null
}

type IndexedMember = {
  member: PhysicalMember
  index: number
}

type ParentRelation = {
  parent: IndexedMember
  direction: StructuralDirection
}

function rangeOf(
  members: PhysicalMember[],
): {
  offset: number
  end: number
  postage: number
} {
  if (members.length === 0) {
    throw new Error(
      'cannot calculate empty structural range',
    )
  }

  for (const member of members) {
    if (
      !Number.isInteger(member.offset) ||
      member.offset < 0
    ) {
      throw new Error(
        `invalid physical offset for ${member.id}`,
      )
    }

    if (
      !Number.isInteger(member.postage) ||
      member.postage <= 0
    ) {
      throw new Error(
        `invalid physical postage for ${member.id}`,
      )
    }
  }

  const ordered = [...members].sort(
    (a, b) => a.offset - b.offset,
  )

  const first = ordered[0]
  const last =
    ordered[ordered.length - 1]

  const end =
    last.offset + last.postage

  return {
    offset: first.offset,
    end,
    postage: end - first.offset,
  }
}

function uniquePhysicalMembers(
  members: PhysicalMember[],
): PhysicalMember[] {
  const byId =
    new Map<InscriptionId, PhysicalMember>()

  for (const member of members) {
    byId.set(member.id, member)
  }

  return [...byId.values()].sort(
    (a, b) => a.offset - b.offset,
  )
}

function relatedPhysicalMember(
  anchor: IndexedMember,
  ordered: PhysicalMember[],
): PhysicalMember | null {
  const relation =
    anchor.member.relation

  if (!relation) {
    return null
  }

  const distance =
    relation.offset + 1

  const index =
    relation.direction === '-'
      ? anchor.index - distance
      : anchor.index + distance

  return ordered[index] ?? null
}

function numberForAnchor(
  anchor: IndexedMember,
  siblings: IndexedMember[],
): number {
  const explicit =
    anchor.member.group?.number

  if (
    explicit !== null &&
    explicit !== undefined
  ) {
    return explicit
  }

  const ordered =
    [...siblings].sort(
      (a, b) =>
        a.member.offset -
        b.member.offset,
    )

  const position =
    ordered.findIndex(
      (candidate) =>
        candidate.member.id ===
        anchor.member.id,
    )

  return position >= 0
    ? position + 1
    : 1
}

function sameParentCohort(
  left: IndexedMember,
  right: IndexedMember,
): boolean {
  const a = left.member.group
  const b = right.member.group

  if (!a || !b) {
    return false
  }

  return (
    a.incomingLevel ===
      b.incomingLevel &&
    a.parentLevel ===
      b.parentLevel &&
    a.childLevel ===
      b.childLevel &&
    a.childDirection ===
      b.childDirection
  )
}

/*
 * Resolve local structural relations from observed
 * physical UTXO data.
 *
 * Important:
 *
 * LEVEL is local to a relation.
 *
 * A child may therefore be:
 *
 *   B in its parent's relation
 *
 * while simultaneously acting as:
 *
 *   A in its own child relation.
 *
 * Inscription id is the stable node identity.
 *
 * This resolver does not validate BCE transaction
 * validity, dust policy or composition legality.
 */
export function resolveStructuralGroups(
  physicalMembers: PhysicalMember[],
): StructuralGroup[] {
  const ordered =
    [...physicalMembers].sort(
      (a, b) =>
        a.offset - b.offset,
    )

  const anchors: IndexedMember[] =
    ordered
      .map((member, index) => ({
        member,
        index,
      }))
      .filter(
        ({ member }) =>
          member.group !== null,
      )

  const parentOf =
    new Map<
      InscriptionId,
      ParentRelation
    >()

  /*
   * Resolve anchor-to-anchor ownership bottom-up.
   *
   * A parent is resolved only after structural parents
   * inside its candidate range have already been resolved.
   *
   * This prevents an outer structure from claiming members
   * that actually belong to a nested child subtree.
   *
   * Example:
   *
   *   ROOT A->B
   *     NODE B / A->B
   *       LEAF B
   *
   * NODE owns LEAF first.
   * ROOT then owns NODE, not LEAF.
   */
  const structuralParents =
    anchors.filter(
      (anchor) =>
        anchor.member.group
          ?.childLevel !== null,
    )

  const pendingParents =
    new Set<InscriptionId>(
      structuralParents.map(
        (anchor) =>
          anchor.member.id,
      ),
    )

  function candidatesForParent(
    parent: IndexedMember,
  ): IndexedMember[] {
    const directive =
      parent.member.group

    if (
      !directive ||
      directive.childLevel === null
    ) {
      return []
    }

    const cohort =
      anchors.filter(
        (candidate) =>
          sameParentCohort(
            candidate,
            parent,
          ),
      )

    const cohortPosition =
      cohort.findIndex(
        (candidate) =>
          candidate.member.id ===
          parent.member.id,
      )

    const previousBoundary =
      cohortPosition > 0
        ? cohort[
            cohortPosition - 1
          ].index
        : -1

    const nextBoundary =
      cohortPosition >= 0 &&
      cohortPosition + 1 <
        cohort.length
        ? cohort[
            cohortPosition + 1
          ].index
        : ordered.length

    const inDirectionRange =
      anchors.filter(
        (candidate) => {
          if (
            candidate.member.id ===
            parent.member.id
          ) {
            return false
          }

          return (
            directive.childDirection === '+'
              ? (
                  candidate.index >
                    parent.index &&
                  candidate.index <
                    nextBoundary
                )
              : (
                  candidate.index >
                    previousBoundary &&
                  candidate.index <
                    parent.index
                )
          )
        },
      )

    const explicit =
      inDirectionRange.filter(
        (candidate) =>
          candidate.member.group
            ?.incomingLevel ===
          directive.childLevel,
      )

    const fallback =
      inDirectionRange.filter(
        (candidate) =>
          candidate.member.group
            ?.incomingLevel === null,
      )

    return explicit.length > 0
      ? explicit
      : fallback
  }

  while (pendingParents.size > 0) {
    let progressed = false

    for (const parent of structuralParents) {
      if (
        !pendingParents.has(
          parent.member.id,
        )
      ) {
        continue
      }

      const directive =
        parent.member.group

      if (
        !directive ||
        directive.childLevel === null
      ) {
        pendingParents.delete(
          parent.member.id,
        )
        progressed = true
        continue
      }

      const candidates =
        candidatesForParent(parent)

      /*
       * If another unresolved structural parent lies
       * inside this parent's candidate range, resolve
       * that inner parent first.
       */
      const hasPendingNestedParent =
        candidates.some(
          (candidate) =>
            pendingParents.has(
              candidate.member.id,
            ),
        )

      if (hasPendingNestedParent) {
        continue
      }

      /*
       * Members already owned by an inner subtree are
       * not direct children of this parent.
       */
      const directCandidates =
        candidates.filter(
          (candidate) =>
            !parentOf.has(
              candidate.member.id,
            ),
        )

      if (
        directive.maxChildren !== null &&
        directCandidates.length >
          directive.maxChildren
      ) {
        throw new Error(
          `structural relation on ${parent.member.id} exceeds maxChildren ${directive.maxChildren}`,
        )
      }

      for (
        const candidate
        of directCandidates
      ) {
        parentOf.set(
          candidate.member.id,
          {
            parent,
            direction:
              directive.childDirection,
          },
        )
      }

      pendingParents.delete(
        parent.member.id,
      )

      progressed = true
    }

    if (!progressed) {
      throw new Error(
        'ambiguous or cyclic structural parent relations',
      )
    }
  }

  const anchorChildren =
    new Map<
      InscriptionId,
      IndexedMember[]
    >()

  for (const anchor of anchors) {
    const relation =
      parentOf.get(anchor.member.id)

    if (!relation) {
      continue
    }

    const parentId =
      relation.parent.member.id

    const list =
      anchorChildren.get(parentId) ??
      []

    list.push(anchor)

    anchorChildren.set(
      parentId,
      list,
    )
  }

  const resolving =
    new Set<InscriptionId>()

  const resolved =
    new Map<
      InscriptionId,
      StructuralGroup
    >()

  function buildGroup(
    anchor: IndexedMember,
  ): StructuralGroup {
    const cached =
      resolved.get(
        anchor.member.id,
      )

    if (cached) {
      return cached
    }

    if (
      resolving.has(
        anchor.member.id,
      )
    ) {
      throw new Error(
        `structural cycle at ${anchor.member.id}`,
      )
    }

    resolving.add(
      anchor.member.id,
    )

    const directive =
      anchor.member.group

    if (!directive) {
      throw new Error(
        `missing structural directive for ${anchor.member.id}`,
      )
    }

    const relationToParent =
      parentOf.get(
        anchor.member.id,
      )

    const siblingAnchors =
      relationToParent
        ? (
            anchorChildren.get(
              relationToParent.parent
                .member.id,
            ) ?? [anchor]
          )
        : [anchor]

    const incomingNumber =
      relationToParent
        ? numberForAnchor(
            anchor,
            siblingAnchors,
          )
        : null

    const childrenAnchors =
      anchorChildren.get(
        anchor.member.id,
      ) ?? []

    const seenNumbers =
      new Set<number>()

    const children =
      childrenAnchors.map(
        (childAnchor) => {
          const childNumber =
            numberForAnchor(
              childAnchor,
              childrenAnchors,
            )

          if (
            seenNumbers.has(
              childNumber,
            )
          ) {
            throw new Error(
              `duplicate structural child number ${childNumber} on ${anchor.member.id}`,
            )
          }

          seenNumbers.add(
            childNumber,
          )

          return buildGroup(
            childAnchor,
          )
        },
      )

    const related =
      relatedPhysicalMember(
        anchor,
        ordered,
      )

    /*
     * A related non-anchor may be represented as
     * a terminal structural child when this anchor
     * explicitly declares a child level.
     *
     * A direction-only Case does not need to invent
     * such a level; its referenced content remains
     * a direct physical member of the Case group.
     */
    if (
      directive.childLevel !== null &&
      related !== null &&
      related.group === null
    ) {
      if (
        seenNumbers.has(1)
      ) {
        throw new Error(
          `duplicate structural child number 1 on ${anchor.member.id}`,
        )
      }

      seenNumbers.add(1)

      const geometry =
        rangeOf([related])

      children.push({
        rootId: related.id,
        parentId:
          anchor.member.id,

        relationFromParent: {
          parentLevel:
            directive.parentLevel,
          childLevel:
            directive.childLevel,
          direction:
            directive.childDirection,
          number: 1,
        },

        relationToChildren: null,

        ...geometry,

        members: [related.id],
        children: [],
      })
    }

    children.sort(
      (a, b) => {
        const an =
          a.relationFromParent
            ?.number

        const bn =
          b.relationFromParent
            ?.number

        if (
          an !== null &&
          an !== undefined &&
          bn !== null &&
          bn !== undefined &&
          an !== bn
        ) {
          return an - bn
        }

        return a.offset - b.offset
      },
    )

    const physical:
      PhysicalMember[] = [
        anchor.member,
      ]

    if (related) {
      physical.push(related)
    }

    for (
      const childAnchor
      of childrenAnchors
    ) {
      const childGroup =
        resolved.get(
          childAnchor.member.id,
        ) ??
        buildGroup(
          childAnchor,
        )

      for (
        const memberId
        of childGroup.members
      ) {
        const member =
          ordered.find(
            (entry) =>
              entry.id ===
              memberId,
          )

        if (member) {
          physical.push(member)
        }
      }
    }

    const members =
      uniquePhysicalMembers(
        physical,
      )

    const geometry =
      rangeOf(members)

    const parentDirective =
      relationToParent
        ?.parent.member.group ??
      null

    const group:
      StructuralGroup = {
        rootId:
          anchor.member.id,

        parentId:
          relationToParent
            ? relationToParent
                .parent.member.id
            : null,

        relationFromParent:
          relationToParent &&
          parentDirective
            ? {
                parentLevel:
                  parentDirective
                    .parentLevel,
                childLevel:
                  parentDirective
                    .childLevel,
                direction:
                  relationToParent
                    .direction,
                number:
                  incomingNumber,
              }
            : null,

        relationToChildren: {
          parentLevel:
            directive.parentLevel,
          childLevel:
            directive.childLevel,
          direction:
            directive.childDirection,
        },

        ...geometry,

        members:
          members.map(
            (member) =>
              member.id,
          ),

        children,
      }

    resolving.delete(
      anchor.member.id,
    )

    resolved.set(
      anchor.member.id,
      group,
    )

    return group
  }

  /*
   * No A-J depth sorting exists here.
   *
   * Recursion follows actual resolved ownership,
   * so local A→B relations can repeat at every
   * nesting level.
   */
  for (const anchor of anchors) {
    buildGroup(anchor)
  }

  return anchors
    .filter(
      (anchor) =>
        !parentOf.has(
          anchor.member.id,
        ),
    )
    .map(
      (anchor) =>
        resolved.get(
          anchor.member.id,
        ) ??
        buildGroup(anchor),
    )
    .sort(
      (a, b) =>
        a.offset - b.offset,
    )
}
