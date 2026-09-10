import type {
  InscriptionId,
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

  group: StructuralGroupDirective | null
  relation: StructuralCompositionRelation | null
}

/*
 * Resolve concrete structural groups from physical member order.
 *
 * Physical order is determined exclusively by offset.
 * Structural numbering determines logical sibling order.
 */
export function resolveStructuralGroups(
  physicalMembers: PhysicalMember[],
): StructuralGroup[] {
  const ordered = [...physicalMembers].sort(
    (a, b) => a.offset - b.offset,
  )

  const anchors = ordered
    .map((member, index) => ({
      member,
      index,
    }))
    .filter(
      ({ member }) =>
        member.group !== null &&
        member.group.childLevel !== null,
    )

  return anchors.map(
    ({ member: parent, index: parentIndex }, parentPosition) => {
      const directive = parent.group!

      const parentNumber =
        directive.number ?? parentPosition + 1

      const parentId: StructuralInstanceId = {
        level: directive.level,
        number: parentNumber,
      }

      const nextParentIndex =
        anchors
          .slice(parentPosition + 1)
          .find(
            ({ member }) =>
              member.group?.level === directive.level,
          )
          ?.index ?? ordered.length

      const candidateRange =
        directive.direction === '+'
          ? ordered.slice(
              parentIndex + 1,
              nextParentIndex,
            )
          : ordered.slice(0, parentIndex)

      const children: StructuralGroup[] = []

      for (const candidate of candidateRange) {
        if (
          candidate.group === null ||
          candidate.relation === null ||
          candidate.group.level !==
            directive.childLevel ||
          candidate.group.number === null
        ) {
          continue
        }

        const childNumber = candidate.group.number

        if (
          children.some(
            (child) =>
              child.id.number === childNumber,
          )
        ) {
          throw new Error(
            `duplicate structural group ${directive.childLevel}${childNumber}`,
          )
        }

        const anchorIndex =
          ordered.indexOf(candidate)

        const distance =
          candidate.relation.offset + 1

        const contentIndex =
          candidate.relation.direction === '-'
            ? anchorIndex - distance
            : anchorIndex + distance

        const content = ordered[contentIndex]

        if (!content) {
          continue
        }

        const members =
          candidate.relation.direction === '-'
            ? [content.id, candidate.id]
            : [candidate.id, content.id]

        children.push({
          id: {
            level: directive.childLevel!,
            number: childNumber,
          },

          direction:
            candidate.relation.direction,

          rootId: candidate.id,

          parent: parentId,

          members,

          children: [],
        })
      }

      children.sort(
        (a, b) =>
          a.id.number - b.id.number,
      )

      return {
        id: parentId,

        direction: directive.direction,

        rootId: parent.id,

        parent: null,

        members: [parent.id],

        children,
      }
    },
  )
}
