import { create } from 'zustand'
import { streamSSE } from '../hooks/useSSE'
import type {
  SelectedModel,
  SmartInvocationResult,
  SmartRoutingStatus,
  SSEEvent,
} from '../types'

interface SmartRoutingStore {
  query: string
  status: SmartRoutingStatus
  reasoning: string
  selectedModels: SelectedModel[]
  invocationResults: SmartInvocationResult[]
  error: string | null
  sessionId: number | null
  totalLatencyMs: number | null
  abortController: AbortController | null

  setQuery: (q: string) => void
  startRouting: () => void
  reset: () => void
  abort: () => void
}

export const useSmartRoutingStore = create<SmartRoutingStore>((set, get) => ({
  query: '',
  status: 'idle',
  reasoning: '',
  selectedModels: [],
  invocationResults: [],
  error: null,
  sessionId: null,
  totalLatencyMs: null,
  abortController: null,

  setQuery: (q) => set({ query: q }),

  startRouting: () => {
    const { query, abortController: prev } = get()
    if (!query.trim()) return
    prev?.abort()

    set({
      status: 'routing',
      reasoning: '',
      selectedModels: [],
      invocationResults: [],
      error: null,
      sessionId: null,
      totalLatencyMs: null,
    })

    const controller = streamSSE(
      '/api/v1/route/smart',
      { query: query.trim() },
      {
        onEvent: (evt: SSEEvent) => {
          const d = evt.data
          switch (evt.event) {
            case 'routing_start':
              set({ sessionId: d.session_id as number })
              break
            case 'reasoning':
              set({ reasoning: d.text as string })
              break
            case 'models_selected':
              set({
                selectedModels: d.models as SelectedModel[],
                status: 'invoking',
              })
              break
            case 'invocation_result':
              set((s) => ({
                invocationResults: [
                  ...s.invocationResults,
                  {
                    model_id: d.model_id as string,
                    output: d.output as Record<string, unknown>,
                    latency_ms: d.latency_ms as number,
                    success: d.success as boolean,
                    error_message: d.error_message as string | null,
                  },
                ],
              }))
              break
            case 'complete':
              set({
                status: 'completed',
                totalLatencyMs: d.total_latency_ms as number,
              })
              break
            case 'error':
              set({
                status: 'error',
                error: d.message as string,
              })
              break
          }
        },
        onError: (err) => {
          set({ status: 'error', error: err.message })
        },
        onDone: () => {
          const s = get()
          if (s.status === 'routing' || s.status === 'invoking') {
            set({ status: 'completed' })
          }
        },
      },
    )

    set({ abortController: controller })
  },

  reset: () => {
    get().abortController?.abort()
    set({
      query: '',
      status: 'idle',
      reasoning: '',
      selectedModels: [],
      invocationResults: [],
      error: null,
      sessionId: null,
      totalLatencyMs: null,
      abortController: null,
    })
  },

  abort: () => {
    get().abortController?.abort()
    set({ status: 'idle', abortController: null })
  },
}))
