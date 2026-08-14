import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/config-site'
import { slugsPublicados } from '@/lib/vitrine'

// Só o que está no ar entra. Rascunho no sitemap seria entregar ao Google um
// carro que o Jair ainda está montando — e depois um 404 quando ele desistir.
//
// Dinâmico pelo mesmo motivo da home: gerado no build, o sitemap listaria para
// sempre os carros que existiam no dia do deploy.
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const anuncios = await slugsPublicados()

  return [
    { url: SITE.url, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE.url}/carros`, changeFrequency: 'daily', priority: 0.9 },
    ...anuncios.map((a) => ({
      url: `${SITE.url}/carros/${a.slug}`,
      lastModified: a.atualizadoEm,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
