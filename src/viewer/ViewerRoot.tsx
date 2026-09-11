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
  InscriptionId,
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

import {
  selectPhysicalEntries,
} from './viewerMode'

import type {
  ViewerMode,
} from './viewerMode'

export type ViewerRootProps = {
  provider: ViewerProvider
  input: string

  mode?: ViewerMode
  activeIndex?: number

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

function makePhysicalViewerNode(
  entry: ViewerState['output']['inscriptions'][number],
  state: ViewerState,
): ViewerNode {
  return {
    id: entry.id,

    offset: entry.offset,
    postage: entry.postage,

    level: null,
    number: null,

    relationFromParent: null,

    contentSpec:
      state.specs.get(entry.id) ?? null,

    members: [],
    sequence: [entry.id],
    children: [],
  }
}

function ContentNode({
  provider,
  id,
  sandbox,
}: {
  provider: ViewerProvider
  id: InscriptionId
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
      .getContent(id)
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
  }, [provider, id])

  if (state.status === 'loading') {
    return (
      <div
        data-viewer-loading={id}
      >
        Loading…
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div
        data-viewer-error={id}
        role="alert"
      >
        {state.error}
      </div>
    )
  }

  return (
    <ContentRenderer
      content={state.content}
      title={id}
      sandbox={sandbox}
    />
  )
}

export function ViewerRoot({
  provider,
  input,
  mode = 'structure',
  activeIndex = 0,
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
        (
          id: InscriptionId,
          _owner: ViewerNode,
        ) => (
          <ContentNode
            provider={provider}
            id={id}
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

  if (mode === 'single') {
    const [entry] =
      selectPhysicalEntries(
        state,
        mode,
        activeIndex,
      )

    if (!entry) {
      return null
    }

    return (
      <div
        className={className}
        data-utxo-viewer=""
        data-viewer-mode="single"
      >
        <div
          data-viewer-content={entry.id}
          data-viewer-offset={entry.offset}
        >
          {renderContent(
            entry.id,
            makePhysicalViewerNode(
              entry,
              state,
            ),
          )}
        </div>
      </div>
    )
  }

  if (mode === 'grid') {
    return (
      <div
        className={className}
        data-utxo-viewer=""
        data-viewer-mode="grid"
      >
        {selectPhysicalEntries(
          state,
          mode,
          activeIndex,
        ).map(
          (entry) => (
            <div
              key={entry.id}
              data-viewer-grid-item={entry.id}
              data-viewer-offset={entry.offset}
            >
              {renderContent(
                entry.id,
                makePhysicalViewerNode(
                  entry,
                  state,
                ),
              )}
            </div>
          ),
        )}
      </div>
    )
  }

  return (
    <StructuralViewer
      roots={state.roots}
      renderContent={renderContent}
      className={className}
    />
  )
}
