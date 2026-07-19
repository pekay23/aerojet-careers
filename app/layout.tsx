import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Careers — Aerojet Aviation',
    template: '%s | Aerojet Aviation Careers',
  },
  description: 'Join the team building West Africa\'s premier MRO facility at Kotoka International Airport, Accra, Ghana.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://careers.aerojet-aviation.com'),
  icons: {
    apple: '/favicon/apple-touch-icon.png',
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <head>
        {/* Fonts: Montserrat (display), Inter (sans), Outfit (alt) - matching main site */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}