import type {
  ReactNode,
} from 'react'

import type {
  ViewerNode,
} from '../structure/types'

export type StructuralViewerProps = {
  roots: readonly ViewerNode[]

  renderContent: (
    node: ViewerNode,
  ) => ReactNode

  className?: string
}

type StructuralNodeProps = {
  node: ViewerNode

  renderContent: (
    node: ViewerNode,
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
        data-viewer-content={node.id}
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {renderContent(node)}
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
              key={`${child.level}:${child.number}:${child.id}`}
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
          key={`${root.level}:${root.number}:${root.id}`}
          node={root}
          renderContent={renderContent}
        />
      ))}
    </div>
  )
}
