import { create } from 'zustand'
import { api } from '../api/client'
import type { ModelData, PaginatedModels } from '../types'

interface ModelStore {
  models: ModelData[]
  totalModels: number
  currentPage: number
  pageSize: number
  searchQuery: string
  modalityFilter: string
  isLoading: boolean

  fetchModels: () => Promise<void>
  setSearch: (q: string) => void
  setModalityFilter: (m: string) => void
  setPage: (p: number) => void
  deleteModel: (id: number) => Promise<void>
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: [],
  totalModels: 0,
  currentPage: 1,
  pageSize: 20,
  searchQuery: '',
  modalityFilter: 'all',
  isLoading: false,

  async fetchModels() {
    const { currentPage, pageSize, searchQuery, modalityFilter } = get()
    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('page_size', String(pageSize))
      if (searchQuery) params.set('search', searchQuery)
      if (modalityFilter !== 'all') params.set('modality', modalityFilter)
      const data = await api.get<PaginatedModels>(`/models?${params}`)
      set({ models: data.items, totalModels: data.total })
    } catch (e) {
      console.error('fetchModels failed:', e)
    } finally {
      set({ isLoading: false })
    }
  },

  setSearch(q: string) {
    set({ searchQuery: q, currentPage: 1 })
    get().fetchModels()
  },

  setModalityFilter(m: string) {
    set({ modalityFilter: m, currentPage: 1 })
    get().fetchModels()
  },

  setPage(p: number) {
    set({ currentPage: p })
    get().fetchModels()
  },

  async deleteModel(id: number) {
    try {
      await api.del(`/models/${id}`)
      get().fetchModels()
    } catch (e) {
      console.error('deleteModel failed:', e)
    }
  },
}))

export const selectModels = (s: ModelStore) => s.models
export const selectIsLoading = (s: ModelStore) => s.isLoading
export const selectModalityFilter = (s: ModelStore) => s.modalityFilter
export const selectSearchQuery = (s: ModelStore) => s.searchQuery
