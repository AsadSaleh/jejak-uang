import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { categoryLabel } from '../i18n/translations'
import { cn } from '../lib/utils'
import { CategoryBadge } from './CategoryBadge'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

// cmdk value for the "clear / any" option. Kept distinct from any real
// category key so filtering and selection never collide.
const ANY_VALUE = '__any__'

interface CategoryComboboxProps {
  value: string
  onChange: (category: string) => void
  categories: readonly string[]
  id?: string
  className?: string
  /** 'badge' shows the icon badge (entry form / import), 'text' shows the plain
   *  translated label (compact filters). */
  variant?: 'badge' | 'text'
  /** When set, adds a top "clear" option that resets the value to ''. The label
   *  is also shown in the trigger while the value is empty. */
  anyLabel?: string
}

// Searchable category picker: type to filter the predefined list for the
// current entry type. Filtering matches both the raw category key and its
// translated label, so e.g. "food" finds "Makan" in English.
export function CategoryCombobox({
  value,
  onChange,
  categories,
  id,
  className,
  variant = 'badge',
  anyLabel,
}: CategoryComboboxProps) {
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)

  const select = (category: string) => {
    onChange(category)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-slate-200',
            className,
          )}
        >
          {variant === 'badge' && value ? (
            <CategoryBadge category={value} />
          ) : (
            <span className="truncate text-xs">
              {value ? categoryLabel(value, locale) : anyLabel}
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder={t('entryForm.searchCategory')} />
          <CommandList>
            <CommandEmpty>{t('entryForm.noCategory')}</CommandEmpty>
            {anyLabel !== undefined && (
              <CommandItem
                value={ANY_VALUE}
                keywords={[anyLabel]}
                onSelect={() => select('')}
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {anyLabel}
                </span>
                <Check
                  className={cn(
                    'ml-auto h-4 w-4',
                    value === '' ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </CommandItem>
            )}
            {categories.map((c) => (
              <CommandItem
                key={c}
                value={c}
                keywords={[categoryLabel(c, locale)]}
                onSelect={() => select(c)}
              >
                {variant === 'badge' ? (
                  <CategoryBadge category={c} />
                ) : (
                  <span>{categoryLabel(c, locale)}</span>
                )}
                <Check
                  className={cn(
                    'ml-auto h-4 w-4',
                    value === c ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
