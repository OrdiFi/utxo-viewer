import type {
  ViewerContent,
  ViewerProvider,
} from './ViewerProvider'

import type {
  ContentSpec,
  InscriptionId,
  Outpoint,
  ResolvedViewerInput,
  Satpoint,
  ViewerInputType,
  ViewerOutput,
} from '../structure/types'

type OrdiFiViewerClientOptions = {
  baseUrl: string
  fetcher?: typeof fetch
}

type ResolveResponse = {
  ok?: boolean
  kind?: string
  input?: string

  id?: string | null
  rootId?: string | null
  number?: number | null
  utxo?: string | null

  contents?: Array<{
    id?: string
    number?: number | null
    offset?: number | null
  }>

  error?: string
}

type OffsetEntry = {
  id?: string
  offset?: number | null
}

type OffsetGroup = {
  offset?: number
  value?: number
  ids?: string[]
  sharedSatpoint?: boolean
}

type ContentOffsetsResponse = {
  utxo?: string
  totalValue?: number
  offsetKnown?: boolean
  entries?: OffsetEntry[]
  groups?: OffsetGroup[]
}

type ContentSpecResponse = {
  detected?: boolean

  source?: {
    inputId?: string
    utxo?: string | null
    specId?: string
  }

  spec?: unknown
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error(
      'OrdiFiViewerClient requires a baseUrl',
    )
  }

  return trimmed.replace(/\/+$/, '')
}

function inputTypeFromKind(
  kind: string | undefined,
): ViewerInputType {
  switch (kind) {
    case 'id':
      return 'inscriptionId'

    case 'number':
      return 'inscriptionNumber'

    case 'utxo':
      return 'utxo'

    default:
      return 'unknown'
  }
}

function satpointFrom(
  outpoint: Outpoint,
  offset: number,
): Satpoint | null {
  const parts = outpoint.split(':')

  if (parts.length !== 2) {
    return null
  }

  const [txid, rawVout] = parts
  const vout = Number(rawVout)

  if (
    !txid ||
    !Number.isInteger(vout) ||
    vout < 0 ||
    !Number.isInteger(offset) ||
    offset < 0
  ) {
    return null
  }

  return {
    txid,
    vout,
    offset,
  }
}

export class OrdiFiViewerClient
implements ViewerProvider {
  readonly id = 'ordifi'

  readonly capabilities = {
    contentInfo: false,
    contentSummary: false,
    search: false,
    metadata: false,
  } as const

  private readonly baseUrl: string
  private readonly fetcher: typeof fetch

  constructor(
    options: OrdiFiViewerClientOptions,
  ) {
    this.baseUrl =
      normalizeBaseUrl(options.baseUrl)

    this.fetcher =
      options.fetcher ?? fetch
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`
  }

  async resolveInput(
    input: string,
  ): Promise<ResolvedViewerInput> {
    const normalized = input.trim()

    if (!normalized) {
      throw new Error(
        'viewer input must not be empty',
      )
    }

    const response = await this.fetcher(
      this.url(
        `/api/viewer/resolve?input=${encodeURIComponent(
          normalized,
        )}`,
      ),
      {
        cache: 'no-store',
      },
    )

    const data =
      await response.json() as ResolveResponse

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error ||
          'could not resolve viewer input',
      )
    }

    const type =
      inputTypeFromKind(data.kind)

    const id =
      typeof data.id === 'string'
        ? data.id
        : null

    const outpoint =
      typeof data.utxo === 'string'
        ? data.utxo
        : null

    const content =
      Array.isArray(data.contents)
        ? data.contents.find(
            (entry) =>
              entry.id === id,
          ) ??
          data.contents[0]
        : null

    const offset =
      typeof content?.offset === 'number'
        ? content.offset
        : null

    return {
      input: normalized,
      type,
      id,
      outpoint,

      satpoint:
        outpoint !== null &&
        offset !== null
          ? satpointFrom(
              outpoint,
              offset,
            )
          : null,
    }
  }

  async getOutput(
    outpoint: Outpoint,
  ): Promise<ViewerOutput> {
    const response = await this.fetcher(
      this.url(
        `/api/content-offsets/${encodeURIComponent(
          outpoint,
        )}`,
      ),
      {
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      throw new Error(
        `could not load UTXO ${outpoint}`,
      )
    }

    const data =
      (await response.json()) as ContentOffsetsResponse

    const totalValue =
      Number(data.totalValue)

    if (
      !Number.isInteger(totalValue) ||
      totalValue <= 0
    ) {
      throw new Error(
        `invalid UTXO value for ${outpoint}`,
      )
    }

    if (data.offsetKnown !== true) {
      throw new Error(
        `physical offsets unavailable for ${outpoint}`,
      )
    }

    const entries =
      Array.isArray(data.entries)
        ? data.entries
        : []

    const groups =
      Array.isArray(data.groups)
        ? data.groups
        : []

    const postageByOffset =
      new Map<number, number>()

    for (const group of groups) {
      const offset =
        Number(group.offset)

      const postage =
        Number(group.value)

      if (
        !Number.isInteger(offset) ||
        offset < 0 ||
        !Number.isInteger(postage) ||
        postage <= 0
      ) {
        throw new Error(
          `invalid physical group in ${outpoint}`,
        )
      }

      postageByOffset.set(
        offset,
        postage,
      )
    }

    const inscriptions =
      entries.map((entry) => {
        const id =
          typeof entry.id === 'string'
            ? entry.id
            : ''

        const offset =
          Number(entry.offset)

        if (!id) {
          throw new Error(
            `UTXO ${outpoint} contains an entry without an inscription ID`,
          )
        }

        if (
          !Number.isInteger(offset) ||
          offset < 0
        ) {
          throw new Error(
            `invalid physical offset for ${id}`,
          )
        }

        const postage =
          postageByOffset.get(offset)

        if (postage === undefined) {
          throw new Error(
            `missing physical postage for ${id}`,
          )
        }

        return {
          id,
          offset,
          postage,

          satpoint:
            satpointFrom(
              outpoint,
              offset,
            ),
        }
      })

    return {
      outpoint,
      value: totalValue,
      inscriptions,
    }
  }

  async getContentSpec(
    id: InscriptionId,
  ): Promise<ContentSpec | null> {
    const response = await this.fetcher(
      this.url(
        `/api/content-spec/${encodeURIComponent(
          id,
        )}`,
      ),
      {
        cache: 'no-store',
      },
    )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(
        `could not load content spec for ${id}`,
      )
    }

    const data =
      (await response.json()) as ContentSpecResponse

    /*
     * content-spec may search other inscriptions
     * in the same UTXO. The neutral provider only
     * returns a spec when it belongs to this ID.
     */
    if (
      data.detected !== true ||
      data.source?.specId !== id
    ) {
      return null
    }

    if (
      typeof data.spec !== 'object' ||
      data.spec === null ||
      Array.isArray(data.spec)
    ) {
      return null
    }

    return data.spec as ContentSpec
  }

  async getContent(
    id: InscriptionId,
  ): Promise<ViewerContent> {
    /*
     * The raw OrdiFi inscription endpoint proxies
     * the actual on-chain inscription content.
     *
     * Returning a URL keeps rendering independent
     * from content size and MIME type.
     */
    return {
      kind: 'url',
      url: this.url(
        `/api/inscription/${encodeURIComponent(
          id,
        )}?raw=1`,
      ),
    }
  }
}
