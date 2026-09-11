import { describe, expect, it } from 'vitest'

import {
  readStructuralSpec,
} from './readStructuralSpec'

describe('readStructuralSpec', () => {
  it('reads the canonical local A to B relation', () => {
    expect(
      readStructuralSpec({
        structure: {
          version: 1,
          rootLevel: 'A',
          relations: [
            {
              parentLevel: 'A',
              childLevel: 'B',
              direction: '+',
              maxChildren: 48,
            },
          ],
        },
      }),
    ).toEqual({
      version: 1,
      rootLevel: 'A',
      relations: [
        {
          parentLevel: 'A',
          childLevel: 'B',
          direction: '+',
          maxChildren: 48,
        },
      ],
    })
  })

  it('allows a relation without maxChildren', () => {
    expect(
      readStructuralSpec({
        structure: {
          version: 1,
          rootLevel: 'A',
          relations: [
            {
              parentLevel: 'A',
              childLevel: 'B',
              direction: '+',
            },
          ],
        },
      }),
    ).toEqual({
      version: 1,
      rootLevel: 'A',
      relations: [
        {
          parentLevel: 'A',
          childLevel: 'B',
          direction: '+',
        },
      ],
    })
  })

  it('does not interpret level letters as global depth', () => {
    expect(
      readStructuralSpec({
        structure: {
          version: 1,
          rootLevel: 'A',
          relations: [
            {
              parentLevel: 'A',
              childLevel: 'C',
              direction: '+',
            },
          ],
        },
      }),
    ).toEqual({
      version: 1,
      rootLevel: 'A',
      relations: [
        {
          parentLevel: 'A',
          childLevel: 'C',
          direction: '+',
        },
      ],
    })
  })

  it('still requires explicit direction in canonical specs', () => {
    expect(() =>
      readStructuralSpec({
        structure: {
          version: 1,
          rootLevel: 'A',
          relations: [
            {
              parentLevel: 'A',
              childLevel: 'B',
            },
          ],
        },
      }),
    ).toThrow(
      /invalid structural direction/,
    )
  })

  it('rejects invalid maxChildren when provided', () => {
    expect(() =>
      readStructuralSpec({
        structure: {
          version: 1,
          rootLevel: 'A',
          relations: [
            {
              parentLevel: 'A',
              childLevel: 'B',
              direction: '+',
              maxChildren: 0,
            },
          ],
        },
      }),
    ).toThrow(
      /maxChildren must be greater than zero/,
    )
  })

  it('rejects relations disconnected from the local root', () => {
    expect(() =>
      readStructuralSpec({
        structure: {
          version: 1,
          rootLevel: 'A',
          relations: [
            {
              parentLevel: 'A',
              childLevel: 'B',
              direction: '+',
            },
            {
              parentLevel: 'C',
              childLevel: 'D',
              direction: '+',
            },
          ],
        },
      }),
    ).toThrow(
      /not reachable from root level A/,
    )
  })
})
