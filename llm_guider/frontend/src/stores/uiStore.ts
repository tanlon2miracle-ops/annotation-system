import { create } from 'zustand'
import { api } from '../api/client'
import type { ModelData, PlaygroundResponse } from '../types'

interface UIStore {
  selectedModel: ModelData | null
  drawerTab: 'schema' | 'playground'
  playgroundInput: string
  playgroundResult: PlaygroundResponse | null
  isSimulating: boolean

  openDrawer: (model: ModelData) => void
  closeDrawer: () => void
  setDrawerTab: (tab: 'schema' | 'playground') => void
  setPlaygroundInput: (val: string) => void
  runPlayground: () => Promise<void>
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedModel: null,
  drawerTab: 'schema',
  playgroundInput: '',
  playgroundResult: null,
  isSimulating: false,

  openDrawer(model: ModelData) {
    set({
      selectedModel: model,
      drawerTab: 'schema',
      playgroundInput: JSON.stringify(model.input_schema, null, 2),
      playgroundResult: null,
    })
  },

  closeDrawer() {
    set({ selectedModel: null, playgroundResult: null })
  },

  setDrawerTab(tab) {
    set({ drawerTab: tab })
  },

  setPlaygroundInput(val) {
    set({ playgroundInput: val })
  },

  async runPlayground() {
    const { selectedModel, playgroundInput } = get()
    if (!selectedModel) return
    set({ isSimulating: true, playgroundResult: null })
    try {
      let input: Record<string, unknown>
      try {
        input = JSON.parse(playgroundInput)
      } catch {
        input = {}
      }
      const res = await api.post<PlaygroundResponse>('/playground/invoke', {
        model_id: selectedModel.model_id,
        input,
      })
      set({ playgroundResult: res })
    } catch (e) {
      console.error('playground invoke failed:', e)
    } finally {
      set({ isSimulating: false })
    }
  },
}))
