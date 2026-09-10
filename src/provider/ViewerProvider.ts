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
