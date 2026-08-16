export default function Notice({ value, onClose }) {
  if (!value) return null
  return (
    <div className={`rounded-2xl p-4 text-sm flex gap-3 ${
      value.type === 'error'
        ? 'bg-red-50 text-red-700'
        : 'bg-emerald-50 text-emerald-700'
    }`}>
      <span className="flex-1 whitespace-pre-wrap">{value.text}</span>
      {onClose && <button type="button" onClick={onClose} aria-label="ปิด">×</button>}
    </div>
  )
}

export function ErrorNotice({ children }) {
  return (
    <div className="flex gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      {children}
    </div>
  )
}

export function Toast({ value, onClose }) {
  if (!value) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full bg-gray-900 px-4 py-3 text-sm text-white shadow-xl"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#06C755] text-xs font-bold">✓</span>
        <span className="flex-1">{value.text}</span>
        {onClose && <button type="button" onClick={onClose} aria-label="ปิด">×</button>}
      </div>
    </div>
  )
}
