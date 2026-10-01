# OrdiFi Bitcoin UTXO Viewer

OrdiFi Bitcoin UTXO Viewer is a read-only desktop viewer for Bitcoin UTXOs, inscriptions and structured ordinal compositions.

The application resolves live on-chain state, preserves physical Bitcoin geometry and reconstructs compatible structural relationships for visualization.

It is built with React, TypeScript, Vite and Tauri.

## Core model

The Viewer separates observed Bitcoin state from structural interpretation and application-specific presentation.

Physical Bitcoin information includes:

- UTXOs
- inscription IDs
- satpoints
- offsets
- postage
- physical order

Structural interpretation is based on:

- NUMBER
- LEVEL
- DIRECTION

Higher-order concepts such as parent, child, group, hierarchy, nesting and subtree are derived from those structural primitives.

## Relationship to BCE

Bitcoin Composition Engine (BCE) and the UTXO Viewer solve opposite sides of the same model.

BCE reduces structural composition into deterministic physical Bitcoin geometry.

The Viewer reads observed physical geometry and reconstructs compatible structural composition for display.

The Viewer does not execute BCE operations or validate transaction legality.


## Features

- read-only inspection of Bitcoin UTXOs and inscriptions
- input by inscription ID, inscription number, UTXO or satpoint
- physical offset and postage visualization
- shared-satpoint preservation
- Structured Composition reconstruction
- structural and physical viewing modes
- pluggable Viewer providers
- optional OrdiFi Runtime presentation
- Case front/back surface presentation
- Suitcase and Album runtime support
- Tauri desktop application

## Architecture

The Viewer separates physical Bitcoin state, structural interpretation and presentation.

    ViewerProvider
        |
        v
    observed UTXO geometry
        |
        v
    structural readers
        |
        v
    resolveStructuralGroups
        |
        v
    buildViewerNodes
        |
        v
    ViewerRoot
        |
        v
    ContentRenderer / optional Runtime

See [Architecture](docs/ARCHITECTURE.md).

## Structured Composition

Structured Composition uses three primary concepts:

- NUMBER
- LEVEL
- DIRECTION

The Viewer reconstructs compatible structural relationships from observed Bitcoin geometry and preserved structural information.

Levels are local structural roles rather than a fixed global A-J depth hierarchy.

See [Structured Composition](docs/STRUCTURED_COMPOSITION.md).

## UTXO geometry

Physical Bitcoin state remains the source of truth.

The Viewer preserves:

- inscription identity
- satpoints
- offsets
- postage
- physical order
- shared-satpoint relationships

See [UTXO Model](docs/UTXO_MODEL.md).

## Runtime

The optional OrdiFi Runtime adds application-specific presentation without changing physical UTXO geometry or structural ownership.

Runtime presentation includes compatible Suitcase, Album and Case surface behavior.

See [Runtime Layer](docs/RUNTIME.md).

## Development

Install dependencies:

    npm ci

Build the frontend:

    npm run build

Run tests:

    npx vitest run

Build the Tauri desktop application:

    cargo tauri build

See [Build and Development](docs/BUILD.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Structured Composition](docs/STRUCTURED_COMPOSITION.md)
- [UTXO Model](docs/UTXO_MODEL.md)
- [Runtime Layer](docs/RUNTIME.md)
- [Build and Development](docs/BUILD.md)
