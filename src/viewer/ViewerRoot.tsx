import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  ViewerContent,
  ViewerProvider,
} from '../provider/ViewerProvider'

import type {
  ViewerNode,
} from '../structure/types'

import {
  ContentRenderer,
} from './ContentRenderer'

import {
  StructuralViewer,
} from './StructuralViewer'

import {
  loadViewerState,
  type ViewerState,
} from './loadViewerState'

export type ViewerRootProps = {
  provider: ViewerProvider
  input: string

  className?: string
  sandbox?: string

  onStateChange?: (
    state: ViewerState | null,
  ) => void
}

type ContentState =
  | {
      status: 'loading'
    }
  | {
      status: 'ready'
      content: ViewerContent
    }
  | {
      status: 'error'
      error: string
    }

function ContentNode({
  provider,
  node,
  sandbox,
}: {
  provider: ViewerProvider
  node: ViewerNode
  sandbox?: string
}) {
  const [state, setState] =
    useState<ContentState>({
      status: 'loading',
    })

  useEffect(() => {
    let mounted = true

    setState({
      status: 'loading',
    })

    provider
      .getContent(node.id)
      .then((content) => {
        if (!mounted) {
          return
        }

        setState({
          status: 'ready',
          content,
        })
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return
        }

        setState({
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'could not load content',
        })
      })

    return () => {
      mounted = false
    }
  }, [provider, node.id])

  if (state.status === 'loading') {
    return (
      <div
        data-viewer-loading={node.id}
      >
        Loading…
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div
        data-viewer-error={node.id}
        role="alert"
      >
        {state.error}
      </div>
    )
  }

  return (
    <ContentRenderer
      content={state.content}
      title={node.id}
      sandbox={sandbox}
    />
  )
}

export function ViewerRoot({
  provider,
  input,
  className,
  sandbox,
  onStateChange,
}: ViewerRootProps) {
  const [state, setState] =
    useState<ViewerState | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setError(null)
    setState(null)

    loadViewerState(
      provider,
      input,
    )
      .then((nextState) => {
        if (!mounted) {
          return
        }

        setState(nextState)
        onStateChange?.(nextState)
      })
      .catch((cause: unknown) => {
        if (!mounted) {
          return
        }

        const message =
          cause instanceof Error
            ? cause.message
            : 'could not load viewer state'

        setError(message)
        setState(null)
        onStateChange?.(null)
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [
    provider,
    input,
    onStateChange,
  ])

  const renderContent =
    useMemo(
      () =>
        (node: ViewerNode) => (
          <ContentNode
            provider={provider}
            node={node}
            sandbox={sandbox}
          />
        ),
      [
        provider,
        sandbox,
      ],
    )

  if (loading) {
    return (
      <div data-viewer-root-loading="">
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div
        data-viewer-root-error=""
        role="alert"
      >
        {error}
      </div>
    )
  }

  if (!state) {
    return null
  }

  return (
    <StructuralViewer
      roots={state.roots}
      renderContent={renderContent}
      className={className}
    />
  )
}
