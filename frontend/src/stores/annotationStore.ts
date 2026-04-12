import { create } from 'zustand'
import type { AnnotationData, AnnotationMode, ItemData } from '../types'
import { api } from '../api/client'

export interface AnnotationStore {
  sessionId: number | null
  mode: AnnotationMode
  items: ItemData[]
  totalItems: number
  currentIndex: number
  currentPage: number
  pageSize: number

  draftResult: string | null
  draftReason: string | null
  draftNotes: string

  setSession: (id: number, mode: AnnotationMode) => void
  loadItems: (page?: number) => Promise<void>
  setCurrentIndex: (idx: number) => void
  navigateNext: () => void
  navigatePrev: () => void
  setResult: (val: string) => void
  setReason: (val: string | null) => void
  setNotes: (val: string) => void
  clearDraft: () => void
  loadDraftFromAnnotation: (ann: AnnotationData | null) => void

  confirmAndNext: () => Promise<void>
  skipItem: () => Promise<void>
  flagItem: () => Promise<void>
  undoLast: () => Promise<void>

  batchMode: boolean
  selectedIds: Set<number>
  toggleBatchMode: () => void
  toggleSelect: (itemId: number) => void
  selectAll: () => void
  deselectAll: () => void
  batchAnnotate: (result: string, reason: string | null) => Promise<void>
  batchSkip: () => Promise<void>

  _lastAnnotatedItemId: number | null
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  sessionId: null,
  mode: 'review_correct',
  items: [],
  totalItems: 0,
  currentIndex: 0,
  currentPage: 1,
  pageSize: 100,

  draftResult: null,
  draftReason: null,
  draftNotes: '',
  _lastAnnotatedItemId: null,
  batchMode: false,
  selectedIds: new Set<number>(),

  setSession(id, mode) {
    set({ sessionId: id, mode, items: [], currentIndex: 0, currentPage: 1 })
  },

  async loadItems(page) {
    const { sessionId, pageSize } = get()
    if (!sessionId) return
    const p = page ?? get().currentPage
    try {
      const data = await api.get<{ items: ItemData[]; total: number }>(
        `/sessions/${sessionId}/items?page=${p}&page_size=${pageSize}`
      )
      set({ items: data.items, totalItems: data.total, currentPage: p, currentIndex: 0 })
      const item = data.items[0]
      if (item) get().loadDraftFromAnnotation(item.annotation)
    } catch (e) {
      console.error('loadItems failed:', e)
    }
  },

  setCurrentIndex(idx) {
    const { items } = get()
    if (idx < 0 || idx >= items.length) return
    set({ currentIndex: idx })
    const item = items[idx]
    if (item) get().loadDraftFromAnnotation(item.annotation)
  },

  navigateNext() {
    const { currentIndex, items, currentPage, pageSize, totalItems } = get()
    if (currentIndex < items.length - 1) {
      get().setCurrentIndex(currentIndex + 1)
    } else if (currentPage * pageSize < totalItems) {
      get().loadItems(currentPage + 1)
    }
  },

  navigatePrev() {
    const { currentIndex, currentPage } = get()
    if (currentIndex > 0) {
      get().setCurrentIndex(currentIndex - 1)
    } else if (currentPage > 1) {
      get().loadItems(currentPage - 1).then(() => {
        const { items } = get()
        set({ currentIndex: items.length - 1 })
      })
    }
  },

  setResult(val) { set({ draftResult: val }) },
  setReason(val) { set({ draftReason: val }) },
  setNotes(val) { set({ draftNotes: val }) },
  clearDraft() { set({ draftResult: null, draftReason: null, draftNotes: '' }) },

  loadDraftFromAnnotation(ann) {
    if (ann && !ann.is_skipped) {
      set({ draftResult: ann.result, draftReason: ann.reason, draftNotes: ann.notes ?? '' })
    } else {
      const { mode, items, currentIndex } = get()
      const item = items[currentIndex]
      if (mode === 'review_correct' && item) {
        set({ draftResult: item.result, draftReason: item.reason, draftNotes: '' })
      } else {
        set({ draftResult: null, draftReason: null, draftNotes: '' })
      }
    }
  },

  async confirmAndNext() {
    const { sessionId, items, currentIndex, draftResult, draftReason, draftNotes } = get()
    if (!sessionId || !draftResult) return
    const item = items[currentIndex]
    if (!item) return
    try {
      const ann = await api.put<AnnotationData>('/annotations', {
        session_id: sessionId, item_id: item.id,
        result: draftResult, reason: draftReason, notes: draftNotes || null,
      })
      const updated = [...items]
      updated[currentIndex] = { ...item, annotation: ann }
      set({ items: updated, _lastAnnotatedItemId: item.id })
      get().navigateNext()
    } catch (e) {
      console.error('confirmAndNext failed:', e)
    }
  },

  async skipItem() {
    const { sessionId, items, currentIndex } = get()
    if (!sessionId) return
    const item = items[currentIndex]
    if (!item) return
    try {
      const ann = await api.put<AnnotationData>('/annotations', {
        session_id: sessionId, item_id: item.id, is_skipped: true,
      })
      const updated = [...items]
      updated[currentIndex] = { ...item, annotation: ann }
      set({ items: updated })
      get().navigateNext()
    } catch (e) {
      console.error('skipItem failed:', e)
    }
  },

  async flagItem() {
    const { sessionId, items, currentIndex } = get()
    if (!sessionId) return
    const item = items[currentIndex]
    if (!item) return
    try {
      const isFlagged = item.annotation?.is_flagged ?? false
      const ann = await api.put<AnnotationData>('/annotations', {
        session_id: sessionId, item_id: item.id, is_flagged: !isFlagged,
      })
      const updated = [...items]
      updated[currentIndex] = { ...item, annotation: ann }
      set({ items: updated })
    } catch (e) {
      console.error('flagItem failed:', e)
    }
  },

  async undoLast() {
    const { sessionId, _lastAnnotatedItemId } = get()
    if (!sessionId || !_lastAnnotatedItemId) return
    try {
      await api.delete(`/annotations/${sessionId}/${_lastAnnotatedItemId}`)
      set({ _lastAnnotatedItemId: null })
      get().navigatePrev()
    } catch (e) {
      console.error('undoLast failed:', e)
    }
  },

  toggleBatchMode() {
    set({ batchMode: !get().batchMode, selectedIds: new Set() })
  },

  toggleSelect(itemId) {
    const next = new Set(get().selectedIds)
    if (next.has(itemId)) { next.delete(itemId) } else { next.add(itemId) }
    set({ selectedIds: next })
  },

  selectAll() { set({ selectedIds: new Set(get().items.map(i => i.id)) }) },
  deselectAll() { set({ selectedIds: new Set() }) },

  async batchAnnotate(result, reason) {
    const { sessionId, selectedIds, items } = get()
    if (!sessionId || selectedIds.size === 0) return
    try {
      const annotations = Array.from(selectedIds).map(item_id => ({
        session_id: sessionId, item_id, result, reason,
      }))
      const saved = await api.post<AnnotationData[]>('/annotations/batch', {
        session_id: sessionId, annotations,
      })
      const savedMap = new Map(saved.map(a => [a.item_id, a]))
      const updated = items.map(item => {
        const ann = savedMap.get(item.id)
        return ann ? { ...item, annotation: ann } : item
      })
      set({ items: updated, selectedIds: new Set() })
    } catch (e) {
      console.error('batchAnnotate failed:', e)
    }
  },

  async batchSkip() {
    const { sessionId, selectedIds, items } = get()
    if (!sessionId || selectedIds.size === 0) return
    try {
      const annotations = Array.from(selectedIds).map(item_id => ({
        session_id: sessionId, item_id, is_skipped: true,
      }))
      const saved = await api.post<AnnotationData[]>('/annotations/batch', {
        session_id: sessionId, annotations,
      })
      const savedMap = new Map(saved.map(a => [a.item_id, a]))
      const updated = items.map(item => {
        const ann = savedMap.get(item.id)
        return ann ? { ...item, annotation: ann } : item
      })
      set({ items: updated, selectedIds: new Set() })
    } catch (e) {
      console.error('batchSkip failed:', e)
    }
  },
}))

// Selectors
export const selectItems = (s: AnnotationStore) => s.items
export const selectCurrentIndex = (s: AnnotationStore) => s.currentIndex
export const selectMode = (s: AnnotationStore) => s.mode
export const selectDraft = (s: AnnotationStore) => ({ result: s.draftResult, reason: s.draftReason, notes: s.draftNotes })
export const selectBatchState = (s: AnnotationStore) => ({ batchMode: s.batchMode, selectedIds: s.selectedIds })
export const selectSessionId = (s: AnnotationStore) => s.sessionId
export const selectPagination = (s: AnnotationStore) => ({ currentPage: s.currentPage, pageSize: s.pageSize, totalItems: s.totalItems })
