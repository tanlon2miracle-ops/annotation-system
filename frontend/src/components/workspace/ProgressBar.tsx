import { useSessionStore } from '../../stores/sessionStore'

export function ProgressBar() {
  const { progress } = useSessionStore()

  if (!progress) return null

  return (
    <div className="px-4 py-2 flex items-center gap-3">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-green-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">
        {progress.annotated + progress.skipped} / {progress.total}
        ({progress.percent}%)
      </span>
      {progress.flagged > 0 && (
        <span className="text-xs text-red-500">{progress.flagged} flagged</span>
      )}
    </div>
  )
}
