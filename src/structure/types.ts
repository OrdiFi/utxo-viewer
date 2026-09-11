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
  maxChildren: StructuralNumber
}

export type StructuralSpec = {
  version: number
  rootLevel: StructuralLevel
  relations: StructuralRelation[]
}

/*
 * Concrete structural instance.
 *
 * A structural group is identified by level + number.
 * Parent-child direction is authored by the parent and preserved
 * here only as a resolved relation.
 */

export type StructuralInstanceId = {
  level: StructuralLevel
  number: StructuralNumber
}

export type StructuralGroup = {
  id: StructuralInstanceId

  relationFromParent: {
    direction: StructuralDirection
  } | null

  rootId: InscriptionId

  parent: StructuralInstanceId | null

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

  level?: StructuralLevel | null
  number?: StructuralNumber | null
  direction?: StructuralDirection | null

  offset: number
  postage: number

  specId?: InscriptionId | null
  spec?: StructuralSpec | null

  parentId?: InscriptionId | null
  children: ViewerNode[]
}
