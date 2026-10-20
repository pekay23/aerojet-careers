/** @type {import('next').NextConfig} */
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ")

const nextConfig = {
  // All pages are served at their natural App Router paths.
  // No rewrites needed - /jobs, /apply/[slug], /register, etc.
  // live at their own directories in /app.
  allowedDevOrigins: ['192.168.8.202'],
  output: 'standalone',

  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 85],
    minimumCacheTTL: 14400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production'
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'"

    // Base headers applied to ALL routes. Specific routes listed AFTER this
    // block override matching keys (Next.js: last value for a key wins).
    const globalHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection',       value: '1; mode=block' },
      { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',     value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
      { key: 'X-Download-Options',     value: 'noopen' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
    ]

    // CSP only applied in production to avoid dev-mode Turbopack noise
    if (!isDev) {
      globalHeaders.push({ key: 'Content-Security-Policy', value: cspHeader })
    }

    // Admin-specific headers — listed LAST so they override the global block
    // for matching keys (X-Frame-Options DENY, admin CSP, etc.).
    const adminHeaders = [
      { key: 'X-Frame-Options',        value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection',       value: '1; mode=block' },
      { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',     value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Download-Options',     value: 'noopen' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          scriptSrc,
          "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' https://fonts.gstatic.com",
          "connect-src 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join(';'),
      },
    ]

    return [
      {
        source: '/:path*',
        headers: globalHeaders,
      },
      {
        source: '/admin/:path*',
        headers: adminHeaders,
      },
    ]
  },
}

module.exports = nextConfig