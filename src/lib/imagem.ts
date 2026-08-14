import sharp from 'sharp'

// Foto de celular chega com 4 a 8 MB e 4000 pixels de largura. Publicada crua,
// a página do anúncio não abre no 4G do cliente que está parado na rua olhando
// o carro — e é exatamente esse o momento que decide a visita.
//
// Duas versões de cada foto:
//   grande    — 1600px, o que aparece no anúncio
//   miniatura — 400px, o que aparece na listagem
//
// A listagem mostra 20 carros; com a versão grande em cada cartão, seriam
// dezenas de megabytes só pra rolar a página.

const LARGURA_GRANDE = 1600
const LARGURA_MINIATURA = 400
const QUALIDADE_GRANDE = 82
const QUALIDADE_MINIATURA = 70

/** Tamanho máximo aceito no envio. Acima disso é engano (vídeo, print de tela
 *  gigante) e vale recusar antes de gastar memória processando. */
export const TAMANHO_MAXIMO_BYTES = 25 * 1024 * 1024

export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export type ImagemProcessada = {
  grande: Buffer
  miniatura: Buffer
  largura: number
  altura: number
}

/**
 * Converte para WebP em duas resoluções.
 *
 * O sharp descarta os metadados por padrão, e aqui isso é uma vantagem que vale
 * dizer em voz alta: foto tirada de celular carrega EXIF com a coordenada de
 * GPS de onde foi tirada. Publicar isso entregaria o endereço da casa do Jair,
 * ou o do dono do carro consignado, junto com o anúncio.
 *
 * `rotate()` sem argumento aplica a orientação do EXIF antes de descartá-lo —
 * sem ele, foto tirada em pé sai deitada no site.
 */
export async function processarFoto(original: Buffer): Promise<ImagemProcessada> {
  const base = sharp(original, { failOn: 'error' }).rotate()

  const metadados = await base.metadata()
  if (!metadados.width || !metadados.height) {
    throw new Error('Arquivo não parece uma imagem válida.')
  }

  const grande = await base
    .clone()
    .resize({ width: LARGURA_GRANDE, withoutEnlargement: true })
    .webp({ quality: QUALIDADE_GRANDE })
    .toBuffer()

  const miniatura = await base
    .clone()
    .resize({ width: LARGURA_MINIATURA, withoutEnlargement: true })
    .webp({ quality: QUALIDADE_MINIATURA })
    .toBuffer()

  const larguraFinal = Math.min(metadados.width, LARGURA_GRANDE)
  const altura = Math.round((metadados.height / metadados.width) * larguraFinal)

  return { grande, miniatura, largura: larguraFinal, altura }
}
