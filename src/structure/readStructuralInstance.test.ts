import { describe, expect, it } from 'vitest'

import {
  readStructuralGroupDirective,
} from './readStructuralInstance'

describe('readStructuralGroupDirective', () => {
  it('recognizes a direction-only Case as structural anchor', () => {
    const result =
      readStructuralGroupDirective({
        compose: {
          displayedContent: {
            type: 'offset',
            direction: '-',
            offset: 0,
          },
        },
      })

    expect(result).toEqual({
      incomingLevel: null,
      parentLevel: null,
      childLevel: null,
      number: null,
      childDirection: '-',
      maxChildren: null,
    })
  })

  it('recognizes level-only structure and defaults direction to positive', () => {
    const result =
      readStructuralGroupDirective({
        compose: {
          root: {
            level: 'A',
            offset: 0,
          },
          children: {
            type: 'offset-range',
            level: 'B',
            maxItems: 48,
          },
        },
      })

    expect(result).toEqual({
      incomingLevel: null,
      parentLevel: 'A',
      childLevel: 'B',
      number: null,
      childDirection: '+',
      maxChildren: 48,
    })
  })

  it('does not recognize NUMBER alone as structural anchor', () => {
    const result =
      readStructuralGroupDirective({
        groups: {
          group: 3,
        },
      })

    expect(result).toBeNull()
  })

  it('keeps incoming and outgoing levels separate', () => {
    const result =
      readStructuralGroupDirective({
        groups: {
          level: 'B',
          group: 2,
        },

        compose: {
          root: {
            level: 'A',
            offset: 0,
          },

          children: {
            type: 'offset-range',
            level: 'B',
            direction: '+',
            maxItems: 4,
          },
        },
      })

    expect(result).toEqual({
      incomingLevel: 'B',
      parentLevel: 'A',
      childLevel: 'B',
      number: 2,
      childDirection: '+',
      maxChildren: 4,
    })
  })

  it('reads negative child direction independently from level', () => {
    const result =
      readStructuralGroupDirective({
        compose: {
          root: {
            level: 'A',
            offset: 0,
          },

          children: {
            type: 'offset-range',
            level: 'B',
            direction: '-',
            maxItems: 2,
          },
        },
      })

    expect(result).toEqual({
      incomingLevel: null,
      parentLevel: 'A',
      childLevel: 'B',
      number: null,
      childDirection: '-',
      maxChildren: 2,
    })
  })
})
