'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from './select-primitives'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * Radix forbids `<Select.Item value="">`, so the two "empty" states need
 * internal stand-ins:
 *
 * - `EMPTY_VALUE` carries a caller-supplied empty option ("All Departments").
 *   It is a real choice, so it stays selectable and gets the selected
 *   treatment.
 * - `CLEAR_VALUE` is the placeholder row ("Select…"). It is not a choice, so
 *   it is never the selected value - it only exists so the field can be
 *   cleared again after a pick.
 */
const EMPTY_VALUE = '__aerojet_empty_option__'
const CLEAR_VALUE = '__aerojet_clear_option__'

export interface SelectProps {
  /** Selected value. `''` (or `undefined`) means "nothing selected". */
  value?: string
  /** Fired with the new value whenever the user picks an option. */
  onChange?: (_value: string) => void
  /** Alias of `onChange`. Both are called when both are given. */
  onValueChange?: (_value: string) => void
  options: readonly (string | SelectOption)[]
  /** Shown in the trigger while nothing is selected. */
  placeholder?: string
  /**
   * Adds a leading "clear" row so the field can be reset to empty. Off by
   * default: a control that already offers an "All …" option of its own does
   * not need a second, redundant row.
   */
  clearable?: boolean
  name?: string
  id?: string
  disabled?: boolean
  /** Marks the control required for assistive tech. Never a native `required`. */
  required?: boolean
  /** Puts the control into its error state. */
  invalid?: boolean
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  /** Extra classes for the trigger. */
  className?: string
  /** Extra classes for the dropdown panel, e.g. to match the row text size. */
  contentClassName?: string
  style?: React.CSSProperties
  /** Fired when the user leaves the control. */
  onBlur?: () => void
  /** Fired when the dropdown opens or closes. */
  onOpenChange?: (_open: boolean) => void
}

type Item = SelectOption & { isPlaceholder?: boolean }

function normalize(o: string | SelectOption): SelectOption {
  return typeof o === 'string' ? { value: o, label: o } : o
}

/**
 * The single select used across the public site and the admin dashboard.
 *
 * It is a Radix Select (not a native `<select>`) so the dropdown looks the
 * same on every platform and every browser, and so it can be styled to match
 * the Aerojet design system.
 *
 * Two things it does that the raw Radix primitives do not:
 *
 * 1. **The trigger's text is a pure function of props.** Radix delivers the
 *    selected label by portalling it out of the closed-until-open content, so
 *    the server would render an empty value span and the client would fill it
 *    in - a hydration mismatch. We render the label ourselves from `options`,
 *    so the server and the client always agree.
 *
 * 2. **`required` becomes `aria-required`, not the native attribute.** Radix
 *    copies `required` onto its visually hidden bubble `<select>`. The browser
 *    then tries to focus an `aria-hidden`, visually hidden control when the
 *    form is validated and Chrome refuses ("An invalid form control with
 *    name='...' is not focusable") - a silent submit block. The form's own
 *    validation remains the enforcement mechanism.
 */
export function Select({
  value,
  onChange,
  onValueChange,
  options,
  placeholder = 'Select…',
  clearable,
  name,
  id,
  disabled,
  required,
  invalid,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  className,
  contentClassName,
  style,
  onBlur,
  onOpenChange,
}: SelectProps) {
  const items = React.useMemo<Item[]>(() => {
    const normalised = options.map(normalize)
    const empty = normalised.find(o => o.value === '')
    const rest = normalised.filter(o => o.value !== '')
    // A caller-supplied empty option ("All Departments") is a real choice and
    // becomes the clear row. Otherwise a clear row is only added when the
    // caller asked for one.
    if (empty) return [{ ...empty, value: EMPTY_VALUE }, ...rest]
    if (clearable) return [{ value: CLEAR_VALUE, label: placeholder, isPlaceholder: true }, ...rest]
    return rest
  }, [options, placeholder, clearable])

  const hasEmptyOption = items.some(item => item.value === EMPTY_VALUE)
  const current = value ?? ''
  // An empty value means "nothing selected" unless the caller supplied an
  // empty option of its own ("All Departments"), which is a real choice.
  const internalValue = current === '' ? (hasEmptyOption ? EMPTY_VALUE : '') : current
  const matched = items.find(item => item.value === internalValue)

  // An unknown value falls back to Radix's placeholder mode, so the trigger
  // never shows an empty box.
  const radixValue = matched ? matched.value : ''
  const selectedLabel = matched?.label

  const handleValueChange = React.useCallback(
    (next: string) => {
      const resolved = next === EMPTY_VALUE || next === CLEAR_VALUE ? '' : next
      onChange?.(resolved)
      onValueChange?.(resolved)
    },
    [onChange, onValueChange]
  )

  // The trigger's `onBlur` also fires when the popup opens, because Radix
  // moves DOM focus into the portalled listbox. Suppress that one and report
  // "the user is done with this field" when the popup closes instead.
  const openRef = React.useRef(false)
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      openRef.current = open
      onOpenChange?.(open)
      if (!open) onBlur?.()
    },
    [onOpenChange, onBlur]
  )
  const handleBlur = React.useCallback(() => {
    if (!openRef.current) onBlur?.()
  }, [onBlur])

  return (
    <SelectRoot
      value={radixValue}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger
        id={id}
        className={cn('w-full', className)}
        style={style}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        onBlur={handleBlur}
      >
        <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {items.map(item => (
          <SelectItem
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            // The placeholder row is not a "choice", so it never carries the
            // check mark. It keeps the option indent so its text lines up
            // with the rest of the list.
            className={item.isPlaceholder ? '[&>span:first-child]:hidden' : undefined}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}

export default Select
