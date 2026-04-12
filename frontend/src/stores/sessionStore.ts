import { create } from 'zustand'
import type { ProgressData, SessionData } from '../types'
import { api } from '../api/client'

interface SessionStore {
  sessions: SessionData[]
  activeSession: SessionData | null
  progress: ProgressData | null

  fetchSessions: () => Promise<void>
  setActiveSession: (s: SessionData) => void
  fetchProgress: (sessionId: number) => Promise<void>
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  activeSession: null,
  progress: null,

  async fetchSessions() {
    try {
      const data = await api.get<SessionData[]>('/sessions')
      set({ sessions: data })
    } catch (e) {
      console.error('fetchSessions failed:', e)
    }
  },

  setActiveSession(s) {
    set({ activeSession: s })
  },

  async fetchProgress(sessionId) {
    try {
      const data = await api.get<ProgressData>(`/sessions/${sessionId}/progress`)
      set({ progress: data })
    } catch (e) {
      console.error('fetchProgress failed:', e)
    }
  },
}))
