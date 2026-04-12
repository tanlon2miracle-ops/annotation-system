import { useEffect } from 'react'
import { useAnnotationStore } from '../stores/annotationStore'
import { useUIStore } from '../stores/uiStore'
import { useSessionStore } from '../stores/sessionStore'

export function useKeyboardShortcuts() {
  const store = useAnnotationStore()
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      if (debounceTimer) return
      debounceTimer = setTimeout(() => { debounceTimer = null }, 100)

      const key = e.key.toLowerCase()

      if (key === 'y') {
        e.preventDefault()
        store.setResult('是')
      } else if (key === 'n') {
        e.preventDefault()
        store.setResult('否')
      } else if (key === 'enter') {
        e.preventDefault()
        store.confirmAndNext().then(() => {
          if (store.sessionId) sessionStore.fetchProgress(store.sessionId)
        })
      } else if (key === 's') {
        e.preventDefault()
        store.skipItem().then(() => {
          if (store.sessionId) sessionStore.fetchProgress(store.sessionId)
        })
      } else if (key === 'f') {
        e.preventDefault()
        store.flagItem()
      } else if (key === 'arrowleft' || key === 'k') {
        e.preventDefault()
        store.navigatePrev()
      } else if (key === 'arrowright' || key === 'j') {
        e.preventDefault()
        store.navigateNext()
      } else if (key === '?' || key === '/') {
        e.preventDefault()
        uiStore.toggleShortcutHints()
      } else if (key === 'escape') {
        e.preventDefault()
        store.clearDraft()
      } else if (key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        store.undoLast()
      } else if (/^[1-9]$/.test(key)) {
        e.preventDefault()
        const idx = parseInt(key) - 1
        const reasons = uiStore.reasons
        if (idx < reasons.length) {
          store.setReason(reasons[idx].value)
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [store, uiStore, sessionStore])
}
