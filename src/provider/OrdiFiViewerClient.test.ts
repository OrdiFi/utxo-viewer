import { describe, expect, it } from 'vitest'

import { OrdiFiViewerClient } from './OrdiFiViewerClient'

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'content-type': 'application/json',
      },
    },
  )
}

describe('OrdiFiViewerClient', () => {
  it('resolves inscription input', async () => {
    const client =
      new OrdiFiViewerClient({
        baseUrl: 'https://ordifi.example',
        fetcher: async () =>
          jsonResponse({
            ok: true,
            kind: 'id',
            input: 'abc',
            id: 'abc',
            utxo: 'txid:0',
            contents: [
              {
                id: 'abc',
                offset: 123,
              },
            ],
          }),
      })

    const result =
      await client.resolveInput('abc')

    expect(result).toEqual({
      input: 'abc',
      type: 'inscriptionId',
      id: 'abc',
      outpoint: 'txid:0',
      satpoint: {
        txid: 'txid',
        vout: 0,
        offset: 123,
      },
    })
  })

  it('normalizes output geometry including shared satpoint postage', async () => {
    const client =
      new OrdiFiViewerClient({
        baseUrl: 'https://ordifi.example',
        fetcher: async () =>
          jsonResponse({
            utxo: 'txid:0',
            totalValue: 1546,
            offsetKnown: true,
            entries: [
              {
                id: 'A',
                offset: 0,
              },
              {
                id: 'B',
                offset: 0,
              },
              {
                id: 'C',
                offset: 1000,
              },
            ],
            groups: [
              {
                offset: 0,
                value: 1000,
                ids: ['A', 'B'],
                sharedSatpoint: true,
              },
              {
                offset: 1000,
                value: 546,
                ids: ['C'],
                sharedSatpoint: false,
              },
            ],
          }),
      })

    const result =
      await client.getOutput('txid:0')

    expect(result.value).toBe(1546)

    expect(result.inscriptions).toEqual([
      {
        id: 'A',
        offset: 0,
        postage: 1000,
        satpoint: {
          txid: 'txid',
          vout: 0,
          offset: 0,
        },
      },
      {
        id: 'B',
        offset: 0,
        postage: 1000,
        satpoint: {
          txid: 'txid',
          vout: 0,
          offset: 0,
        },
      },
      {
        id: 'C',
        offset: 1000,
        postage: 546,
        satpoint: {
          txid: 'txid',
          vout: 0,
          offset: 1000,
        },
      },
    ])
  })

  it('returns only a spec owned by the requested inscription', async () => {
    const own =
      new OrdiFiViewerClient({
        baseUrl: 'https://ordifi.example',
        fetcher: async () =>
          jsonResponse({
            detected: true,
            source: {
              inputId: 'A',
              specId: 'A',
            },
            spec: {
              structure: {
                version: 1,
              },
            },
          }),
      })

    await expect(
      own.getContentSpec('A'),
    ).resolves.toEqual({
      structure: {
        version: 1,
      },
    })

    const inherited =
      new OrdiFiViewerClient({
        baseUrl: 'https://ordifi.example',
        fetcher: async () =>
          jsonResponse({
            detected: true,
            source: {
              inputId: 'A',
              specId: 'B',
            },
            spec: {
              structure: {
                version: 1,
              },
            },
          }),
      })

    await expect(
      inherited.getContentSpec('A'),
    ).resolves.toBeNull()
  })

  it('returns the raw on-chain content URL', async () => {
    const client =
      new OrdiFiViewerClient({
        baseUrl: 'https://ordifi.example',
      })

    await expect(
      client.getContent('abc'),
    ).resolves.toEqual({
      kind: 'url',
      url:
        'https://ordifi.example/api/inscription/abc?raw=1',
    })
  })
})
