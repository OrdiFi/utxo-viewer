import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ViewerState,
} from './loadViewerState'

import {
  selectPhysicalEntries,
} from './viewerMode'

const state = {
  output: {
    inscriptions: [
      {
        id: 'a',
        offset: 0,
        postage: 333,
      },
      {
        id: 'b',
        offset: 333,
        postage: 546,
      },
      {
        id: 'c',
        offset: 333,
        postage: 546,
      },
    ],
  },
} as ViewerState

describe('selectPhysicalEntries', () => {
  it('keeps all physical entries in grid mode', () => {
    const entries =
      selectPhysicalEntries(
        state,
        'grid',
      )

    expect(
      entries.map(
        (entry) => entry.id,
      ),
    ).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('selects one physical entry in single mode', () => {
    const entries =
      selectPhysicalEntries(
        state,
        'single',
        1,
      )

    expect(
      entries.map(
        (entry) => entry.id,
      ),
    ).toEqual([
      'b',
    ])
  })

  it('clamps single mode to the available range', () => {
    expect(
      selectPhysicalEntries(
        state,
        'single',
        99,
      )[0]?.id,
    ).toBe('c')

    expect(
      selectPhysicalEntries(
        state,
        'single',
        -99,
      )[0]?.id,
    ).toBe('a')
  })

  it('returns no physical entries for structure mode', () => {
    expect(
      selectPhysicalEntries(
        state,
        'structure',
      ),
    ).toEqual([])
  })
})
