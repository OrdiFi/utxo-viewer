import {
  useMemo,
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

const DEFAULT_BASE_URL =
  'https://ordifi.io'

function App() {
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

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const next = draft.trim()

    if (!next) {
      return
    }

    setInput(next)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <div className="app-kicker">
            OrdiFi
          </div>

          <h1>UTXO Viewer</h1>

          <p>
            Live on-chain state interpreter
          </p>
        </div>

        <div
          className="provider-status"
          title={baseUrl}
        >
          {baseUrl}
        </div>
      </header>

      <form
        className="viewer-search"
        onSubmit={submit}
      >
        <input
          value={draft}
          onChange={(event) =>
            setDraft(event.target.value)
          }
          placeholder="Inscription ID, number or UTXO"
          spellCheck={false}
          autoComplete="off"
        />

        <button type="submit">
          View
        </button>
      </form>

      <section className="viewer-stage">
        {input ? (
          <ViewerRoot
            provider={provider}
            input={input}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div className="viewer-empty">
            Enter an inscription ID,
            inscription number or UTXO.
          </div>
        )}
      </section>
    </main>
  )
}

export default App
