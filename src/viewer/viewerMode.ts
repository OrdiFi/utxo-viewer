import type {
  ViewerState,
} from './loadViewerState'

export type ViewerMode =
  | 'structure'
  | 'grid'
  | 'single'

export type PhysicalViewerEntry =
  ViewerState['output']['inscriptions'][number]

export function selectPhysicalEntries(
  state: ViewerState,
  mode: ViewerMode,
  activeIndex = 0,
): PhysicalViewerEntry[] {
  if (mode === 'grid') {
    return state.output.inscriptions
  }

  if (mode === 'single') {
    if (
      state.output.inscriptions.length === 0
    ) {
      return []
    }

    const index =
      Math.max(
        0,
        Math.min(
          activeIndex,
          state.output.inscriptions.length - 1,
        ),
      )

    return [
      state.output.inscriptions[index],
    ]
  }

  return []
}
