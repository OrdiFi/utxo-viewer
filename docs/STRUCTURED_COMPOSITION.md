# Structured Composition

## Purpose

Structured Composition describes how compatible inscription relationships can be reconstructed from observed Bitcoin UTXO geometry.

The Viewer does not invent structure. It combines explicit structural information with observed physical state.

## Structural primitives

The structural language is based on three primary concepts:

- NUMBER
- LEVEL
- DIRECTION

Higher-order concepts such as parent, child, group, hierarchy, nesting and subtree are derived from these primitives.

## Level

A level expresses structural depth within a relation.

Level identifiers may be represented as:

    A
    B
    C
    ...

These identifiers do not define a fixed global A-J hierarchy.

A level is local to the relation being interpreted.

A node may therefore act as a child at one level while also acting as the parent of another local relation.

## Number

NUMBER distinguishes and orders structural instances within the same level.

For example:

    B1
    B2
    B3

The level identifies structural depth.

The number identifies the ordered instance within that level.

## Direction

DIRECTION describes the physical side of a child relationship relative to its parent.

Supported values are:

- `-`
- `+`

A negative relation resolves before its parent in physical order.

A positive relation resolves after its parent in physical order.

Direction does not replace physical offsets. It is interpreted together with observed UTXO geometry.

## Structural roles

Terms such as:

- `rootLevel`
- `parentLevel`
- `childLevel`

describe roles assumed by levels inside structural relations.

They are not additional structural primitives.

## Structural instances

A structural specification describes permitted structural grammar.

A structural instance is one concrete realization of that grammar on observed Bitcoin state.

The Viewer reads structural instance metadata from inscription content specifications and resolves it against physical UTXO geometry.

## Physical reconstruction

The Viewer reconstructs structure from observed data including:

- inscription IDs
- physical order
- offsets
- postage
- satpoints
- embedded structural information

Conceptually:

    observed physical geometry
        |
        v
    structural readers
        |
        v
    structural group resolution
        |
        v
    reconstructed viewer nodes

The Viewer does not infer missing offsets, missing postage or unsupported structural relationships.

## Recursive structure

Structural ownership is resolved recursively.

Local relations may repeat at multiple nesting depths.

For example, a local A -> B relation may occur again inside a child subtree without requiring a globally increasing alphabetic depth model.

Recursion follows resolved structural ownership.

## Shared satpoints

Multiple inscription IDs may share one physical satpoint.

A shared satpoint remains one physical position.

The existence of multiple inscription identities does not imply multiple physical spans.

Structural interpretation may select one or more identities while preserving the underlying shared-satpoint truth.

## Preservation

Observed inscriptions that are not claimed by a structural group remain available as independent viewer nodes.

Structural reconstruction must not silently discard observed on-chain information.

## BCE relationship

Bitcoin Composition Engine performs the forward transformation:

    structural composition
        ->
    verified physical geometry

The UTXO Viewer performs the compatible reverse interpretation:

    observed physical geometry
        ->
    reconstructed structural composition

The Viewer reconstructs only what is supported by observed Bitcoin state and preserved structural information.
