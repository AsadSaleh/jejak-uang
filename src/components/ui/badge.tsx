import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        success: 'bg-emerald-100 text-emerald-700',
        destructive: 'bg-rose-100 text-rose-700',
        info: 'bg-sky-100 text-sky-700',
        accent: 'bg-indigo-100 text-indigo-700',
        warning: 'bg-amber-100 text-amber-700',
        outline: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200',
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
