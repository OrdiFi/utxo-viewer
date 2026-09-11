import { describe, expect, it } from 'vitest'

import type {
  ContentSpec,
  StructuralGroup,
} from '../structure/types'

import {
  buildViewerNodes,
} from './buildViewerNodes'

describe('buildViewerNodes', () => {
  it('builds recursive viewer nodes from resolved structural groups', () => {
    const child: StructuralGroup = {
      id: {
        level: 'B',
        number: 1,
      },
      relationFromParent: {
        direction: '+',
      },
      rootId: 'CHILD',
      parent: {
        level: 'A',
        number: 1,
      },
      offset: 546,
      end: 1092,
      postage: 546,
      members: ['CHILD'],
      children: [],
    }

    const root: StructuralGroup = {
      id: {
        level: 'A',
        number: 1,
      },
      relationFromParent: null,
      rootId: 'ROOT',
      parent: null,
      offset: 0,
      end: 1092,
      postage: 1092,
      members: ['ROOT', 'CHILD'],
      children: [child],
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
        number: 1,
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

  it('preserves direct physical members of a structural anchor', () => {
    const group: StructuralGroup = {
      id: {
        level: 'A',
        number: 1,
      },
      relationFromParent: null,
      rootId: 'CASE',
      parent: null,
      offset: 0,
      end: 1092,
      postage: 1092,
      members: ['ORDINAL', 'CASE'],
      children: [],
    }

    const [node] =
      buildViewerNodes(
        [group],
        new Map(),
      )

    expect(node.id).toBe('CASE')
    expect(node.members).toEqual([
      'ORDINAL',
    ])
    expect(node.sequence).toEqual([
      'ORDINAL',
      'CASE',
    ])
  })

  it('does not require a content spec', () => {
    const group: StructuralGroup = {
      id: {
        level: 'A',
        number: 1,
      },
      relationFromParent: null,
      rootId: 'ROOT',
      parent: null,
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
        level: 'A',
        number: 1,
        relationFromParent: null,
        contentSpec: null,
        members: [],
        sequence: ['ROOT'],
        children: [],
      },
    ])
  })
})
