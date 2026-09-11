import { describe, expect, it } from 'vitest'

import type {
  ContentSpec,
  StructuralGroup,
} from '../structure/types'

import {
  buildViewerNodes,
} from './buildViewerNodes'

describe('buildViewerNodes', () => {
  it('builds recursive viewer nodes from local structural relations', () => {
    const child: StructuralGroup = {
      rootId: 'CHILD',
      parentId: 'ROOT',

      relationFromParent: {
        parentLevel: 'A',
        childLevel: 'B',
        direction: '+',
        number: 1,
      },

      relationToChildren: null,

      offset: 546,
      end: 1092,
      postage: 546,

      members: ['CHILD'],
      children: [],
    }

    const root: StructuralGroup = {
      rootId: 'ROOT',
      parentId: null,

      relationFromParent: null,

      relationToChildren: {
        parentLevel: 'A',
        childLevel: 'B',
        direction: '+',
      },

      offset: 0,
      end: 1092,
      postage: 1092,

      members: [
        'ROOT',
        'CHILD',
      ],

      children: [
        child,
      ],
    }

    const rootSpec: ContentSpec = {
      structure: {
        version: 1,
      },
      type: 'example',
    }

    const specs = new Map([
      ['ROOT', rootSpec],
      ['CHILD', null],
    ])

    expect(
      buildViewerNodes(
        [root],
        specs,
      ),
    ).toEqual([
      {
        id: 'ROOT',
        offset: 0,
        postage: 1092,

        level: 'A',
        number: null,

        relationFromParent: null,

        contentSpec: rootSpec,

        members: [],
        sequence: ['ROOT'],

        children: [
          {
            id: 'CHILD',
            offset: 546,
            postage: 546,

            level: 'B',
            number: 1,

            relationFromParent: {
              direction: '+',
            },

            contentSpec: null,

            members: [],
            sequence: ['CHILD'],

            children: [],
          },
        ],
      },
    ])
  })

  it('preserves direct physical members of a direction-only anchor', () => {
    const group: StructuralGroup = {
      rootId: 'CASE',
      parentId: null,

      relationFromParent: null,

      relationToChildren: {
        parentLevel: null,
        childLevel: null,
        direction: '-',
      },

      offset: 0,
      end: 1092,
      postage: 1092,

      members: [
        'ORDINAL',
        'CASE',
      ],

      children: [],
    }

    const [node] =
      buildViewerNodes(
        [group],
        new Map(),
      )

    expect(node.id).toBe('CASE')

    expect(node.level).toBeNull()
    expect(node.number).toBeNull()

    expect(node.members).toEqual([
      'ORDINAL',
    ])

    expect(node.sequence).toEqual([
      'ORDINAL',
      'CASE',
    ])
  })

  it('uses incoming child role rather than outgoing parent role', () => {
    const group: StructuralGroup = {
      rootId: 'CASE',
      parentId: 'SUITCASE',

      relationFromParent: {
        parentLevel: 'A',
        childLevel: 'B',
        direction: '+',
        number: 3,
      },

      relationToChildren: {
        parentLevel: 'A',
        childLevel: 'B',
        direction: '-',
      },

      offset: 546,
      end: 1638,
      postage: 1092,

      members: [
        'PUNK',
        'CASE',
      ],

      children: [],
    }

    const [node] =
      buildViewerNodes(
        [group],
        new Map(),
      )

    expect(node.id).toBe('CASE')

    /*
     * The Case is B in its parent's relation.
     * Its own outgoing A->B relation must not
     * overwrite that incoming role.
     */
    expect(node.level).toBe('B')
    expect(node.number).toBe(3)

    expect(
      node.relationFromParent,
    ).toEqual({
      direction: '+',
    })
  })

  it('uses local parent level for a structural root', () => {
    const group: StructuralGroup = {
      rootId: 'SUITCASE',
      parentId: null,

      relationFromParent: null,

      relationToChildren: {
        parentLevel: 'A',
        childLevel: 'B',
        direction: '+',
      },

      offset: 0,
      end: 546,
      postage: 546,

      members: ['SUITCASE'],
      children: [],
    }

    const [node] =
      buildViewerNodes(
        [group],
        new Map(),
      )

    expect(node.level).toBe('A')
    expect(node.number).toBeNull()
  })

  it('does not require a content spec', () => {
    const group: StructuralGroup = {
      rootId: 'ROOT',
      parentId: null,

      relationFromParent: null,

      relationToChildren: null,

      offset: 0,
      end: 546,
      postage: 546,

      members: ['ROOT'],
      children: [],
    }

    expect(
      buildViewerNodes(
        [group],
        new Map(),
      ),
    ).toEqual([
      {
        id: 'ROOT',
        offset: 0,
        postage: 546,

        level: null,
        number: null,

        relationFromParent: null,

        contentSpec: null,

        members: [],
        sequence: ['ROOT'],

        children: [],
      },
    ])
  })
})
