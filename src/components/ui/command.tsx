import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100',
        className,
      )}
      {...props}
    />
  )
}

export function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-700"
    >
      <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-500',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn('max-h-64 overflow-y-auto overflow-x-hidden p-1', className)}
      {...props}
    />
  )
}

export function CommandEmpty(
  props: React.ComponentProps<typeof CommandPrimitive.Empty>,
) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm text-slate-400 dark:text-slate-500"
      {...props}
    />
  )
}

export function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn('overflow-hidden p-1 text-slate-900 dark:text-slate-100', className)}
      {...props}
    />
  )
}

export function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-slate-100 dark:data-[selected=true]:bg-slate-800",
        className,
      )}
      {...props}
    />
  )
}
