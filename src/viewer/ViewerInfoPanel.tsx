import {
  useMemo,
  useState,
} from 'react'

import type {
  InscriptionId,
} from '../structure/types'

import type {
  ViewerState,
} from './loadViewerState'

type Tab =
  | 'info'
  | 'technical'
  | 'spec'
  | 'offsets'

export type ViewerInfoPanelProps = {
  state: ViewerState | null
  selectedId?: InscriptionId | null
}

function Value({
  label,
  value,
  mono = false,
}: {
  label: string
  value: unknown
  mono?: boolean
}) {
  const display =
    value === null ||
    value === undefined ||
    value === ''
      ? '—'
      : String(value)

  return (
    <div className="viewer-info-row">
      <div className="viewer-info-label">
        {label}
      </div>

      <div
        className={
          mono
            ? 'viewer-info-value viewer-info-mono'
            : 'viewer-info-value'
        }
        title={display}
      >
        {display}
      </div>
    </div>
  )
}

export function ViewerInfoPanel({
  state,
  selectedId: selectedIdProp,
}: ViewerInfoPanelProps) {
  const [tab, setTab] =
    useState<Tab>('info')

  const selectedId =
    (
      selectedIdProp ??
      state?.input.id ??
      state?.roots[0]?.id ??
      state?.output.inscriptions[0]?.id ??
      null
    ) as InscriptionId | null

  const spec =
    useMemo(
      () =>
        selectedId !== null && state
          ? state.specs.get(selectedId) ?? null
          : null,
      [
        state,
        selectedId,
      ],
    )

  if (!state) {
    return (
      <aside className="viewer-info-panel">
        <div className="viewer-info-empty">
          No viewer state loaded.
        </div>
      </aside>
    )
  }

  return (
    <aside className="viewer-info-panel">
      <nav
        className="viewer-info-tabs"
        aria-label="Content information"
      >
        {(
          [
            ['info', 'Info'],
            ['technical', 'Technical'],
            ['spec', 'Spec'],
            ['offsets', 'Offsets'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={
              tab === id
                ? 'viewer-info-tab is-active'
                : 'viewer-info-tab'
            }
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="viewer-info-scroll">
        {tab === 'info' ? (
          <section className="viewer-info-section">
            <h2>Content</h2>

            <Value
              label="ID"
              value={selectedId}
              mono
            />

            <Value
              label="Input type"
              value={state.input.type}
            />

            <Value
              label="UTXO"
              value={state.input.outpoint}
              mono
            />

            <Value
              label="Satpoint"
              value={
                state.input.satpoint
                  ? `${state.input.satpoint.txid}:${state.input.satpoint.vout}:${state.input.satpoint.offset}`
                  : null
              }
              mono
            />
          </section>
        ) : null}

        {tab === 'technical' ? (
          <section className="viewer-info-section">
            <h2>Technical</h2>

            <Value
              label="Provider output"
              value={state.output.outpoint}
              mono
            />

            <Value
              label="Value"
              value={`${state.output.value} sats`}
            />

            <Value
              label="Inscriptions"
              value={state.output.inscriptions.length}
            />

            <Value
              label="Resolved roots"
              value={state.roots.length}
            />

            <Value
              label="Root ID"
              value={state.roots[0]?.id ?? null}
              mono
            />

            <Value
              label="Root level"
              value={state.roots[0]?.level ?? null}
            />

            <Value
              label="Root number"
              value={state.roots[0]?.number ?? null}
            />
          </section>
        ) : null}

        {tab === 'spec' ? (
          <section className="viewer-info-section">
            <h2>Spec</h2>

            {spec ? (
              <pre className="viewer-spec">
                {JSON.stringify(
                  spec,
                  null,
                  2,
                )}
              </pre>
            ) : (
              <div className="viewer-info-empty">
                No structural/content spec detected.
              </div>
            )}
          </section>
        ) : null}

        {tab === 'offsets' ? (
          <section className="viewer-info-section">
            <h2>Offsets</h2>

            <div className="viewer-offset-list">
              {state.output.inscriptions.map(
                (entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.id === selectedId
                        ? 'viewer-offset-entry is-active'
                        : 'viewer-offset-entry'
                    }
                  >
                    <div className="viewer-offset-head">
                      <strong>
                        Offset {entry.offset}
                      </strong>

                      <span>
                        {entry.postage} sats
                      </span>
                    </div>

                    <div
                      className="viewer-offset-id"
                      title={entry.id}
                    >
                      {entry.id}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
