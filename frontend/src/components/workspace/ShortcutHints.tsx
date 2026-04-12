const SHORTCUTS = [
  { key: 'Y/N', desc: '判断' },
  { key: '1-9', desc: '选 Reason' },
  { key: 'Enter', desc: '确认&下一条' },
  { key: 'S', desc: '跳过' },
  { key: 'F', desc: '标记' },
  { key: '←/→', desc: '导航' },
  { key: 'Ctrl+Z', desc: '撤销' },
  { key: '?', desc: '帮助' },
]

export function ShortcutHints() {
  return (
    <div className="px-4 py-1.5 flex items-center gap-4 border-t border-gray-100 bg-gray-50">
      {SHORTCUTS.map((s) => (
        <span key={s.key} className="text-xs text-gray-400 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono text-gray-600">
            {s.key}
          </kbd>
          {s.desc}
        </span>
      ))}
    </div>
  )
}
