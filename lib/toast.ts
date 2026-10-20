export type ToastOptions = { type?: 'success' | 'error' | 'info', duration?: number }
type ToastListener = (_message: string, _options?: ToastOptions) => void

let listeners: ToastListener[] = []

export const subscribeToast = (l: ToastListener) => { 
  listeners.push(l); 
  return () => { listeners = listeners.filter(x => x !== l) } 
}

export const toast = (message: string, options?: ToastOptions) => listeners.forEach(l => l(message, options))
toast.success = (msg: string) => toast(msg, { type: 'success' })
toast.error = (msg: string) => toast(msg, { type: 'error' })
toast.info = (msg: string) => toast(msg, { type: 'info' })
