export default function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide ${className}`}>
      {children}
    </span>
  )
}
