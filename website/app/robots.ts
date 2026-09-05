import type { MetadataRoute } from 'next'

import { site } from '../content/docs'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${site.origin}/sitemap.xml`,
  }
}
