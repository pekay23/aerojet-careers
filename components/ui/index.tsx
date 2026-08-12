/**
 * Barrel for shared UI primitives.
 *
 * These re-export the canonical single-file implementations so that
 * `@/components/ui` (used by public pages) and `@/components/ui/StatusPill`
 * (used by admin pages) always resolve to the SAME component. Previously this
 * file held a second, divergent set of inline-styled copies — that duplication
 * has been removed to keep the design system consistent.
 */
export { StatusPill } from './StatusPill'
export { PageHero } from './PageHero'
export { NoticeBanner } from './NoticeBanner'
export { CookieBanner } from './CookieBanner'
export { CookieSettingsButton } from './CookieSettingsButton'
export { FormCard } from './FormCard'
export { EmptyState } from './EmptyState'
export { CTAButtons } from './CTAButtons'
export { Skeleton } from './Skeleton'
export { SkeletonCard } from './SkeletonCard'
