import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import './App.css'

import {
  OrdiFiViewerClient,
} from './provider/OrdiFiViewerClient'

import {
  ViewerRoot,
} from './viewer/ViewerRoot'

import {
  ViewerInfoPanel,
} from './viewer/ViewerInfoPanel'

import type {
  ViewerState,
} from './viewer/loadViewerState'

const DEFAULT_BASE_URL =
  'https://ordifi.io'

function App() {
  const shellRef =
    useRef<HTMLElement | null>(null)

  const baseUrl =
    (
      import.meta.env
        .VITE_ORDIFI_BASE_URL as
        | string
        | undefined
    )?.trim() ||
    DEFAULT_BASE_URL

  const provider =
    useMemo(
      () =>
        new OrdiFiViewerClient({
          baseUrl,
        }),
      [baseUrl],
    )

  const [draft, setDraft] =
    useState('')

  const [input, setInput] =
    useState('')

  const [state, setState] =
    useState<ViewerState | null>(null)

  const [revision, setRevision] =
    useState(0)

  const [infoOpen, setInfoOpen] =
    useState(true)

  const [fullscreen, setFullscreen] =
    useState(false)

  useEffect(() => {
    const sync = () => {
      setFullscreen(
        document.fullscreenElement ===
          shellRef.current,
      )
    }

    document.addEventListener(
      'fullscreenchange',
      sync,
    )

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        sync,
      )
    }
  }, [])

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const next = draft.trim()

    if (!next) {
      return
    }

    setState(null)
    setInput(next)
  }

  async function toggleFullscreen() {
    if (
      document.fullscreenElement ===
      shellRef.current
    ) {
      await document.exitFullscreen()
      return
    }

    await shellRef.current
      ?.requestFullscreen()
  }

  return (
    <main
      ref={shellRef}
      className={
        infoOpen
          ? 'viewer-shell has-info'
          : 'viewer-shell'
      }
    >
      <header className="viewer-toolbar">
        <form
          className="viewer-search"
          onSubmit={submit}
        >
          <input
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value)
            }
            placeholder="Inscription ID, number, UTXO or satpoint"
            spellCheck={false}
            autoComplete="off"
          />

          <button
            type="submit"
            className="viewer-primary-button"
          >
            View
          </button>
        </form>

        <div className="viewer-toolbar-actions">
          <button
            type="button"
            className="viewer-icon-button"
            title="Reload state"
            aria-label="Reload state"
            disabled={!input}
            onClick={() =>
              setRevision(
                (value) => value + 1,
              )
            }
          >
            ↻
          </button>

          <button
            type="button"
            className={
              infoOpen
                ? 'viewer-icon-button is-active'
                : 'viewer-icon-button'
            }
            title="Toggle content info"
            aria-label="Toggle content info"
            onClick={() =>
              setInfoOpen(
                (value) => !value,
              )
            }
          >
            ⓘ
          </button>

          <button
            type="button"
            className="viewer-icon-button"
            title={
              fullscreen
                ? 'Exit fullscreen'
                : 'Fullscreen'
            }
            aria-label={
              fullscreen
                ? 'Exit fullscreen'
                : 'Fullscreen'
            }
            onClick={toggleFullscreen}
          >
            {fullscreen ? '×' : '⛶'}
          </button>
        </div>
      </header>

      <section className="viewer-workspace">
        <div className="viewer-stage">
          {input ? (
            <ViewerRoot
              key={`${input}:${revision}`}
              provider={provider}
              input={input}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onStateChange={setState}
            />
          ) : (
            <div className="viewer-empty">
              Enter an inscription ID,
              inscription number, UTXO or
              satpoint.
            </div>
          )}
        </div>

        {infoOpen ? (
          <ViewerInfoPanel
            state={state}
          />
        ) : null}
      </section>
    </main>
  )
}

export default App
