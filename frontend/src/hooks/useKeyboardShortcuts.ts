import { useEffect } from 'react'
import { useAnnotationStore } from '../stores/annotationStore'
import { useUIStore } from '../stores/uiStore'
import { useSessionStore } from '../stores/sessionStore'

/**
 * Keyboard shortcuts for annotation workflow.
 * Uses getState() to read store values at event time,
 * avoiding subscriptions that cause unnecessary re-renders.
 */
export function useKeyboardShortcuts() {
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
      // Read store values at event time — no subscription needed
      const annStore = useAnnotationStore.getState()
      const uiStore = useUIStore.getState()
      const sessionStore = useSessionStore.getState()

      if (key === 'y') {
        e.preventDefault()
        annStore.setResult('是')
      } else if (key === 'n') {
        e.preventDefault()
        annStore.setResult('否')
      } else if (key === 'enter') {
        e.preventDefault()
        annStore.confirmAndNext().then(() => {
          if (annStore.sessionId) sessionStore.fetchProgress(annStore.sessionId)
        })
      } else if (key === 's') {
        e.preventDefault()
        annStore.skipItem().then(() => {
          if (annStore.sessionId) sessionStore.fetchProgress(annStore.sessionId)
        })
      } else if (key === 'f') {
        e.preventDefault()
        annStore.flagItem()
      } else if (key === 'arrowleft' || key === 'k') {
        e.preventDefault()
        annStore.navigatePrev()
      } else if (key === 'arrowright' || key === 'j') {
        e.preventDefault()
        annStore.navigateNext()
      } else if (key === '?' || key === '/') {
        e.preventDefault()
        uiStore.toggleShortcutHints()
      } else if (key === 'escape') {
        e.preventDefault()
        annStore.clearDraft()
      } else if (key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        annStore.undoLast()
      } else if (/^[1-9]$/.test(key)) {
        e.preventDefault()
        const idx = parseInt(key) - 1
        const reasons = uiStore.reasons
        if (idx < reasons.length) {
          annStore.setReason(reasons[idx].value)
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, []) // Empty deps — handler is stable, reads state at event time
}
