'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
    }
  }, [open])

  useEffect(() => {
    if (!open && mounted) {
      const timer = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(timer)
    }
  }, [open, mounted])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const dialog = dialogRef.current
    if (dialog) {
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable[0]?.focus()
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-md ${open ? 'dialog-backdrop-enter' : 'dialog-backdrop-exit'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-[10000] ${open ? 'dialog-content-enter' : 'dialog-content-exit'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-desc' : undefined}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 id="confirm-dialog-title" className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-2">{title}</h3>
        {description && (
          <p id="confirm-dialog-desc" className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">{description}</p>
        )}

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 shadow-red-600/30'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 shadow-blue-600/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

