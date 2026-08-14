import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/config-site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // O painel e o login não têm nada que interesse a buscador, e indexá-los
      // só convida robô a bater na tela de senha.
      disallow: ['/admin', '/admin/', '/login', '/api/'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
