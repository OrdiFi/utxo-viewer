# Build and Development

## Technology

OrdiFi Bitcoin UTXO Viewer is built with:

- React
- TypeScript
- Vite
- Tauri 2
- Rust

The desktop package is currently version `1.0.1`.

## Requirements

Development requires:

- Node.js and npm
- Rust toolchain compatible with Rust 1.77.2 or newer
- Tauri 2 CLI for native desktop packaging
- platform-specific Tauri build dependencies

The repository contains `package-lock.json`, so npm installs should use the locked dependency graph.

## Install dependencies

    npm ci

## Frontend development

Start the Vite development server:

    npm run dev

The Tauri development configuration expects the frontend at:

    http://localhost:5173

## Frontend production build

Build the React and TypeScript frontend:

    npm run build

This performs:

    tsc -b
        |
        v
    vite build

The generated frontend is written to:

    dist/

## Tests

Run the complete Viewer test suite with:

    npx vitest run

The test suite covers the provider, structural readers, structural resolver and Viewer state/rendering behavior.

## Desktop development

With the Tauri 2 CLI installed, run the desktop application through Tauri development mode:

    cargo tauri dev

The Tauri configuration runs `npm run dev` as its frontend development command.

## Desktop build

Build the native desktop package with:

    cargo tauri build

Before packaging, the Tauri configuration runs:

    npm run build

The native application uses the generated `dist/` frontend.

## Tauri application

Desktop identity:

    Product: OrdiFi UTXO Viewer
    Identifier: io.ordifi.utxoviewer
    Version: 1.0.1

The Tauri shell contains minimal native application logic.

Viewer interpretation, structural resolution and content presentation are implemented in the TypeScript/React layers.

## Validation before release

Before producing a release package, run:

    npm ci
    npm run build
    npx vitest run
    git diff --check

A release should not proceed if the production build or test suite fails.

## Microsoft Store builds

Microsoft Store packages use the same Viewer core and structural model.

Store-distributed builds must comply with Microsoft Store distribution requirements and must not promote acquiring additional software outside the Store from within the application.

The Runtime feature itself is part of Viewer presentation behavior and is independent from software distribution.
