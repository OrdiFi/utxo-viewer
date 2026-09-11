import type {
  ReactNode,
} from 'react'

import type {
  InscriptionId,
  ViewerNode,
} from '../structure/types'

export type StructuralViewerProps = {
  roots: readonly ViewerNode[]

  renderContent: (
    id: InscriptionId,
    owner: ViewerNode,
  ) => ReactNode

  className?: string
}

type StructuralNodeProps = {
  node: ViewerNode

  renderContent: (
    id: InscriptionId,
    owner: ViewerNode,
  ) => ReactNode
}

function StructuralNode({
  node,
  renderContent,
}: StructuralNodeProps) {
  return (
    <div
      data-viewer-node={node.id}
      data-level={node.level ?? undefined}
      data-number={node.number ?? undefined}
      data-direction={
        node.relationFromParent?.direction ??
        undefined
      }
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        data-viewer-sequence={node.id}
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {node.sequence.map((id) => (
          <div
            key={id}
            data-viewer-content={id}
            data-viewer-anchor={
              id === node.id
                ? ''
                : undefined
            }
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            {renderContent(id, node)}
          </div>
        ))}
      </div>

      {node.children.length > 0 ? (
        <div
          data-viewer-children={node.id}
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          {node.children.map((child) => (
            <StructuralNode
              key={child.id}
              node={child}
              renderContent={renderContent}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/*
 * Render an already-resolved structural tree.
 *
 * Structural ordering has already been determined by the resolver.
 * This component does not:
 *
 * - resolve or validate structure
 * - fetch on-chain data
 * - infer layout slots
 * - interpret application/runtime semantics
 * - reorder children
 */
export function StructuralViewer({
  roots,
  renderContent,
  className,
}: StructuralViewerProps) {
  return (
    <div
      className={className}
      data-utxo-viewer=""
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      {roots.map((root) => (
        <StructuralNode
          key={root.id}
          node={root}
          renderContent={renderContent}
        />
      ))}
    </div>
  )
}
