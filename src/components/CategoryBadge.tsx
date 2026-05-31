import {
  ArrowLeftRight,
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  Droplet,
  Film,
  Gift,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Plug,
  Repeat,
  ShoppingBag,
  Sparkles,
  ShoppingCart,
  Smartphone,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { categoryLabel } from '../i18n/translations'
import { Badge } from './ui/badge'

// Maps category names (case-insensitive) to a lucide icon. Includes both the
// current Indonesian labels and legacy English labels so older rows still
// render properly until the storage migration translates them on read.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Indonesian — expense
  makan: Utensils,
  kopi: Coffee, // legacy label, retained for in-flight rows pre-migration
  'kopi & teh': Coffee,
  'belanja harian': ShoppingCart,
  transportasi: Car,
  'tempat tinggal': Home,
  listrik: Zap,
  pulsa: Smartphone,
  internet: Wifi,
  air: Droplet,
  hiburan: Film,
  kesehatan: HeartPulse,
  kecantikan: Sparkles,
  belanja: ShoppingBag,
  pendidikan: BookOpen,
  'top-up': Wallet,
  'bank admin': Landmark,
  // Indonesian — income
  gaji: Briefcase,
  bonus: Banknote,
  investasi: TrendingUp,
  hadiah: Gift,
  // Indonesian — transfer
  'antar kantong': ArrowLeftRight,
  tabungan: PiggyBank,
  'rekening sendiri': Repeat,
  // Indonesian — generic
  lainnya: MoreHorizontal,
  // Legacy English fallback
  food: Utensils,
  groceries: ShoppingCart,
  transport: Car,
  housing: Home,
  utilities: Plug,
  entertainment: Film,
  health: HeartPulse,
  shopping: ShoppingBag,
  education: BookOpen,
  salary: Wallet,
  investment: TrendingUp,
  gift: Gift,
  'pocket transfer': ArrowLeftRight,
  savings: PiggyBank,
  'own account': Repeat,
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
  const { locale } = useI18n()
  const Icon = iconFor(category)
  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
      {categoryLabel(category, locale)}
    </Badge>
  )
}
