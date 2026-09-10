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

export type StructuredRelation = {
  parentLevel: string
  childLevel: string
  direction: '+' | '-'
  maxChildren: number
}

export type StructuredSpec = {
  structure: {
    version: number
    rootLevel: string
    relations: StructuredRelation[]
  }

  [key: string]: unknown
}

export type ViewerOutputInscription = {
  id: InscriptionId
  offset: number
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

export type ViewerNode = {
  id: InscriptionId
  level?: string | null

  offset: number
  postage: number

  specId?: InscriptionId | null
  spec?: StructuredSpec | null

  parentId?: InscriptionId | null
  children: ViewerNode[]
}
