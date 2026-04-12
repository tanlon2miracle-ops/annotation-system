import { create } from 'zustand'
import type { ReasonData } from '../types'
import { api } from '../api/client'

export type ViewMode = 'single' | 'grid'

interface UIStore {
  showShortcutHints: boolean
  reasons: ReasonData[]
  viewMode: ViewMode

  toggleShortcutHints: () => void
  fetchReasons: () => Promise<void>
  setViewMode: (mode: ViewMode) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  showShortcutHints: true,
  reasons: [],
  viewMode: 'single',

  toggleShortcutHints() {
    set({ showShortcutHints: !get().showShortcutHints })
  },

  async fetchReasons() {
    try {
      const data = await api.get<ReasonData[]>('/reasons')
      set({ reasons: data })
    } catch (e) {
      console.error('fetchReasons failed:', e)
    }
  },

  setViewMode(mode) {
    set({ viewMode: mode })
  },
}))
