import type {
  ContentSpec,
  InscriptionId,
  Outpoint,
  ResolvedViewerInput,
  ViewerOutput,
} from '../structure/types'

export type ViewerContent =
  | {
      kind: 'url'
      url: string
      contentType?: string | null
    }
  | {
      kind: 'text'
      text: string
      contentType?: string | null
    }
  | {
      kind: 'bytes'
      bytes: ArrayBuffer
      contentType?: string | null
    }

export type ViewerProviderCapabilities = {
  contentInfo?: boolean
  contentSummary?: boolean
  search?: boolean
  metadata?: boolean
}

/*
 * Neutral data contract for the live on-chain UTXO Viewer.
 *
 * A provider supplies observed chain/content data.
 * It does not perform BCE structural validation and it does not
 * provide application-specific runtime semantics.
 *
 * Minimum responsibilities:
 *
 * resolveInput
 *   Resolve an inscription ID, inscription number, UTXO or satpoint
 *   into the on-chain reference the Viewer should inspect.
 *
 * getOutput
 *   Return the complete observed UTXO state required by the Viewer:
 *   value, inscription IDs, physical offsets and real postage.
 *
 * getContent
 *   Return the actual on-chain content for an inscription.
 *
 * getContentSpec
 *   Return the raw embedded content/structural specification.
 *   Interpretation belongs to the structural reader/resolver layer.
 */
export interface ViewerProvider {
  readonly id: string
  readonly capabilities?: ViewerProviderCapabilities

  resolveInput(input: string): Promise<ResolvedViewerInput>

  getOutput(outpoint: Outpoint): Promise<ViewerOutput>

  getContent(id: InscriptionId): Promise<ViewerContent>

  getContentSpec(
    id: InscriptionId,
  ): Promise<ContentSpec | null>

  getContentInfo?(
    id: InscriptionId,
  ): Promise<unknown>

  getContentSummary?(
    id: InscriptionId,
  ): Promise<unknown>
}
