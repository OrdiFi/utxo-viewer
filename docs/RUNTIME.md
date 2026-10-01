# Runtime Layer

## Purpose

The Runtime layer adds optional application-specific presentation behavior on top of the neutral UTXO Viewer.

Runtime behavior may change how compatible content is displayed or interacted with.

It must not redefine observed Bitcoin geometry or structural ownership.

## Boundary

The neutral Viewer is responsible for:

- resolving observed UTXO state
- reading structural information
- reconstructing structural groups
- preserving physical order
- rendering ordinary inscription content

The Runtime layer may provide specialized presentation for compatible content.

It does not:

- alter UTXO value
- alter satpoints
- alter offsets
- alter postage
- invent structural ownership
- validate BCE transactions
- execute BCE operations

## Runtime enablement

The desktop application exposes an optional OrdiFi Runtime toggle.

When disabled, the Viewer continues to display the underlying content and structure without application-specific runtime behavior.

When enabled, compatible runtime metadata may activate specialized presentation.

## Runtime detection

Runtime behavior is selected from compatible inscription specifications.

Application-specific runtime metadata is interpreted only after physical and structural state has been resolved.

The Runtime layer therefore depends on Viewer state rather than replacing it.

## Suitcase runtime

Suitcase presentation may provide interactive container behavior such as:

- lid state
- shelf navigation
- virtualized child presentation
- container-specific layout

These behaviors are presentation-only.

The underlying child inscriptions and structural relationships remain defined by resolved Viewer state.

## Album runtime

Album presentation may provide page-based navigation and page-turn behavior.

Page windows and presentation parameters are runtime concerns.

They do not alter the underlying structural composition.

## Case surfaces

Compatible Case content may expose front and back surfaces.

The Viewer may present such surfaces as one interactive visual object while preserving the underlying inscription identities and satpoint geometry.

A front/back pair does not imply two physical Bitcoin positions when both inscriptions share the same satpoint.

## Surface pairs

`SurfacePairRuntime` provides presentation for compatible paired surfaces.

Surface pairing is a Viewer presentation concept layered on top of resolved content.

It must not change:

- inscription identity
- structural membership
- physical order
- satpoint truth

## Case surface rendering

`CaseSurfaceRuntime` provides visual presentation for an individual Case surface.

`CaseBackRuntime` resolves and presents compatible back-surface information.

These runtimes may support visual transitions such as front/back rotation while leaving structural interpretation unchanged.

## Runtime badges

Runtime-specific badges may identify active presentation behavior.

A badge is presentation metadata only.

It does not imply additional Bitcoin or structural state.

## Content renderer

Content that does not require a specialized runtime is rendered through the normal Viewer content path.

The Runtime layer exists alongside, not instead of, the general content renderer.

## Invariant

Runtime presentation may enrich how a composition is viewed.

It must never change the meaning of observed Bitcoin geometry or the structural relationships reconstructed by the Viewer.
