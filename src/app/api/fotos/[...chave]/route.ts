import { armazenamento, chaveSegura } from '@/lib/armazenamento'

// Serve as fotos quando o armazenamento é o disco local (desenvolvimento).
//
// Em produção com R2 esta rota nem é usada: a URL pública aponta direto pro
// domínio do bucket, sem passar pelo servidor do app.
//
// A chave chega pela URL, então é dado de fora e é tratada como tal: só passa
// o formato que `adicionarFoto` gera. Sem essa checagem, um pedido a
// `/api/fotos/../../.env.local` entregaria as credenciais do banco pra quem
// pedisse.

// O 404 leva `no-store` de propósito.
//
// Sem isso o navegador guarda o "não encontrado" por heurística — ele faz isso
// com respostas sem cabeçalho de cache. E aí a foto conserta no servidor e
// continua quebrada na tela de quem viu o erro, às vezes por dias. O sintoma é
// um anúncio sem imagem que "só acontece com um cliente", impossível de
// reproduzir de outra máquina.
//
// Uma ausência é sempre temporária: ou o arquivo ainda vai subir, ou a chave
// está errada e será corrigida. Nenhum dos dois casos merece cache.
const NAO_ENCONTRADO = () =>
  new Response('Não encontrado', { status: 404, headers: { 'Cache-Control': 'no-store' } })

export async function GET(_pedido: Request, { params }: { params: Promise<{ chave: string[] }> }) {
  const { chave: partes } = await params
  const chave = partes.join('/')

  if (!chaveSegura(chave)) return NAO_ENCONTRADO()

  try {
    const dados = await armazenamento().ler(chave)
    return new Response(new Uint8Array(dados), {
      headers: {
        'Content-Type': 'image/webp',
        // A chave muda quando a foto muda, então o arquivo em si é imutável.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NAO_ENCONTRADO()
  }
}
