import { describe, expect, it } from 'vitest'

import {
  resolveStructuralGroups,
  type PhysicalMember,
} from './resolveStructuralGroups'

function member(
  id: string,
  offset: number,
  postage: number,
  options: {
    incomingLevel?: 'A' | 'B' | 'C'
    parentLevel?: 'A' | 'B' | 'C'
    childLevel?: 'A' | 'B' | 'C'
    number?: number
    direction?: '+' | '-'
    maxChildren?: number
    relation?: {
      direction: '+' | '-'
      offset: number
    }
  } = {},
): PhysicalMember {
  const hasStructure =
    options.incomingLevel !== undefined ||
    options.parentLevel !== undefined ||
    options.childLevel !== undefined ||
    options.direction !== undefined

  return {
    id,
    offset,
    postage,

    group: hasStructure
      ? {
          incomingLevel:
            options.incomingLevel ?? null,

          parentLevel:
            options.parentLevel ?? null,

          childLevel:
            options.childLevel ?? null,

          number:
            options.number ?? null,

          childDirection:
            options.direction ?? '+',

          maxChildren:
            options.maxChildren ?? null,
        }
      : null,

    relation:
      options.relation ?? null,
  }
}

describe('resolveStructuralGroups', () => {
  it('resolves a direction-only Case with content before it', () => {
    const groups =
      resolveStructuralGroups([
        member('PUNK', 0, 546),

        member(
          'CASE',
          546,
          546,
          {
            direction: '-',
            relation: {
              direction: '-',
              offset: 0,
            },
          },
        ),
      ])

    expect(groups).toHaveLength(1)

    const root = groups[0]

    expect(root.rootId).toBe('CASE')
    expect(root.parentId).toBeNull()

    expect(root.members).toEqual([
      'PUNK',
      'CASE',
    ])

    expect(root.offset).toBe(0)
    expect(root.end).toBe(1092)
    expect(root.postage).toBe(1092)

    expect(root.children).toHaveLength(0)
  })

  it('resolves a local A to B relation', () => {
    const groups =
      resolveStructuralGroups([
        member(
          'SUITCASE',
          0,
          546,
          {
            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
            maxChildren: 48,
          },
        ),

        member(
          'CASE',
          546,
          546,
          {
            incomingLevel: 'B',
            number: 1,
            direction: '-',
          },
        ),
      ])

    expect(groups).toHaveLength(1)

    const root = groups[0]

    expect(root.rootId).toBe(
      'SUITCASE',
    )

    expect(root.children).toHaveLength(1)

    const child =
      root.children[0]

    expect(child.rootId).toBe('CASE')
    expect(child.parentId).toBe(
      'SUITCASE',
    )

    expect(
      child.relationFromParent,
    ).toEqual({
      parentLevel: 'A',
      childLevel: 'B',
      direction: '+',
      number: 1,
    })
  })

  it('allows B in the parent relation and A in the child own relation', () => {
    const groups =
      resolveStructuralGroups([
        member(
          'ROOT',
          0,
          546,
          {
            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
          },
        ),

        member(
          'NODE',
          546,
          546,
          {
            incomingLevel: 'B',
            number: 1,

            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
          },
        ),

        member(
          'LEAF',
          1092,
          546,
          {
            incomingLevel: 'B',
            number: 1,
          },
        ),
      ])

    expect(groups).toHaveLength(1)

    const root = groups[0]
    const node =
      root.children[0]

    expect(node.rootId).toBe('NODE')

    expect(
      node.relationFromParent,
    ).toEqual({
      parentLevel: 'A',
      childLevel: 'B',
      direction: '+',
      number: 1,
    })

    expect(
      node.relationToChildren,
    ).toEqual({
      parentLevel: 'A',
      childLevel: 'B',
      direction: '+',
    })

    expect(node.children).toHaveLength(1)

    expect(
      node.children[0].rootId,
    ).toBe('LEAF')
  })

  it('orders siblings by structural number', () => {
    const groups =
      resolveStructuralGroups([
        member(
          'ROOT',
          0,
          546,
          {
            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
          },
        ),

        member(
          'SECOND',
          546,
          546,
          {
            incomingLevel: 'B',
            number: 2,
          },
        ),

        member(
          'FIRST',
          1092,
          546,
          {
            incomingLevel: 'B',
            number: 1,
          },
        ),
      ])

    expect(
      groups[0].children.map(
        (child) =>
          child.rootId,
      ),
    ).toEqual([
      'FIRST',
      'SECOND',
    ])
  })

  it('rejects duplicate sibling numbers', () => {
    expect(() =>
      resolveStructuralGroups([
        member(
          'ROOT',
          0,
          546,
          {
            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
          },
        ),

        member(
          'ONE',
          546,
          546,
          {
            incomingLevel: 'B',
            number: 1,
          },
        ),

        member(
          'TWO',
          1092,
          546,
          {
            incomingLevel: 'B',
            number: 1,
          },
        ),
      ]),
    ).toThrow(
      /duplicate structural child number/,
    )
  })

  it('resolves Suitcase containing a Case whose content is before the Case', () => {
    const groups =
      resolveStructuralGroups([
        member(
          'SUITCASE',
          0,
          546,
          {
            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
            maxChildren: 48,
          },
        ),

        member(
          'PUNK',
          546,
          546,
        ),

        member(
          'CASE',
          1092,
          546,
          {
            direction: '-',

            relation: {
              direction: '-',
              offset: 0,
            },
          },
        ),
      ])

    expect(groups).toHaveLength(1)

    const suitcase =
      groups[0]

    expect(suitcase.rootId).toBe(
      'SUITCASE',
    )

    expect(
      suitcase.children,
    ).toHaveLength(1)

    const caseGroup =
      suitcase.children[0]

    expect(caseGroup.rootId).toBe(
      'CASE',
    )

    expect(caseGroup.parentId).toBe(
      'SUITCASE',
    )

    expect(caseGroup.members).toEqual([
      'PUNK',
      'CASE',
    ])

    expect(suitcase.members).toEqual([
      'SUITCASE',
      'PUNK',
      'CASE',
    ])
  })

  it('enforces maxChildren', () => {
    expect(() =>
      resolveStructuralGroups([
        member(
          'ROOT',
          0,
          546,
          {
            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
            maxChildren: 1,
          },
        ),

        member(
          'ONE',
          546,
          546,
          {
            incomingLevel: 'B',
            number: 1,
          },
        ),

        member(
          'TWO',
          1092,
          546,
          {
            incomingLevel: 'B',
            number: 2,
          },
        ),
      ]),
    ).toThrow(
      /exceeds maxChildren 1/,
    )
  })

  it('resolves multiple nested Case subtrees before assigning them to the Suitcase', () => {
    const groups =
      resolveStructuralGroups([
        member(
          'SUITCASE',
          0,
          546,
          {
            parentLevel: 'A',
            childLevel: 'B',
            direction: '+',
            maxChildren: 48,
          },
        ),

        member(
          'PUNK-1',
          546,
          546,
        ),

        member(
          'CASE-1',
          1092,
          546,
          {
            incomingLevel: 'B',
            number: 1,
            direction: '-',

            relation: {
              direction: '-',
              offset: 0,
            },
          },
        ),

        member(
          'PUNK-2',
          1638,
          546,
        ),

        member(
          'CASE-2',
          2184,
          546,
          {
            incomingLevel: 'B',
            number: 2,
            direction: '-',

            relation: {
              direction: '-',
              offset: 0,
            },
          },
        ),
      ])

    expect(groups).toHaveLength(1)

    const suitcase = groups[0]

    expect(suitcase.rootId).toBe('SUITCASE')
    expect(suitcase.children).toHaveLength(2)

    expect(
      suitcase.children.map(
        (child) => child.rootId,
      ),
    ).toEqual([
      'CASE-1',
      'CASE-2',
    ])

    expect(
      suitcase.children[0].members,
    ).toEqual([
      'PUNK-1',
      'CASE-1',
    ])

    expect(
      suitcase.children[1].members,
    ).toEqual([
      'PUNK-2',
      'CASE-2',
    ])

    expect(suitcase.members).toEqual([
      'SUITCASE',
      'PUNK-1',
      'CASE-1',
      'PUNK-2',
      'CASE-2',
    ])
  })

})
