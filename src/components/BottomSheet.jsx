import { useEffect } from 'react'

export default function BottomSheet({ open, title, onClose, children, footer = null, action = null }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/35" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto flex max-h-[86%] w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-xl"
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-gray-200" />
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-2">
          <h3 className="font-bold">{title}</h3>
          {action || (
            <button type="button" onClick={onClose} className="text-sm text-gray-500">
              ปิด
            </button>
          )}
        </div>
        <div className="space-y-4 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && (
          <div className="safe-bottom flex shrink-0 gap-2 border-t border-gray-100 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
