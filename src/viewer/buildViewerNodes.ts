import type {
  ContentSpec,
  InscriptionId,
  StructuralGroup,
  ViewerNode,
} from '../structure/types'

export type ContentSpecLookup =
  ReadonlyMap<InscriptionId, ContentSpec | null>

function buildViewerNode(
  group: StructuralGroup,
  specs: ContentSpecLookup,
): ViewerNode {
  return {
    id: group.rootId,

    offset: group.offset,
    postage: group.postage,

    level: group.id.level,
    number: group.id.number,

    relationFromParent:
      group.relationFromParent,

    contentSpec:
      specs.get(group.rootId) ?? null,

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
