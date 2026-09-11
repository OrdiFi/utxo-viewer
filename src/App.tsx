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

  const [mode, setMode] =
    useState<'grid' | 'single'>('grid')

  const [activeIndex, setActiveIndex] =
    useState(0)

  const [infoOpen, setInfoOpen] =
    useState(true)

  const [fullscreen, setFullscreen] =
    useState(false)

  const selectedInfoId =
    mode === 'single'
      ? state?.output.inscriptions[
          activeIndex
        ]?.id ?? null
      : null

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
    setMode('grid')
    setActiveIndex(0)
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
        <div className="viewer-brand">
          <img
            src="/brand/minihero.webp"
            alt="OrdiFi"
            className="viewer-brand-logo"
          />

          <div className="viewer-brand-title">
            UTXO Viewer
          </div>
        </div>

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
        <div className="viewer-stage-wrap">
          <div className="viewer-modebar">
            <div className="viewer-mode-buttons">
              <button
                type="button"
                className={
                  mode === 'grid'
                    ? 'viewer-mode-button is-active'
                    : 'viewer-mode-button'
                }
                onClick={() =>
                  setMode('grid')
                }
              >
                Grid
              </button>

              <button
                type="button"
                className={
                  mode === 'single'
                    ? 'viewer-mode-button is-active'
                    : 'viewer-mode-button'
                }
                disabled={
                  !state ||
                  state.output.inscriptions.length === 0
                }
                onClick={() => {
                  setMode('single')

                  if (
                    activeIndex >=
                    (state?.output.inscriptions.length ?? 0)
                  ) {
                    setActiveIndex(0)
                  }
                }}
              >
                Single
              </button>
            </div>

            <div className="viewer-navigation">
              <button
                type="button"
                className="viewer-nav-button"
                disabled={
                  mode !== 'single' ||
                  activeIndex <= 0
                }
                onClick={() =>
                  setActiveIndex(
                    (value) =>
                      Math.max(0, value - 1),
                  )
                }
              >
                ← Prev
              </button>

              <div className="viewer-position">
                {state &&
                state.output.inscriptions.length > 0 ? (
                  mode === 'single' ? (
                    <>
                      {activeIndex + 1}
                      {' / '}
                      {state.output.inscriptions.length}
                      {' · offset '}
                      {state.output.inscriptions[
                        activeIndex
                      ]?.offset ?? '—'}
                    </>
                  ) : (
                    <>
                      {state.output.inscriptions.length}
                      {' item'}
                      {state.output.inscriptions.length === 1
                        ? ''
                        : 's'}
                    </>
                  )
                ) : (
                  '—'
                )}
              </div>

              <button
                type="button"
                className="viewer-nav-button"
                disabled={
                  mode !== 'single' ||
                  !state ||
                  activeIndex >=
                    state.output.inscriptions.length - 1
                }
                onClick={() =>
                  setActiveIndex(
                    (value) =>
                      Math.min(
                        (state?.output.inscriptions.length ?? 1) - 1,
                        value + 1,
                      ),
                  )
                }
              >
                Next →
              </button>
            </div>
          </div>

          <div className="viewer-stage">
          {input ? (
            <ViewerRoot
              key={`${input}:${revision}`}
              provider={provider}
              input={input}
              mode={mode}
              activeIndex={activeIndex}
              onSelectPhysicalIndex={(index) => {
                setActiveIndex(index)
                setMode('single')
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onStateChange={setState}
            />
          ) : (
            <div className="viewer-empty">
              <div className="viewer-empty-hero">
                <img
                  src="/brand/minihero.webp"
                  alt="OrdiFi"
                  className="viewer-empty-logo"
                />

                <h1>UTXO Viewer</h1>

                <p>
                  Interpret live Bitcoin UTXO structure.
                </p>

                <div className="viewer-empty-hint">
                  Enter an inscription ID, inscription
                  number, UTXO or satpoint above.
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {infoOpen ? (
          <ViewerInfoPanel
            state={state}
            selectedId={selectedInfoId}
          />
        ) : null}
      </section>
    </main>
  )
}

export default App
