/** @type {import('next').NextConfig} */
const nextConfig = {
  // All pages are served at their natural App Router paths.
  // No rewrites needed - /jobs, /apply/[slug], /register, etc.
  // live at their own directories in /app.
  allowedDevOrigins: ['192.168.8.202'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
