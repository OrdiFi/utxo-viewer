export type InscriptionId = string
export type Outpoint = string

export type ViewerInputType =
  | 'inscriptionId'
  | 'inscriptionNumber'
  | 'utxo'
  | 'satpoint'
  | 'unknown'

export type Satpoint = {
  txid: string
  vout: number
  offset: number
}

/*
 * Fundamental structural primitives.
 */

export type StructuralDirection = '+' | '-'

export type StructuralLevel = string

export type StructuralNumber = number

/*
 * Canonical structural grammar.
 */

export type StructuralRelation = {
  parentLevel: StructuralLevel
  childLevel: StructuralLevel
  direction: StructuralDirection

  /*
   * Optional capacity limit.
   * Missing means no declared upper bound.
   */
  maxChildren?: StructuralNumber
}

export type StructuralSpec = {
  version: number
  rootLevel: StructuralLevel
  relations: StructuralRelation[]
}

/*
 * Concrete structural instance.
 *
 * Stable node identity is the inscription id.
 * LEVEL / NUMBER / DIRECTION describe local structural
 * relations and must not be interpreted as global tree depth
 * or node identity.
 */

export type StructuralRelationInstance = {
  parentLevel: StructuralLevel | null
  childLevel: StructuralLevel | null
  direction: StructuralDirection
  number: StructuralNumber | null
}

export type StructuralGroup = {
  /*
   * Stable node identity is the inscription itself.
   *
   * LEVEL / NUMBER / DIRECTION describe local structural
   * relations and are not global node identifiers.
   */
  rootId: InscriptionId

  parentId: InscriptionId | null

  relationFromParent:
    StructuralRelationInstance | null

  relationToChildren: {
    parentLevel: StructuralLevel | null
    childLevel: StructuralLevel | null
    direction: StructuralDirection
  } | null

  /*
   * Physical range occupied by this structural group.
   *
   * [offset, end)
   * postage = end - offset
   */
  offset: number
  end: number
  postage: number

  /*
   * IDs in physical UTXO order.
   */
  members: InscriptionId[]

  children: StructuralGroup[]
}

/*
 * Raw inscription/content specification.
 *
 * `structure` is interpreted by the neutral structural layer.
 * Other fields remain available without becoming part of the
 * canonical structural grammar.
 */

export type ContentSpec = {
  structure?: unknown
  [key: string]: unknown
}

export type ViewerOutputInscription = {
  id: InscriptionId

  /*
   * Observed physical UTXO geometry.
   *
   * No default or inferred postage is permitted.
   */
  offset: number
  postage: number

  satpoint?: Satpoint | null
  number?: number | null
}

export type ViewerOutput = {
  outpoint: Outpoint
  value: number
  address?: string | null
  inscriptions: ViewerOutputInscription[]
}

export type ResolvedViewerInput = {
  input: string
  type: ViewerInputType
  id?: InscriptionId | null
  outpoint?: Outpoint | null
  satpoint?: Satpoint | null
}

/*
 * Resolved logical structure instance.
 */

export type ViewerNode = {
  id: InscriptionId

  /*
   * Physical range occupied by this rendered node.
   */
  offset: number
  postage: number

  /*
   * Local structural role of the resolved node.
   *
   * These values describe the incoming relation and
   * are not node identity. Stable identity is `id`.
   */
  level: StructuralLevel | null
  number: StructuralNumber | null

  /*
   * Relation is authored by the parent.
   * It is preserved here only as the resolved
   * relation from the parent to this node.
   */
  relationFromParent: {
    direction: StructuralDirection
  } | null

  /*
   * Raw content specification belonging to this
   * structural anchor.
   */
  contentSpec: ContentSpec | null

  /*
   * Physical inscriptions belonging directly to
   * this anchor, excluding the anchor itself and
   * all members owned by structural child subtrees.
   */
  members: InscriptionId[]

  /*
   * Direct physical render order for this node.
   *
   * Contains the anchor itself plus its direct members
   * in observed UTXO order. Structural child subtrees
   * are excluded and rendered recursively via children.
   */
  sequence: InscriptionId[]

  /*
   * Direct structural children only.
   */
  children: ViewerNode[]
}
