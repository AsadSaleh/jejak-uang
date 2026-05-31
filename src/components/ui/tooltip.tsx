import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '../../lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-xs rounded-md bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-50 shadow-md dark:bg-slate-700 dark:text-slate-50',
          'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-slate-900 dark:fill-slate-700" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

// Convenience wrapper: a self-contained tooltip that brings its own provider so
// callers don't have to wire one up. `content` is the bubble text; `children`
// is the trigger element.
export function InfoTooltip({
  content,
  children,
}: {
  content: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
