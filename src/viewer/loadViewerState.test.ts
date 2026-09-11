import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ViewerProvider,
} from '../provider/ViewerProvider'

import {
  loadViewerState,
} from './loadViewerState'

function provider(
  overrides: Partial<ViewerProvider>,
): ViewerProvider {
  return {
    id: 'test',

    async resolveInput(input) {
      return {
        input,
        type: 'utxo',
        outpoint: 'tx:0',
      }
    },

    async getOutput() {
      return {
        outpoint: 'tx:0',
        value: 546,
        inscriptions: [],
      }
    },

    async getContent() {
      return {
        kind: 'text',
        text: '',
      }
    },

    async getContentSpec() {
      return null
    },

    ...overrides,
  }
}

describe('loadViewerState', () => {
  it('preserves a normal unstructured inscription', async () => {
    const state =
      await loadViewerState(
        provider({
          async getOutput() {
            return {
              outpoint: 'tx:0',
              value: 546,
              inscriptions: [
                {
                  id: 'ORDINAL',
                  offset: 0,
                  postage: 546,
                },
              ],
            }
          },
        }),
        'tx:0',
      )

    expect(state.roots).toEqual([
      {
        id: 'ORDINAL',
        offset: 0,
        postage: 546,
        level: null,
        number: null,
        relationFromParent: null,
        contentSpec: null,
        members: [],
        sequence: ['ORDINAL'],
        children: [],
      },
    ])
  })

  it('preserves direct structural content and unclaimed inscriptions', async () => {
    const caseSpec = {
      groups: {
        level: 'A',
        group: 1,
        side: '-',
        childrenLevel: null,
      },

      displayedContent: {
        direction: '-',
        offset: 0,
      },
    }

    const state =
      await loadViewerState(
        provider({
          async getOutput() {
            return {
              outpoint: 'tx:0',
              value: 1638,
              inscriptions: [
                {
                  id: 'ORDINAL',
                  offset: 0,
                  postage: 546,
                },
                {
                  id: 'CASE',
                  offset: 546,
                  postage: 546,
                },
                {
                  id: 'LOOSE',
                  offset: 1092,
                  postage: 546,
                },
              ],
            }
          },

          async getContentSpec(id) {
            return id === 'CASE'
              ? caseSpec
              : null
          },
        }),
        'tx:0',
      )

    expect(state.roots).toHaveLength(2)

    expect(state.roots[0]).toEqual({
      id: 'CASE',
      offset: 0,
      postage: 1092,
      level: 'A',
      number: 1,
      relationFromParent: null,
      contentSpec: caseSpec,
      members: ['ORDINAL'],
      sequence: ['ORDINAL', 'CASE'],
      children: [],
    })

    expect(state.roots[1]).toEqual({
      id: 'LOOSE',
      offset: 1092,
      postage: 546,
      level: null,
      number: null,
      relationFromParent: null,
      contentSpec: null,
      members: [],
      sequence: ['LOOSE'],
      children: [],
    })
  })

  it('requires a resolved UTXO outpoint', async () => {
    await expect(
      loadViewerState(
        provider({
          async resolveInput(input) {
            return {
              input,
              type: 'unknown',
              outpoint: null,
            }
          },
        }),
        'unknown',
      ),
    ).rejects.toThrow(
      'resolved viewer input contains no UTXO outpoint',
    )
  })
})
