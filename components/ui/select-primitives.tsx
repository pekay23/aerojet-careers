'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Radix Select primitives, themed for this repository.
 *
 * The visual language is taken from the sibling `aerojet-aviation` app
 * (`components/ui/select.tsx`): a white rounded panel with a soft shadow,
 * 44px rows that meet the WCAG 2.5.8 target-size floor, a check mark on the
 * selected row and the selected row filled with the brand navy
 * (`--color-aero-blue` = #003366).
 *
 * The trigger carries STRUCTURE only - border, radius, padding and font come
 * from the caller, so the same primitive can look like a public form field
 * (`.field-input`) or like an admin control (`.admin-input`) without a second
 * implementation. See `components/ui/Select.tsx` for the composed control.
 */

/* -------------------------------------------------------------------------- */
/*  Root                                                                      */
/* -------------------------------------------------------------------------- */

export const SelectRoot = SelectPrimitive.Root

/* -------------------------------------------------------------------------- */
/*  Value                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The trigger's text. It is `flex-1` + `truncate` so a long value can never
 * push the chevron out of the control.
 */
export const SelectValue = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Value
    ref={ref}
    className={cn('min-w-0 flex-1 truncate text-left', className)}
    {...props}
  />
))
SelectValue.displayName = 'SelectValue'

/* -------------------------------------------------------------------------- */
/*  Trigger                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `inline-flex` (not `flex`): a `<button>` is inline-block by default, so the
 * control shrink-to-fits its content exactly like a native `<select>`. A
 * block-level flex container would instead fill its parent, which turns every
 * compact toolbar filter into a full-width control.
 */
export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'group inline-flex items-center justify-between gap-2 text-left font-[inherit] appearance-none cursor-pointer',
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Radix flags the trigger while it shows the placeholder, which is the
      // "nothing selected yet" state.
      'data-[placeholder]:text-[var(--muted-foreground)]',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The panel is portalled to `<body>`, so its stacking context is the root one.
 * Admin modals sit at `z-[100]` .. `z-[1000]` and the confirm dialog at
 * `z-[9999]`, so the panel needs a z-index above all of them - otherwise a
 * dropdown opened inside a modal renders BEHIND the modal overlay.
 */
export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', sideOffset = 4, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      className={cn(
        'relative z-[10001] max-h-72 min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-700',
        'shadow-[0_10px_40px_rgba(0,0,0,0.08)]',
        // The rows decide the panel height - never pin the viewport to the
        // trigger height, or the listbox renders as a one-row scroll window.
        'text-sm',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
        <ChevronUp className="h-4 w-4" aria-hidden="true" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport
        className={cn('p-1', position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]')}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = 'SelectContent'

/* -------------------------------------------------------------------------- */
/*  Item                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 44px rows, matching the touch-target floor. `pl-8` clears the check
 * indicator, which sits at `left-2`.
 *
 * The selected row uses the `!` (important) modifier on purpose: the
 * highlighted row and the selected row can be the same element at the same
 * time, and both set a background. Without `!` the winner would depend on
 * Tailwind's internal variant ordering, which would leave white text on a
 * light highlight background.
 */
export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex min-h-11 w-full cursor-default select-none items-center rounded-sm pl-8 pr-3 outline-none',
      'data-[highlighted]:bg-slate-100',
      'data-[state=checked]:bg-aero-blue! data-[state=checked]:font-medium data-[state=checked]:text-white!',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = 'SelectItem'
