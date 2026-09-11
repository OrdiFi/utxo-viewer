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
    postage?: number
  } = {},
): PhysicalMember {
  return {
    id,
    offset,
    postage: options.postage ?? 100,

    group:
      options.level && options.direction
        ? {
            level: options.level,
            number: options.number ?? null,
            childDirection: options.direction,
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

    expect(result[0].children[0].relationFromParent?.direction).toBe('-')
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

it('resolves nested structural subtrees recursively', () => {
  const result = resolveStructuralGroups([
    member('ROOT', 0, {
      level: 'A',
      number: 1,
      direction: '+',
      childLevel: 'B',
      postage: 546,
    }),

    member('LEAF-1', 546, {
      postage: 600,
    }),

    member('NODE-1', 1146, {
      level: 'B',
      number: 1,
      direction: '-',
      childLevel: 'C',
      relationDirection: '-',
      relationOffset: 0,
      postage: 546,
    }),

    member('LEAF-2', 1692, {
      postage: 600,
    }),

    member('NODE-2', 2292, {
      level: 'B',
      number: 2,
      direction: '-',
      childLevel: 'C',
      relationDirection: '-',
      relationOffset: 0,
      postage: 546,
    }),
  ])

  expect(result).toHaveLength(1)

  const root = result[0]

  expect(root.id).toEqual({
    level: 'A',
    number: 1,
  })

  expect(root.children).toHaveLength(2)

  const first = root.children[0]
  const second = root.children[1]

  expect(first.rootId).toBe('NODE-1')
  expect(first.members).toEqual([
    'LEAF-1',
    'NODE-1',
  ])
  expect(first.offset).toBe(546)
  expect(first.end).toBe(1692)
  expect(first.postage).toBe(1146)

  expect(first.children).toHaveLength(1)
  expect(first.children[0].rootId).toBe('LEAF-1')
  expect(first.children[0].id).toEqual({
    level: 'C',
    number: 1,
  })

  expect(second.rootId).toBe('NODE-2')
  expect(second.members).toEqual([
    'LEAF-2',
    'NODE-2',
  ])

  expect(second.children).toHaveLength(1)
  expect(second.children[0].rootId).toBe('LEAF-2')
  expect(second.children[0].id).toEqual({
    level: 'C',
    number: 1,
  })
})
