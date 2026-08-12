import { Skeleton } from './Skeleton'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
  lines?: number
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={cn('card', className)} style={{ padding: '1.5rem' }}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div className="flex-1">
          <Skeleton style={{ width: '60%', height: 14, marginBottom: 8 }} />
          <Skeleton style={{ width: '40%', height: 10 }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            style={{
              width: i === lines - 1 ? '80%' : '100%',
              height: 12,
            }}
          />
        ))}
      </div>
    </div>
  )
}
