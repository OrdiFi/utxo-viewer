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

function StructuralChildren({
  children,
  renderContent,
}: {
  children: readonly ViewerNode[]
  renderContent: StructuralNodeProps['renderContent']
}) {
  if (children.length === 0) {
    return null
  }

  return (
    <>
      {children.map((child) => (
        <StructuralNode
          key={child.id}
          node={child}
          renderContent={renderContent}
        />
      ))}
    </>
  )
}

function StructuralNode({
  node,
  renderContent,
}: StructuralNodeProps) {
  const negativeChildren =
    node.children.filter(
      (child) =>
        child.relationFromParent
          ?.direction === '-',
    )

  const positiveChildren =
    node.children.filter(
      (child) =>
        child.relationFromParent
          ?.direction === '+',
    )

  /*
   * A resolved child should normally have a relationFromParent.
   *
   * If malformed external state reaches this renderer anyway,
   * preserve it after the explicitly positioned children rather
   * than inventing a direction or dropping content.
   */
  const unpositionedChildren =
    node.children.filter(
      (child) =>
        child.relationFromParent === null,
    )

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
      {negativeChildren.length > 0 ? (
        <div
          data-viewer-children-before={node.id}
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          <StructuralChildren
            children={negativeChildren}
            renderContent={renderContent}
          />
        </div>
      ) : null}

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

      {positiveChildren.length > 0 ? (
        <div
          data-viewer-children-after={node.id}
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          <StructuralChildren
            children={positiveChildren}
            renderContent={renderContent}
          />
        </div>
      ) : null}

      {unpositionedChildren.length > 0 ? (
        <div
          data-viewer-children-unpositioned={
            node.id
          }
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          <StructuralChildren
            children={unpositionedChildren}
            renderContent={renderContent}
          />
        </div>
      ) : null}
    </div>
  )
}

/*
 * Render an already-resolved structural tree.
 *
 * Structural ownership and sibling ordering have already been
 * determined by the resolver.
 *
 * Child relation direction only determines placement relative
 * to the owning node's direct physical sequence:
 *
 *   negative children
 *   direct sequence
 *   positive children
 *
 * This component does not:
 *
 * - resolve or validate structure
 * - fetch on-chain data
 * - infer layout slots
 * - interpret application/runtime semantics
 * - sort structural siblings
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
