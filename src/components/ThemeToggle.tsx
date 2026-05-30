import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type Theme } from './ThemeProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'

const ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICONS[theme]
  return (
    <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
      <SelectTrigger
        aria-label="Change theme"
        className="h-8 w-auto gap-1 border-0 bg-transparent px-2 py-1 shadow-none ring-0 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2 dark:hover:bg-slate-800"
      >
        <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      </SelectTrigger>
      <SelectContent align="end">
        {OPTIONS.map(({ value, label, icon: ItemIcon }) => (
          <SelectItem key={value} value={value}>
            <ItemIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
