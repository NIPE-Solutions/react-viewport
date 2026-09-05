import type { Metadata } from 'next'
import { Barlow, IBM_Plex_Mono } from 'next/font/google'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { SiteHeader } from '../components/SiteHeader'
import { site } from '../content/docs'

import './globals.css'

const textFont = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-text',
  display: 'swap',
})

const dataFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-data',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  title: {
    default: `${site.title} — measured geometry for React`,
    template: `%s | ${site.title}`,
  },
  description: site.description,
  alternates: { canonical: '/' },
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: `${site.title} — measured geometry for React`,
    description: site.description,
    url: site.origin,
    siteName: site.title,
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Nested viewport coordinate plane' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.svg'],
  },
}

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" className={`${textFont.variable} ${dataFont.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div className="site-frame site-footer__inner">
            <div>
              <strong>React Viewport</strong>
              <p>Focused geometry for interface behavior that CSS cannot express alone.</p>
            </div>
            <nav aria-label="Footer navigation">
              <Link href="/api">API</Link>
              <Link href="/browser-behavior">Browser behavior</Link>
              <Link href="/examples">Examples</Link>
              <Link href="/imprint">Imprint</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
            <p>
              <a href={site.openSource} rel="noreferrer">
                Part of NIPE Open Source
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
