import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 dark:bg-slate-800 dark:text-slate-200',
        success:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        destructive:
          'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        accent:
          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        warning:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        outline:
          'bg-white text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
