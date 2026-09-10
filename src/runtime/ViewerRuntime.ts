import type { ReactNode } from 'react'

import type { ViewerProvider } from '../provider/ViewerProvider'
import type {
  StructuredSpec,
  ViewerNode,
} from '../structure/types'

export type ViewerRuntimeContext = {
  root: ViewerNode
  spec: StructuredSpec | null
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
