import type { ReactNode } from 'react'

import type { ViewerProvider } from '../provider/ViewerProvider'
import type {
  StructuralSpec,
  ViewerNode,
} from '../structure/types'

export type ViewerRuntimeContext = {
  root: ViewerNode
  spec: StructuralSpec | null
  provider: ViewerProvider
  interactive: boolean
}

export interface ViewerRuntime {
  readonly id: string

  canHandle(
    context: ViewerRuntimeContext,
  ): boolean

  render(
    context: ViewerRuntimeContext,
  ): ReactNode
}
