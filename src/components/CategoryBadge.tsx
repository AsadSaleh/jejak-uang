import {
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  Car,
  Film,
  Gift,
  HeartPulse,
  Home,
  MoreHorizontal,
  PiggyBank,
  Plug,
  Repeat,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from './ui/badge'

// Maps known category names (case-insensitive) to a lucide icon. Unknown
// categories fall back to a generic Tag icon so the badge always renders.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // expense
  food: Utensils,
  transport: Car,
  housing: Home,
  utilities: Plug,
  entertainment: Film,
  health: HeartPulse,
  shopping: ShoppingBag,
  education: BookOpen,
  // income
  salary: Wallet,
  bonus: Briefcase,
  investment: TrendingUp,
  gift: Gift,
  // transfer
  'pocket transfer': ArrowLeftRight,
  savings: PiggyBank,
  'own account': Repeat,
  // generic
  other: MoreHorizontal,
}

function iconFor(category: string): LucideIcon {
  return CATEGORY_ICONS[category.trim().toLowerCase()] ?? Tag
}

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const Icon = iconFor(category)
  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      {category}
    </Badge>
  )
}
