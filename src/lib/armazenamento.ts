import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'

// Onde as fotos dos carros ficam.
//
// Dois drivers atrás da mesma interface:
//   local — grava em .uploads/ e serve por /api/fotos/… (desenvolvimento)
//   r2    — Cloudflare R2 (produção)
//
// A interface existe por um motivo prático: o projeto foi construído antes de
// existir conta na Cloudflare. Com ela, tudo roda hoje em disco e virar R2 é
// preencher variável de ambiente — nenhuma linha de regra de negócio muda.
//
// R2 foi escolhido no lugar do S3 por causa da banda: site de fotos gasta muita
// saída, e no R2 a saída é gratuita.

export interface Armazenamento {
  salvar(chave: string, dados: Buffer, tipoConteudo: string): Promise<void>
  apagar(chave: string): Promise<void>
  ler(chave: string): Promise<Buffer>
  /** URL que o navegador usa para exibir a foto. */
  urlPublica(chave: string): string
}

// ── Segurança da chave ──────────────────────────────────────────────────────
// A chave chega pela URL na rota /api/fotos/[...chave]. Sem validação, um
// pedido a `../../.env.local` faria o servidor entregar as credenciais do
// banco. A lista é branca: só o formato que este código mesmo gera passa.
const CHAVE_VALIDA = /^[a-z0-9][a-z0-9/_-]*\.(webp|jpg|jpeg|png)$/i

export function chaveSegura(chave: string): boolean {
  if (!CHAVE_VALIDA.test(chave)) return false
  if (chave.includes('..')) return false
  return true
}

// ── Driver local ────────────────────────────────────────────────────────────
//
// A pasta é configurável por ambiente porque a suíte de testes precisa da sua
// própria. Antes ela usava esta mesma, gravava arquivos de verdade e apagava a
// pasta no fim — levando junto as fotos dos carros de desenvolvimento. O banco
// de teste já era separado; o disco não era, e o sintoma aparecia longe da
// causa: a vitrine abria com todos os anúncios sem imagem e 404 no log.
const RAIZ_LOCAL = resolve(process.cwd(), process.env.ARMAZENAMENTO_LOCAL_RAIZ ?? '.uploads')

function caminhoLocal(chave: string): string {
  if (!chaveSegura(chave)) throw new Error(`Chave de arquivo inválida: ${chave}`)
  const destino = resolve(join(RAIZ_LOCAL, chave))
  // Cinto e suspensório: mesmo com a chave validada, confere que o caminho
  // resolvido continua dentro da pasta de uploads.
  if (destino !== RAIZ_LOCAL && !destino.startsWith(RAIZ_LOCAL + sep)) {
    throw new Error('Caminho de arquivo fora da pasta de uploads')
  }
  return destino
}

const armazenamentoLocal: Armazenamento = {
  async salvar(chave, dados) {
    const destino = caminhoLocal(chave)
    await mkdir(dirname(destino), { recursive: true })
    await writeFile(destino, dados)
  },
  async apagar(chave) {
    try {
      await unlink(caminhoLocal(chave))
    } catch (err) {
      // Arquivo já sumiu não é erro: o registro do banco é a fonte da verdade,
      // e falhar aqui deixaria a foto pendurada na tela pra sempre.
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  },
  async ler(chave) {
    return readFile(caminhoLocal(chave))
  },
  urlPublica(chave) {
    return `/api/fotos/${chave}`
  },
}

// ── Driver R2 ───────────────────────────────────────────────────────────────
function criarArmazenamentoR2(): Armazenamento {
  const conta = process.env.R2_ACCOUNT_ID
  const chaveAcesso = process.env.R2_ACCESS_KEY_ID
  const segredo = process.env.R2_SECRET_ACCESS_KEY
  const balde = process.env.R2_BUCKET
  const urlBase = process.env.R2_URL_PUBLICA

  if (!conta || !chaveAcesso || !segredo || !balde || !urlBase) {
    throw new Error(
      'ARMAZENAMENTO=r2 exige R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET e R2_URL_PUBLICA.',
    )
  }

  // Import tardio: quem roda com ARMAZENAMENTO=local não carrega o SDK da AWS.
  const carregarCliente = async () => {
    const { S3Client } = await import('@aws-sdk/client-s3')
    return new S3Client({
      region: 'auto',
      endpoint: `https://${conta}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: chaveAcesso, secretAccessKey: segredo },
    })
  }

  return {
    async salvar(chave, dados, tipoConteudo) {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3')
      const cliente = await carregarCliente()
      await cliente.send(
        new PutObjectCommand({
          Bucket: balde,
          Key: chave,
          Body: dados,
          ContentType: tipoConteudo,
          // Foto de anúncio não muda depois de enviada — quando o Jair troca a
          // foto, a chave é outra. Cache longo economiza banda e faz a página
          // abrir rápido na segunda visita.
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
    },
    async apagar(chave) {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
      const cliente = await carregarCliente()
      await cliente.send(new DeleteObjectCommand({ Bucket: balde, Key: chave }))
    },
    async ler(chave) {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3')
      const cliente = await carregarCliente()
      const resposta = await cliente.send(new GetObjectCommand({ Bucket: balde, Key: chave }))
      const bytes = await resposta.Body!.transformToByteArray()
      return Buffer.from(bytes)
    },
    urlPublica(chave) {
      return `${urlBase.replace(/\/$/, '')}/${chave}`
    },
  }
}

let instancia: Armazenamento | null = null

export function armazenamento(): Armazenamento {
  if (!instancia) {
    instancia = process.env.ARMAZENAMENTO === 'r2' ? criarArmazenamentoR2() : armazenamentoLocal
  }
  return instancia
}

/** Monta a URL de exibição de uma chave. `null` vira uma imagem de espera. */
export function urlFoto(chave: string | null | undefined): string | null {
  if (!chave) return null
  return armazenamento().urlPublica(chave)
}

/** Só para os testes trocarem de driver. */
export function redefinirArmazenamento(): void {
  instancia = null
}
