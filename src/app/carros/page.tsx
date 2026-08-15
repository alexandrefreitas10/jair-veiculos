import { permanentRedirect } from 'next/navigation'

// A vitrine é a home, como no handoff. Este endereço existia antes e pode ter
// sido compartilhado, então continua funcionando — mas redireciona, para não
// haver dois endereços servindo o mesmo conteúdo (o Google trata isso como
// conteúdo duplicado e escolhe um dos dois por conta própria).
export default async function CarrosRedireciona({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const p = await searchParams
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(p)) {
    const v = Array.isArray(valor) ? valor[0] : valor
    if (v) busca.set(chave, v)
  }
  const query = busca.toString()
  permanentRedirect(query ? `/?${query}` : '/')
}
