import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Repeat,
  type LucideIcon,
} from 'lucide-react'
import type { EntryType } from '../dal/types'
import { ENTRY_TYPE_LABELS } from '../dal/types'
import { Badge, type BadgeProps } from './ui/badge'

const TYPE_META: Record<
  EntryType,
  { variant: NonNullable<BadgeProps['variant']>; icon: LucideIcon }
> = {
  income: { variant: 'success', icon: ArrowDownLeft },
  expense: { variant: 'destructive', icon: ArrowUpRight },
  transfer_internal: { variant: 'accent', icon: ArrowLeftRight },
  transfer_external: { variant: 'info', icon: Repeat },
}

interface TypeBadgeProps {
  type: EntryType
  showLabel?: boolean
  className?: string
}

export function TypeBadge({
  type,
  showLabel = true,
  className,
}: TypeBadgeProps) {
  const { variant, icon: Icon } = TYPE_META[type]
  return (
    <Badge variant={variant} className={className}>
      <Icon className="h-3.5 w-3.5" />
      {showLabel && ENTRY_TYPE_LABELS[type]}
    </Badge>
  )
}
