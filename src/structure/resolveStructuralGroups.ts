import type {
  InscriptionId,
  StructuralDirection,
  StructuralGroup,
  StructuralInstanceId,
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
  const last = ordered[ordered.length - 1]

  const end = last.offset + last.postage

  return {
    offset: first.offset,
    end,
    postage: end - first.offset,
  }
}

function uniquePhysicalMembers(
  members: PhysicalMember[],
): PhysicalMember[] {
  const byId = new Map<
    InscriptionId,
    PhysicalMember
  >()

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
  const relation = anchor.member.relation

  if (!relation) {
    return null
  }

  const distance = relation.offset + 1

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

  if (explicit !== null && explicit !== undefined) {
    return explicit
  }

  const position = siblings.findIndex(
    (candidate) =>
      candidate.member.id === anchor.member.id,
  )

  return position >= 0
    ? position + 1
    : 1
}

/*
 * Interpret structural relationships from observed physical data.
 *
 * This resolver does not validate BCE transaction or composition
 * validity. Contiguity, dust, postage policy and structural validity
 * belong to BCE Verify.
 */
export function resolveStructuralGroups(
  physicalMembers: PhysicalMember[],
): StructuralGroup[] {
  const ordered = [...physicalMembers].sort(
    (a, b) => a.offset - b.offset,
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

  /*
   * Determine structural anchor-to-anchor ownership.
   *
   * A parent declares:
   *   childLevel
   *   childDirection
   *
   * The child does not need to point back.
   */
  const parentOf =
    new Map<InscriptionId, ParentRelation>()

  for (const parent of anchors) {
    const directive = parent.member.group

    if (
      !directive ||
      directive.childLevel === null
    ) {
      continue
    }

    const sameLevelParents =
      anchors.filter(
        (candidate) =>
          candidate.member.group?.level ===
          directive.level,
      )

    const parentPosition =
      sameLevelParents.findIndex(
        (candidate) =>
          candidate.member.id ===
          parent.member.id,
      )

    const previousBoundary =
      parentPosition > 0
        ? sameLevelParents[
            parentPosition - 1
          ].index
        : -1

    const nextBoundary =
      parentPosition >= 0 &&
      parentPosition + 1 <
        sameLevelParents.length
        ? sameLevelParents[
            parentPosition + 1
          ].index
        : ordered.length

    for (const candidate of anchors) {
      if (
        candidate.member.group?.level !==
        directive.childLevel
      ) {
        continue
      }

      const belongs =
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

      if (!belongs) {
        continue
      }

      const existing =
        parentOf.get(candidate.member.id)

      if (
        existing &&
        existing.parent.member.id !==
          parent.member.id
      ) {
        throw new Error(
          `structural anchor ${candidate.member.id} has multiple parents`,
        )
      }

      parentOf.set(
        candidate.member.id,
        {
          parent,
          direction:
            directive.childDirection,
        },
      )
    }
  }

  /*
   * Children are indexed once so every parent can
   * consume already-resolved lower-level subtrees.
   */
  const anchorChildren =
    new Map<InscriptionId, IndexedMember[]>()

  for (const anchor of anchors) {
    const relation =
      parentOf.get(anchor.member.id)

    if (!relation) {
      continue
    }

    const parentId =
      relation.parent.member.id

    const list =
      anchorChildren.get(parentId) ?? []

    list.push(anchor)

    anchorChildren.set(parentId, list)
  }

  const resolving = new Set<InscriptionId>()
  const resolved =
    new Map<InscriptionId, StructuralGroup>()

  function buildGroup(
    anchor: IndexedMember,
  ): StructuralGroup {
    const cached =
      resolved.get(anchor.member.id)

    if (cached) {
      return cached
    }

    if (resolving.has(anchor.member.id)) {
      throw new Error(
        `structural cycle at ${anchor.member.id}`,
      )
    }

    resolving.add(anchor.member.id)

    const directive = anchor.member.group

    if (!directive) {
      throw new Error(
        `missing structural directive for ${anchor.member.id}`,
      )
    }

    const siblingAnchors = parentOf.has(
      anchor.member.id,
    )
      ? anchorChildren.get(
          parentOf.get(
            anchor.member.id,
          )!.parent.member.id,
        ) ?? [anchor]
      : anchors.filter(
          (candidate) =>
            !parentOf.has(candidate.member.id) &&
            candidate.member.group?.level ===
              directive.level,
        )

    const id: StructuralInstanceId = {
      level: directive.level,
      number: numberForAnchor(
        anchor,
        siblingAnchors,
      ),
    }

    const relationToParent =
      parentOf.get(anchor.member.id)

    const childrenAnchors =
      anchorChildren.get(
        anchor.member.id,
      ) ?? []

    /*
     * Structural numbers are unique only among
     * siblings of the same parent.
     */
    const seenNumbers = new Set<number>()

    const children =
      childrenAnchors.map((childAnchor) => {
        const childNumber =
          numberForAnchor(
            childAnchor,
            childrenAnchors,
          )

        if (seenNumbers.has(childNumber)) {
          throw new Error(
            `duplicate structural group ${directive.childLevel}${childNumber}`,
          )
        }

        seenNumbers.add(childNumber)

        return buildGroup(childAnchor)
      })

    /*
     * First resolve the anchor's own physical relation.
     *
     * This preserves the original group behaviour:
     *
     *   anchor + referenced content
     *
     * form one physical unit even when the referenced
     * content has no structural metadata of its own.
     */
    const related =
      relatedPhysicalMember(
        anchor,
        ordered,
      )

    /*
     * If this parent declares a deeper child level and
     * its related content is not itself a structural
     * anchor, that content is the terminal child.
     */
    if (
      directive.childLevel !== null &&
      related !== null &&
      related.group === null
    ) {
      if (seenNumbers.has(1)) {
        throw new Error(
          `duplicate structural group ${directive.childLevel}1`,
        )
      }

      seenNumbers.add(1)

      const geometry =
        rangeOf([related])

      children.push({
        id: {
          level: directive.childLevel,
          number: 1,
        },

        relationFromParent: {
          direction:
            directive.childDirection,
        },

        rootId: related.id,
        parent: id,

        ...geometry,

        members: [related.id],
        children: [],
      })
    }

    children.sort(
      (a, b) =>
        a.id.number - b.id.number,
    )

    /*
     * Bottom-up reduction:
     *
     * start with this anchor's own physical unit,
     * then absorb already-resolved child subtrees.
     */
    const physical: PhysicalMember[] = [
      anchor.member,
    ]

    if (related) {
      physical.push(related)
    }

    for (const child of childrenAnchors) {
      const childGroup =
        resolved.get(child.member.id) ??
        buildGroup(child)

      for (const memberId of childGroup.members) {
        const member =
          ordered.find(
            (entry) =>
              entry.id === memberId,
          )

        if (member) {
          physical.push(member)
        }
      }
    }

    const members =
      uniquePhysicalMembers(physical)

    const geometry =
      rangeOf(members)

    const group: StructuralGroup = {
      id,

      relationFromParent:
        relationToParent
          ? {
              direction:
                relationToParent.direction,
            }
          : null,

      rootId: anchor.member.id,

      parent:
        relationToParent
          ? {
              level:
                relationToParent.parent
                  .member.group!.level,
              number:
                numberForAnchor(
                  relationToParent.parent,
                  parentOf.has(
                    relationToParent.parent
                      .member.id,
                  )
                    ? anchorChildren.get(
                        parentOf.get(
                          relationToParent.parent
                            .member.id,
                        )!.parent.member.id,
                      ) ?? [
                        relationToParent.parent,
                      ]
                    : anchors.filter(
                        (candidate) =>
                          !parentOf.has(
                            candidate.member.id,
                          ) &&
                          candidate.member.group
                            ?.level ===
                            relationToParent.parent
                              .member.group!.level,
                      ),
                ),
            }
          : null,

      ...geometry,

      members: members.map(
        (member) => member.id,
      ),

      children,
    }

    resolving.delete(anchor.member.id)
    resolved.set(anchor.member.id, group)

    return group
  }

  /*
   * Resolve deepest anchors first.
   *
   * A-J gives us an explicit structural depth,
   * so descending level order naturally performs
   * bottom-up reduction.
   */
  const deepestFirst =
    [...anchors].sort((a, b) => {
      const aLevel =
        a.member.group!.level.charCodeAt(0)

      const bLevel =
        b.member.group!.level.charCodeAt(0)

      return bLevel - aLevel
    })

  for (const anchor of deepestFirst) {
    buildGroup(anchor)
  }

  /*
   * Only anchors that were never claimed by another
   * parent are top-level roots.
   */
  return anchors
    .filter(
      (anchor) =>
        !parentOf.has(anchor.member.id),
    )
    .map((anchor) =>
      resolved.get(anchor.member.id) ??
      buildGroup(anchor),
    )
}
