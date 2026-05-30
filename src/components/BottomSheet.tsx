import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

// Lightweight bottom sheet: backdrop click + Esc to close, body scroll lock
// preserved via the position:fixed pattern (same as SidePanel) so scroll
// position survives open/close cycles.
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const body = document.body
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex justify-center pb-1 pt-3">
          <span className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        {title && (
          <h2 className="px-6 pb-1 pt-2 text-base font-semibold tracking-tight">
            {title}
          </h2>
        )}
        <div className="px-4 pb-6 pt-2">{children}</div>
      </div>
    </div>
  )
}
