# OrdiFi Bitcoin UTXO Viewer Architecture

## Purpose

The OrdiFi Bitcoin UTXO Viewer is a read-only viewer for observed Bitcoin UTXO state, inscriptions and compatible structured compositions.

The Viewer separates physical Bitcoin state, structural interpretation and application-specific presentation.

## Architecture

    User input
        |
        v
    ViewerProvider
        |
        v
    observed UTXO geometry + content specs
        |
        v
    loadViewerState
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
    ViewerRoot / StructuralViewer
        |
        v
    ContentRenderer / optional Runtime

## Provider layer

`ViewerProvider` is the neutral data boundary.

A provider resolves:

- inscription IDs
- inscription numbers
- UTXOs
- satpoints

It supplies observed Bitcoin state including:

- UTXO value
- inscription IDs
- physical offsets
- postage
- content
- embedded content specifications

The provider does not validate BCE transactions and does not interpret application-specific runtime behavior.

## Structural resolution

`loadViewerState` combines observed physical geometry with embedded structural information.

It:

- resolves the requested input
- loads complete UTXO geometry
- loads content specifications
- reads structural instance metadata
- resolves structural groups
- builds viewer nodes
- preserves inscriptions not claimed by a structural group

The structural resolver does not invent missing offsets, postage or structural relationships.

## Rendering

`ViewerRoot` owns Viewer loading state and selects structural or physical presentation.

`StructuralViewer` renders reconstructed structure.

`ContentRenderer` renders inscription content independently from structural interpretation.

## Runtime layer

Application runtimes are presentation behavior layered above the neutral structural Viewer.

Runtime behavior does not redefine observed UTXO geometry or structural ownership.

Examples include OrdiFi Suitcase, Album and Case surface presentation.

## BCE boundary

Bitcoin Composition Engine and the Viewer operate on opposite sides of the same model.

    BCE:
    structural composition
        -> verified physical geometry

    Viewer:
    observed physical geometry
        -> reconstructed structural composition

The Viewer does not execute Compose, Split, Extract or Insert operations.

It interprets observed chain state for display.
