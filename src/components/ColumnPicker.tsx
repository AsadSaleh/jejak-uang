import { Columns3 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'

export interface ColumnPickerOption {
  id: string
  label: string
}

interface ColumnPickerProps {
  columns: ColumnPickerOption[]
  visibility: Record<string, boolean>
  onChange: (id: string, visible: boolean) => void
}

// Small popover with a checkbox per toggleable column. Click outside or
// press Esc to dismiss. Built without Radix to avoid an extra dependency.
export function ColumnPicker({ columns, visibility, onChange }: ColumnPickerProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
      >
        <Columns3 className="h-4 w-4" /> {t('columns.button')}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-[180px] rounded-md bg-white p-1 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        >
          {columns.map((col) => (
            <label
              key={col.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={visibility[col.id] ?? true}
                onChange={(e) => onChange(col.id, e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
