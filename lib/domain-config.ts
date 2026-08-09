export const MAIN_SITE = 'https://www.aerojet-aviation.com'

export function getCareersUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://careers.aerojet-aviation.com'
}

export const CAREERS_INTERNAL_LINKS = [
  { name: 'Jobs', href: '/jobs' },
  { name: 'Graduate Program', href: '/graduate-program' },
  { name: 'Skilled Training', href: '/skilled-training' },
  { name: 'Register', href: '/register' },
]
