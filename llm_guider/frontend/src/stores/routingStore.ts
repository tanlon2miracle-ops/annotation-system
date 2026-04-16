import { create } from 'zustand'
import { api } from '../api/client'
import type { RoutingResponse, PaginatedLogs, RoutingLogData, RuleRoutingRequest } from '../types'

interface RoutingStore {
  routingResult: RoutingResponse | null
  routingLogs: RoutingLogData[]
  totalLogs: number
  isRouting: boolean

  routeByRule: (req: RuleRoutingRequest) => Promise<void>
  routeByNL: (query: string) => Promise<void>
  fetchLogs: (page?: number) => Promise<void>
}

export const useRoutingStore = create<RoutingStore>((set) => ({
  routingResult: null,
  routingLogs: [],
  totalLogs: 0,
  isRouting: false,

  async routeByRule(req) {
    set({ isRouting: true, routingResult: null })
    try {
      const res = await api.post<RoutingResponse>('/routing/rule', req)
      set({ routingResult: res })
    } catch (e) {
      console.error('routeByRule failed:', e)
    } finally {
      set({ isRouting: false })
    }
  },

  async routeByNL(query) {
    set({ isRouting: true, routingResult: null })
    try {
      const res = await api.post<RoutingResponse>('/routing/nl', { query })
      set({ routingResult: res })
    } catch (e) {
      console.error('routeByNL failed:', e)
    } finally {
      set({ isRouting: false })
    }
  },

  async fetchLogs(page = 1) {
    try {
      const data = await api.get<PaginatedLogs>(`/routing/logs?page=${page}`)
      set({ routingLogs: data.items, totalLogs: data.total })
    } catch (e) {
      console.error('fetchLogs failed:', e)
    }
  },
}))
