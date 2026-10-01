# UTXO Model

## Purpose

The Viewer treats observed Bitcoin UTXO geometry as the physical source of truth.

Structural interpretation is layered on top of this observed state and must not rewrite it.

## Physical model

The Viewer works with:

- UTXO outpoints
- inscription IDs
- satpoints
- offsets
- postage
- physical order
- UTXO value

These values describe where inscription-bearing spans exist inside a Bitcoin output.

## Outpoint

An outpoint identifies a Bitcoin transaction output.

It is represented by:

    txid:vout

The Viewer resolves supported inputs to the UTXO that contains the relevant inscription state.

## Satpoint

A satpoint identifies a position inside a transaction output.

Conceptually:

    txid:vout:offset

The offset is measured in satoshis from the beginning of the output.

## Offset

Offset identifies the physical start position of an inscription-bearing span inside a UTXO.

The Viewer does not invent missing offsets.

Observed offsets determine physical ordering.

## Postage

Postage is the physical span associated with a resolved inscription position or structural member.

For a physical range:

    postage = end - offset

Postage is observed or derived from complete physical UTXO geometry.

The Viewer does not silently substitute a default postage value when required physical information is missing.

## Physical order

Physical order is determined by observed offsets.

Structural direction may help interpret relationships, but it does not override physical Bitcoin geometry.

## Shared satpoints

Multiple inscriptions may occupy the same satpoint.

When this occurs:

    inscription identity count
        !=
    physical position count

A shared satpoint remains one physical position even when multiple inscription IDs are present.

The Viewer preserves every observed inscription identity while avoiding the invention of duplicate physical spans.

## Structural groups

A structural group may contain one or more adjacent physical members.

Grouping changes how physical members are interpreted for display.

It does not change:

- UTXO value
- observed offsets
- observed satpoints
- physical postage
- physical order

## Unstructured inscriptions

An inscription does not need to participate in a reconstructed structural group.

Observed inscriptions that are not claimed by structural resolution remain visible as independent Viewer nodes.

This prevents structural interpretation from hiding valid on-chain content.

## Provider responsibility

The Viewer provider supplies complete observed UTXO state required for interpretation.

This includes inscription identities, offsets and postage.

The structural resolver consumes that physical state but does not validate Bitcoin transactions or BCE operation legality.

## Invariant

The Viewer may derive structure from physical geometry.

It must not alter physical geometry in order to make a structural interpretation fit.
