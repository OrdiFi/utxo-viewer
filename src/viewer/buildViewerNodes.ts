import type {
  ContentSpec,
  InscriptionId,
  StructuralGroup,
  ViewerNode,
} from '../structure/types'

export type ContentSpecLookup =
  ReadonlyMap<InscriptionId, ContentSpec | null>

function directSequenceOf(
  group: StructuralGroup,
): InscriptionId[] {
  const childMembers = new Set<InscriptionId>()

  for (const child of group.children) {
    for (const id of child.members) {
      childMembers.add(id)
    }
  }

  return group.members.filter(
    (id) =>
      !childMembers.has(id),
  )
}

function directMembersOf(
  group: StructuralGroup,
): InscriptionId[] {
  return directSequenceOf(group).filter(
    (id) => id !== group.rootId,
  )
}

function buildViewerNode(
  group: StructuralGroup,
  specs: ContentSpecLookup,
): ViewerNode {
  return {
    id: group.rootId,

    offset: group.offset,
    postage: group.postage,

    level:
      group.relationFromParent
        ?.childLevel ??
      group.relationToChildren
        ?.parentLevel ??
      null,

    number:
      group.relationFromParent
        ?.number ??
      null,

    relationFromParent:
      group.relationFromParent
        ? {
            direction:
              group.relationFromParent
                .direction,
          }
        : null,

    contentSpec:
      specs.get(group.rootId) ?? null,

    members:
      directMembersOf(group),

    sequence:
      directSequenceOf(group),

    children:
      group.children.map((child) =>
        buildViewerNode(child, specs),
      ),
  }
}

/*
 * Convert already-resolved structural groups into the
 * neutral render tree consumed by the Viewer.
 *
 * This layer does not:
 * - validate BCE composition
 * - infer missing structure
 * - interpret application/runtime semantics
 * - apply layout/slot rules
 */
export function buildViewerNodes(
  groups: readonly StructuralGroup[],
  specs: ContentSpecLookup,
): ViewerNode[] {
  return groups.map((group) =>
    buildViewerNode(group, specs),
  )
}
