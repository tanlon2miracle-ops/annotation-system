import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAnnotationStore } from '../stores/annotationStore'
import { useSessionStore } from '../stores/sessionStore'
import { useUIStore } from '../stores/uiStore'
import { api } from '../api/client'
import type { AnnotationMode, SessionData } from '../types'
import { ItemList } from '../components/workspace/ItemList'
import { ItemViewer } from '../components/workspace/ItemViewer'
import { AnnotationPanel } from '../components/workspace/AnnotationPanel'
import { CardGridView } from '../components/workspace/CardGridView'
import { ProgressBar } from '../components/workspace/ProgressBar'
import { ShortcutHints } from '../components/workspace/ShortcutHints'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

const MODE_LABELS: Record<AnnotationMode, string> = {
  review_correct: '审核修正',
  independent: '独立标注',
  arbitration: '投票仲裁',
}

const MODE_COLORS: Record<AnnotationMode, string> = {
  review_correct: 'bg-blue-500',
  independent: 'bg-green-500',
  arbitration: 'bg-amber-500',
}

export function WorkspacePage() {
  const { sessionId } = useParams<{ sessionId: string }>()

  // Granular selectors — each component only re-renders when its slice changes
  const mode = useAnnotationStore(s => s.mode)
  const setSession = useAnnotationStore(s => s.setSession)
  const loadItems = useAnnotationStore(s => s.loadItems)
  const setActiveSession = useSessionStore(s => s.setActiveSession)
  const fetchProgress = useSessionStore(s => s.fetchProgress)
  const fetchReasons = useUIStore(s => s.fetchReasons)
  const viewMode = useUIStore(s => s.viewMode)
  const setViewMode = useUIStore(s => s.setViewMode)
  const showShortcutHints = useUIStore(s => s.showShortcutHints)

  useKeyboardShortcuts()

  useEffect(() => {
    if (!sessionId) return
    const id = Number(sessionId)

    async function init() {
      const sess = await api.get<SessionData>(`/sessions/${id}`)
      setSession(id, sess.mode)
      setActiveSession(sess)
      await Promise.all([
        loadItems(1),
        fetchProgress(id),
        fetchReasons(),
      ])
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const isGrid = viewMode === 'grid'

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      <div className="flex items-center px-4 h-10 glass rounded-xl shrink-0">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${MODE_COLORS[mode]}`} />
        <span className="text-sm font-medium text-gray-700">
          {MODE_LABELS[mode]}
        </span>

        <div className="ml-4 flex items-center bg-gray-100 rounded-md p-0.5">
          <button
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              !isGrid ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setViewMode('single')}
          >
            单条
          </button>
          <button
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              isGrid ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setViewMode('grid')}
          >
            多条
          </button>
        </div>

        <span className="ml-auto text-xs text-gray-400">
          Session #{sessionId}
        </span>
      </div>

      {isGrid ? (
        <CardGridView />
      ) : (
        <div className="flex-1 grid grid-cols-[280px_1fr_320px] overflow-hidden gap-2">
          <ItemList />
          <ItemViewer />
          <AnnotationPanel />
        </div>
      )}

      <div className="shrink-0 glass rounded-xl">
        <ProgressBar />
        {showShortcutHints && !isGrid && <ShortcutHints />}
      </div>
    </div>
  )
}
