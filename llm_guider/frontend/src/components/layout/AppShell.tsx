import { NavLink } from 'react-router-dom'
import { Layers } from 'lucide-react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-indigo-600'}`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
      <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Nexus<span className="font-normal text-slate-500">Registry</span>
            </span>
          </NavLink>
          <div className="flex items-center gap-6 text-sm font-medium">
            <NavLink to="/" className={linkClass}>模型目录</NavLink>
            <NavLink to="/smart" className={linkClass}>AI 路由</NavLink>
            <NavLink to="/routing" className={linkClass}>规则路由</NavLink>
            <NavLink to="/logs" className={linkClass}>路由日志</NavLink>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
