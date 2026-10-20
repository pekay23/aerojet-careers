export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">
          Loading…
        </p>
      </div>
    </div>
  )
}