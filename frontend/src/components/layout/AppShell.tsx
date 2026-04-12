import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/import', label: '导入' },
  { to: '/export', label: '导出' },
]

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-gray-800 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="bg-blob bg-blob-1" aria-hidden="true" />
      <div className="bg-blob bg-blob-2" aria-hidden="true" />
      <div className="bg-blob bg-blob-3" aria-hidden="true" />

      <nav className="relative z-10 bg-gray-900/80 backdrop-blur-md shrink-0 border-b border-white/10">
        <div className="px-4 flex items-center h-12 gap-2">
          <span className="text-white font-bold text-base mr-4 tracking-wide">✦ Annotator</span>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
      <main className="relative z-10 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
