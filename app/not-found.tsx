import Link from 'next/link'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <div className="min-h-[70vh] bg-white flex items-center justify-center p-8 font-medium">
        <div className="max-w-xl w-full text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 bg-blue-600/10 rounded-full animate-ping" />
            <div className="relative w-full h-full bg-slate-900 rounded-full flex items-center justify-center shadow-xl shadow-blue-900/20 text-white">
              <span className="text-2xl font-bold">!</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em]">Error 404 — Signal Lost</div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 uppercase tracking-tighter leading-none">
              Page Not Found
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
              We couldn't find the page you were looking for. It may have been moved or the link might be broken.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/" 
              className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-black/10 hover:-translate-y-1"
            >
              Go Home →
            </Link>
            <Link 
              href="/jobs" 
              className="w-full sm:w-auto px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all"
            >
              View Jobs
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
