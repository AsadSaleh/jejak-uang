import { useEffect } from 'react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onClose: () => void
  duration?: number
}

// A single self-dismissing toast pill with an Undo action. Positioning and
// stacking are owned by ToastProvider.
export function UndoToast({
  message,
  onUndo,
  onClose,
  duration = 6000,
}: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex items-center gap-4 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
      <span>{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="font-semibold text-sky-300 hover:text-sky-200"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="text-slate-400 dark:text-slate-500 hover:text-white"
      >
        ✕
      </button>
    </div>
  )
}
