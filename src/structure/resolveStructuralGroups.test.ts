import { describe, expect, it } from 'vitest'

import {
  resolveStructuralGroups,
  type PhysicalMember,
} from './resolveStructuralGroups'

function member(
  id: string,
  offset: number,
  options: {
    level?: string
    number?: number | null
    direction?: '+' | '-'
    childLevel?: string | null
    relationDirection?: '+' | '-'
    relationOffset?: number
  } = {},
): PhysicalMember {
  return {
    id,
    offset,
    postage: 100,

    group:
      options.level && options.direction
        ? {
            level: options.level,
            number: options.number ?? null,
            direction: options.direction,
            childLevel:
              options.childLevel ?? null,
          }
        : null,

    relation:
      options.relationDirection
        ? {
            direction:
              options.relationDirection,
            offset:
              options.relationOffset ?? 0,
          }
        : null,
  }
}

describe('resolveStructuralGroups', () => {
  it('resolves positive-direction children', () => {
    const result = resolveStructuralGroups([
      member('root', 0, {
        level: 'A',
        number: 1,
        direction: '+',
        childLevel: 'B',
      }),

      member('b1-anchor', 100, {
        level: 'B',
        number: 1,
        direction: '+',
        relationDirection: '+',
        relationOffset: 0,
      }),

      member('b1-content', 200),

      member('b2-anchor', 300, {
        level: 'B',
        number: 2,
        direction: '+',
        relationDirection: '+',
        relationOffset: 0,
      }),

      member('b2-content', 400),
    ])

    expect(result).toHaveLength(1)

    expect(
      result[0].children.map(
        (child) => child.id.number,
      ),
    ).toEqual([1, 2])

    expect(result[0].children[0].members).toEqual([
      'b1-anchor',
      'b1-content',
    ])

    expect(result[0].children[1].members).toEqual([
      'b2-anchor',
      'b2-content',
    ])
  })

  it('resolves negative-direction content before its anchor', () => {
    const result = resolveStructuralGroups([
      member('content', 0),

      member('b1-anchor', 100, {
        level: 'B',
        number: 1,
        direction: '-',
        relationDirection: '-',
        relationOffset: 0,
      }),

      member('root', 200, {
        level: 'A',
        number: 1,
        direction: '-',
        childLevel: 'B',
      }),
    ])

    expect(result).toHaveLength(1)

    expect(result[0].children).toHaveLength(1)

    expect(result[0].children[0].members).toEqual([
      'content',
      'b1-anchor',
    ])

    expect(result[0].children[0].direction).toBe('-')
  })

  it('sorts children by structural number rather than physical order', () => {
    const result = resolveStructuralGroups([
      member('root', 0, {
        level: 'A',
        number: 1,
        direction: '+',
        childLevel: 'B',
      }),

      member('b2-anchor', 100, {
        level: 'B',
        number: 2,
        direction: '+',
        relationDirection: '+',
        relationOffset: 0,
      }),

      member('b2-content', 200),

      member('b1-anchor', 300, {
        level: 'B',
        number: 1,
        direction: '+',
        relationDirection: '+',
        relationOffset: 0,
      }),

      member('b1-content', 400),
    ])

    expect(
      result[0].children.map(
        (child) => child.id.number,
      ),
    ).toEqual([1, 2])
  })

  it('rejects duplicate structural numbers on the same child level', () => {
    expect(() =>
      resolveStructuralGroups([
        member('root', 0, {
          level: 'A',
          number: 1,
          direction: '+',
          childLevel: 'B',
        }),

        member('b1-anchor-a', 100, {
          level: 'B',
          number: 1,
          direction: '+',
          relationDirection: '+',
          relationOffset: 0,
        }),

        member('b1-content-a', 200),

        member('b1-anchor-b', 300, {
          level: 'B',
          number: 1,
          direction: '+',
          relationDirection: '+',
          relationOffset: 0,
        }),

        member('b1-content-b', 400),
      ]),
    ).toThrow('duplicate structural group B1')
  })
})

it('computes structural group physical range from first offset to last end', () => {
  const result = resolveStructuralGroups([
    member('root', 0, {
      level: 'A',
      number: 1,
      direction: '+',
      childLevel: 'B',
    }),

    member('b1-anchor', 100, {
      level: 'B',
      number: 1,
      direction: '+',
      relationDirection: '+',
      relationOffset: 0,
    }),

    member('b1-content', 200),
  ])

  const child = result[0].children[0]

  expect(child.offset).toBe(100)
  expect(child.end).toBe(300)
  expect(child.postage).toBe(200)
})
