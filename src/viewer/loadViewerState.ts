import type {
  ContentSpec,
  InscriptionId,
  ResolvedViewerInput,
  StructuralGroup,
  ViewerNode,
  ViewerOutput,
} from '../structure/types'

import type {
  ViewerProvider,
} from '../provider/ViewerProvider'

import {
  readCompositionRelation,
  readStructuralGroupDirective,
} from '../structure/readStructuralInstance'

import {
  resolveStructuralGroups,
  type PhysicalMember,
} from '../structure/resolveStructuralGroups'

import {
  buildViewerNodes,
} from './buildViewerNodes'

export type ViewerState = {
  input: ResolvedViewerInput
  output: ViewerOutput

  specs: ReadonlyMap<
    InscriptionId,
    ContentSpec | null
  >

  roots: ViewerNode[]
}

function collectClaimedIds(
  groups: readonly StructuralGroup[],
): Set<InscriptionId> {
  const claimed =
    new Set<InscriptionId>()

  function visit(group: StructuralGroup) {
    for (const id of group.members) {
      claimed.add(id)
    }

    for (const child of group.children) {
      visit(child)
    }
  }

  for (const group of groups) {
    visit(group)
  }

  return claimed
}

function makeUnstructuredNode(
  inscription: ViewerOutput['inscriptions'][number],
  spec: ContentSpec | null,
): ViewerNode {
  return {
    id: inscription.id,

    offset: inscription.offset,
    postage: inscription.postage,

    level: null,
    number: null,

    relationFromParent: null,

    contentSpec: spec,

    members: [],
    sequence: [inscription.id],
    children: [],
  }
}

/*
 * Load and resolve the neutral live on-chain Viewer state.
 *
 * Responsibilities:
 *
 * - resolve viewer input
 * - load complete physical UTXO geometry
 * - load raw content specs
 * - read explicit structural instance metadata
 * - resolve structural groups
 * - build render nodes
 * - preserve inscriptions not claimed by structure
 *
 * This layer does not:
 *
 * - validate BCE transaction validity
 * - invent missing offsets or postage
 * - interpret application/runtime semantics
 * - render React components
 */
export async function loadViewerState(
  provider: ViewerProvider,
  rawInput: string,
): Promise<ViewerState> {
  const input =
    await provider.resolveInput(rawInput)

  if (!input.outpoint) {
    throw new Error(
      'resolved viewer input contains no UTXO outpoint',
    )
  }

  const output =
    await provider.getOutput(input.outpoint)

  const specEntries =
    await Promise.all(
      output.inscriptions.map(
        async (inscription) => [
          inscription.id,
          await provider.getContentSpec(
            inscription.id,
          ),
        ] as const,
      ),
    )

  const specs =
    new Map<
      InscriptionId,
      ContentSpec | null
    >(specEntries)

  const physicalMembers: PhysicalMember[] =
    output.inscriptions.map(
      (inscription) => {
        const spec =
          specs.get(inscription.id) ?? null

        return {
          id: inscription.id,
          offset: inscription.offset,
          postage: inscription.postage,

          group:
            spec !== null
              ? readStructuralGroupDirective(spec)
              : null,

          relation:
            spec !== null
              ? readCompositionRelation(spec)
              : null,
        }
      },
    )

  const groups =
    resolveStructuralGroups(
      physicalMembers,
    )

  const structuredRoots =
    buildViewerNodes(
      groups,
      specs,
    )

  const claimed =
    collectClaimedIds(groups)

  const unstructuredRoots =
    output.inscriptions
      .filter(
        (inscription) =>
          !claimed.has(inscription.id),
      )
      .map(
        (inscription) =>
          makeUnstructuredNode(
            inscription,
            specs.get(inscription.id) ??
              null,
          ),
      )

  const roots = [
    ...structuredRoots,
    ...unstructuredRoots,
  ].sort(
    (a, b) =>
      a.offset - b.offset,
  )

  return {
    input,
    output,
    specs,
    roots,
  }
}
