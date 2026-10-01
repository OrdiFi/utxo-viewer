import {
  useEffect,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import './App.css'

import { getCurrentWindow } from '@tauri-apps/api/window'

import Viewer from './webapp-viewer/Viewer'
import ContentInfoPanel from './webapp-viewer/ContentInfoPanel'

import {
  getViewerApiSettings,
  setViewerApiSettings,
  viewerApiFetch,
} from './webapp-viewer/viewerApi'

type ViewerInfo = {
  id: string | null
  specId: string | null
  utxo: string | null
  contentIds: string[]
  contents: Array<{
    id: string
    offset: number | null
  }>
}

function App() {
  const [draft, setDraft] =
    useState('')

  const [input, setInput] =
    useState('')

  const [revision, setRevision] =
    useState(0)

  const [infoOpen, setInfoOpen] =
    useState(true)

  const [isMaximized, setIsMaximized] =
    useState(false)

  const [settingsOpen, setSettingsOpen] =
    useState(false)

  const initialApiSettings =
    getViewerApiSettings()

  const [apiProvider, setApiProvider] =
    useState<'ordifi' | 'custom'>(
      initialApiSettings.provider,
    )

  const [apiBaseUrl, setApiBaseUrl] =
    useState(
      localStorage.getItem(
        'ordifi:viewer-api-base-url',
      ) ||
        initialApiSettings.baseUrl,
    )

  const [apiToken, setApiToken] =
    useState(
      localStorage.getItem(
        'ordifi:viewer-api-token',
      ) || '',
    )

  const [apiStatus, setApiStatus] =
    useState<
      'idle' |
      'testing' |
      'ok' |
      'error'
    >('idle')

  const [apiStatusText, setApiStatusText] =
    useState('')

  const [runtimeEnabled, setRuntimeEnabled] =
    useState(
      localStorage.getItem(
        'ordifi:runtime-enabled',
      ) === '1',
    )

  const [viewerSize, setViewerSize] =
    useState(500)

  const [info, setInfo] =
    useState<ViewerInfo>({
      id: null,
      specId: null,
      utxo: null,
      contentIds: [],
      contents: [],
    })

  useEffect(() => {
    const savedProvider =
      localStorage.getItem(
        'ordifi:viewer-api-provider',
      )

    const provider =
      savedProvider === 'custom'
        ? 'custom'
        : 'ordifi'

    const savedBaseUrl =
      localStorage.getItem(
        'ordifi:viewer-api-base-url',
      )

    setApiProvider(provider)

    if (
      provider === 'custom' &&
      savedBaseUrl
    ) {
      setApiBaseUrl(savedBaseUrl)

      setViewerApiSettings({
        provider,
        baseUrl: savedBaseUrl,
      })
    } else {
      setApiBaseUrl(
        'https://ordifi.io',
      )

      setViewerApiSettings({
        provider: 'ordifi',
        baseUrl: 'https://ordifi.io',
      })
    }
  }, [])

  useEffect(() => {
    function updateViewerSize() {
      const availableWidth =
        infoOpen
          ? window.innerWidth - 430
          : window.innerWidth - 60

      const availableHeight =
        window.innerHeight - 150

      setViewerSize(
        Math.max(
          280,
          Math.min(
            availableWidth,
            availableHeight,
          ),
        ),
      )
    }

    updateViewerSize()

    window.addEventListener(
      'resize',
      updateViewerSize,
    )

    return () => {
      window.removeEventListener(
        'resize',
        updateViewerSize,
      )
    }
  }, [infoOpen])

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const next = draft.trim()

    if (!next) {
      return
    }

    setInfo({
      id: null,
      specId: null,
      utxo: null,
      contentIds: [],
      contents: [],
    })

    setInput(next)
    setRevision((value) => value + 1)
  }

  function currentApiBaseUrl() {
    return apiProvider === 'ordifi'
      ? 'https://ordifi.io'
      : apiBaseUrl.trim()
  }

  async function testApiConnection() {
    const baseUrl =
      currentApiBaseUrl()

    if (!baseUrl) {
      setApiStatus('error')
      setApiStatusText(
        'Base URL is required.',
      )
      return
    }

    setViewerApiSettings({
      provider: apiProvider,
      baseUrl,
      token: apiToken.trim(),
    })

    setApiStatus('testing')
    setApiStatusText(
      'Testing connection...',
    )

    const testInput =
      input ||
      draft.trim() ||
      '436a34670ea7225487330d7dc2e65f25e89884a845ecfb2f8edddb02b2f7acc6:0'

    try {
      const res =
        await viewerApiFetch(
          `/api/viewer/resolve?input=${encodeURIComponent(
            testInput,
          )}`,
          {
            cache: 'no-store',
          },
        )

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}`,
        )
      }

      const data = await res.json()

      if (!data?.ok) {
        throw new Error(
          data?.error ||
            'Viewer API did not return ok.',
        )
      }

      setApiStatus('ok')
      setApiStatusText(
        'Connection successful.',
      )
    } catch (error) {
      setApiStatus('error')
      setApiStatusText(
        error instanceof Error
          ? error.message
          : 'Connection failed.',
      )
    }
  }

  function saveApiSettings() {
    const baseUrl =
      currentApiBaseUrl()

    if (!baseUrl) {
      setApiStatus('error')
      setApiStatusText(
        'Base URL is required.',
      )
      return
    }

    setViewerApiSettings({
      provider: apiProvider,
      baseUrl,
      token: apiToken.trim(),
    })

    localStorage.setItem(
      'ordifi:viewer-api-provider',
      apiProvider,
    )

    if (apiProvider === 'custom') {
      localStorage.setItem(
        'ordifi:viewer-api-base-url',
        baseUrl,
      )
    } else {
      localStorage.removeItem(
        'ordifi:viewer-api-base-url',
      )
    }

    if (apiToken.trim()) {
      localStorage.setItem(
        'ordifi:viewer-api-token',
        apiToken.trim(),
      )
    } else {
      localStorage.removeItem(
        'ordifi:viewer-api-token',
      )
    }

    setApiStatus('ok')
    setApiStatusText(
      'API settings saved.',
    )

    if (input) {
      setRevision(
        (value) => value + 1,
      )
    }
  }

  function toggleRuntime(
    enabled: boolean,
  ) {
    setRuntimeEnabled(enabled)

    localStorage.setItem(
      'ordifi:runtime-enabled',
      enabled ? '1' : '0',
    )
  }

  async function minimizeWindow() {
    try {
      await getCurrentWindow().minimize()
    } catch (error) {
      console.error('Unable to minimize window', error)
    }
  }

  async function toggleMaximizeWindow() {
    try {
      const window = getCurrentWindow()
      const maximized = await window.isMaximized()

      if (maximized) {
        await window.unmaximize()
        setIsMaximized(false)
      } else {
        await window.maximize()
        setIsMaximized(true)
      }
    } catch (error) {
      console.error('Unable to toggle maximize state', error)
    }
  }

  return (
    <main
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
            title="Reload"
            aria-label="Reload"
            disabled={!input}
            onClick={() =>
              setRevision(
                (value) => value + 1,
              )
            }
          >
            {"\u21BB"}
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
            {"\u24D8"}
          </button>

          <button
            type="button"
            className="viewer-icon-button"
            title="Settings"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            {"\u2699"}
          </button>

          <button
            type="button"
            className="viewer-icon-button"
            title="Minimize"
            aria-label="Minimize"
            onClick={minimizeWindow}
          >
            {"\u2212"}
          </button>

          <button
            type="button"
            className="viewer-icon-button"
            title={isMaximized ? 'Restore' : 'Maximize'}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
            onClick={toggleMaximizeWindow}
          >
            {isMaximized ? '\u25A3' : '\u25A1'}
          </button>
        </div>
      </header>

      <section className="viewer-workspace">
        <div className="viewer-stage">
          {input ? (
            <div className="desktop-viewer-frame">
              <Viewer
                key={`${input}:${revision}`}
                size={viewerSize}
                initialId={input}
                embedded
                runtimeEnabled={runtimeEnabled}
                onInfoChange={setInfo}
              />

              {info.contents.length > 0 ? (
                <section className="desktop-offset-list">
                  {info.contents.map(
                    (item, index) => (
                      <div
                        key={`${item.id}-${item.offset}-${index}`}
                        className="desktop-offset-row"
                      >
                        <strong>
                          {item.offset === null
                            ? 'Offset \u2014'
                            : `Offset ${item.offset}`}
                        </strong>

                        <span
                          title={item.id}
                        >
                          {item.id}
                        </span>
                      </div>
                    ),
                  )}
                </section>
              ) : null}
            </div>
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
                  Enter an inscription ID,
                  inscription number, UTXO or
                  satpoint above.
                </div>
              </div>
            </div>
          )}
        </div>

        {infoOpen ? (
          <aside className="viewer-info-panel">
            <div className="viewer-info-scroll">
              <ContentInfoPanel
                id={info.id}
                specId={info.specId}
                utxo={info.utxo}
                contentIds={info.contentIds}
              />
            </div>
          </aside>
        ) : null}
      </section>

      {settingsOpen ? (
        <div
          className="viewer-settings-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setSettingsOpen(false)
            }
          }}
        >
          <section
            className="viewer-settings"
            role="dialog"
            aria-modal="true"
            aria-label="Viewer settings"
          >
            <header className="viewer-settings-header">
              <strong>Settings</strong>

              <button
                type="button"
                className="viewer-icon-button"
                title="Close settings"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              >
                &times;
              </button>
            </header>

            <div className="viewer-settings-body">
              <section className="viewer-settings-section">
                <h2>APIs</h2>

                <label className="viewer-settings-field">
                  <span>Provider</span>

                  <select
                    value={apiProvider}
                    onChange={(event) => {
                      const provider =
                        event.target.value === 'custom'
                          ? 'custom'
                          : 'ordifi'

                      setApiProvider(provider)
                      setApiStatus('idle')
                      setApiStatusText('')

                      if (provider === 'ordifi') {
                        setApiBaseUrl(
                          'https://ordifi.io',
                        )
                      }
                    }}
                  >
                    <option value="ordifi">
                      OrdiFi API
                    </option>
                    <option value="custom">
                      Custom Provider
                    </option>
                  </select>
                </label>

                <label className="viewer-settings-field">
                  <span>Base URL</span>

                  <input
                    type="url"
                    value={
                      apiProvider === 'ordifi'
                        ? 'https://ordifi.io'
                        : apiBaseUrl
                    }
                    disabled={
                      apiProvider === 'ordifi'
                    }
                    onChange={(event) =>
                      setApiBaseUrl(
                        event.target.value,
                      )
                    }
                    placeholder="https://example.com"
                    spellCheck={false}
                  />
                </label>

                <label className="viewer-settings-field">
                  <span>API Token</span>

                  <input
                    type="password"
                    value={apiToken}
                    onChange={(event) =>
                      setApiToken(
                        event.target.value,
                      )
                    }
                    placeholder="Bearer token"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>

                <div className="viewer-settings-actions">
                  {apiProvider === 'ordifi' && (
                    <button
                      type="button"
                      className="viewer-settings-button"
                      onClick={() => {
                        window.open(
                          'https://ordifi.io/resources/developers/apis',
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }}
                    >
                      Get API Token
                    </button>
                  )}

                  <button
                    type="button"
                    className="viewer-settings-button"
                    disabled={
                      apiStatus === 'testing'
                    }
                    onClick={testApiConnection}
                  >
                    {apiStatus === 'testing'
                      ? 'Testing...'
                      : 'Test Connection'}
                  </button>

                  <button
                    type="button"
                    className="viewer-settings-button is-primary"
                    onClick={saveApiSettings}
                  >
                    Save
                  </button>
                </div>

                {apiStatusText ? (
                  <div
                    className={`viewer-api-status is-${apiStatus}`}
                  >
                    {apiStatusText}
                  </div>
                ) : null}

                <a
                  className="viewer-settings-link"
                  href="https://ordifi.io/resources/developers/apis"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get or manage OrdiFi API access &rarr;
                </a>
              </section>

              <section className="viewer-settings-section">
                <h2>Runtime</h2>

                <label className="viewer-runtime-toggle">
                  <input
                    type="checkbox"
                    checked={runtimeEnabled}
                    onChange={(event) =>
                      toggleRuntime(
                        event.target.checked,
                      )
                    }
                  />
                  <span>Enable OrdiFi Runtime</span>
                </label>

                <div className="viewer-settings-note">
                  {runtimeEnabled
                    ? 'Runtime is enabled.'
                    : 'Runtime is disabled.'}
                </div>

              </section>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
