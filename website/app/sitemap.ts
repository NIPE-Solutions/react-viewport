import type { MetadataRoute } from 'next'

import { site } from '../content/docs'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '',
    '/examples',
    '/concepts',
    '/api',
    '/browser-behavior',
    '/project',
    '/imprint',
    '/privacy',
  ].map((route) => ({
    url: `${site.origin}${route}`,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}
