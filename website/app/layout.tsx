import type { Metadata, Viewport } from 'next'
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
    default: site.seoTitle,
    template: `%s | ${site.title}`,
  },
  description: site.description,
  other: { 'build-sha': process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local' },
  alternates: { canonical: '/' },
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: site.seoTitle,
    description: site.description,
    url: site.origin,
    siteName: site.title,
    images: [
      {
        url: '/og.svg',
        width: 1200,
        height: 630,
        alt: 'Composer positioned within a layout viewport and visual viewport above keyboard occlusion',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.svg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
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
              <Link href="/">Overview</Link>
              <Link href="/examples">Examples</Link>
              <Link href="/lab">Device Lab</Link>
              <Link href="/concepts">Concepts</Link>
              <Link href="/api">API</Link>
              <Link href="/browser-behavior">Browser behavior</Link>
              <Link href="/project">Project</Link>
              <Link href="/imprint">Imprint</Link>
              <Link href="/privacy">Privacy</Link>
              <a href={site.repository}>GitHub</a>
              <a href={site.changelog}>Changelog</a>
              <a href={site.security}>Security</a>
              <a href={site.license}>License</a>
            </nav>
            <p>
              Part of <a href={site.openSource}>NIPE Open Source</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
