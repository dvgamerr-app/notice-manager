import { useNavigate } from 'react-router-dom'

export default function Layout({ title, back, action, children }) {
  const nav = useNavigate()
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      {/* Header — LINE green, sticky */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-[#06C755] px-4 text-white shadow-md">
        {back && (
          <button
            onClick={() => nav(-1)}
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full active:bg-white/20"
            aria-label="ย้อนกลับ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="flex-1 text-lg font-bold truncate">{title}</h1>
        {action}
      </header>

      {/* Content */}
      <main className="flex-1 p-4 space-y-3 safe-bottom">
        {children}
      </main>
    </div>
  )
}
