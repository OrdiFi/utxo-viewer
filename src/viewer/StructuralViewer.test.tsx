import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ViewerNode,
} from '../structure/types'

import {
  StructuralViewer,
} from './StructuralViewer'

function leaf(
  id: string,
  direction: '+' | '-',
): ViewerNode {
  return {
    id,
    offset: 0,
    postage: 1,

    level: null,
    number: null,

    relationFromParent: {
      direction,
    },

    contentSpec: null,

    members: [],
    sequence: [id],
    children: [],
  }
}

describe('StructuralViewer', () => {
  it(
    'places negative children before the direct sequence and positive children after it',
    () => {
      const root: ViewerNode = {
        id: 'root',
        offset: 0,
        postage: 3,

        level: null,
        number: null,

        relationFromParent: null,

        contentSpec: null,

        members: [],
        sequence: ['root'],
        children: [
          leaf('negative', '-'),
          leaf('positive', '+'),
        ],
      }

      const html =
        renderToStaticMarkup(
          <StructuralViewer
            roots={[root]}
            renderContent={(id) => (
              <span>
                {`CONTENT:${id}`}
              </span>
            )}
          />,
        )

      const negative =
        html.indexOf(
          'CONTENT:negative',
        )

      const direct =
        html.indexOf(
          'CONTENT:root',
        )

      const positive =
        html.indexOf(
          'CONTENT:positive',
        )

      expect(negative).toBeGreaterThan(-1)
      expect(direct).toBeGreaterThan(-1)
      expect(positive).toBeGreaterThan(-1)

      expect(negative).toBeLessThan(direct)
      expect(direct).toBeLessThan(positive)
    },
  )
})
