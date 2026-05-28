import { createContext, useCallback, useContext, useState } from 'react'
import { UndoToast } from './UndoToast'

export interface ToastInput {
  message: string
  onUndo?: () => void | Promise<void>
  duration?: number
}

interface ToastContextValue {
  addToast: (toast: ToastInput) => void
}

interface ActiveToast extends ToastInput {
  id: string
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: ToastInput) => {
    setToasts((prev) => [...prev, { ...toast, id: makeId() }])
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <UndoToast
              message={t.message}
              duration={t.duration}
              onUndo={() => {
                remove(t.id)
                void t.onUndo?.()
              }}
              onClose={() => remove(t.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
