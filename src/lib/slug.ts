// Slug da URL do anúncio: /carros/chevrolet-onix-lt-2020-a3f9
//
// O sufixo aleatório no fim existe porque o Jair vende carro repetido. Dois
// Onix LT 2020 gerariam o mesmo slug, e o segundo cadastro esbarraria na
// restrição de unicidade bem na hora em que ele está com o cliente do lado.

const ACENTOS = /[̀-ͯ]/g

/** "Ônix LT 1.0 Turbo" → "onix-lt-1-0-turbo" */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(ACENTOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type DadosSlug = {
  marca: string
  modelo: string
  versao?: string | null
  anoModelo: number
}

/**
 * Monta o slug com um sufixo curto e aleatório.
 *
 * O sufixo é gerado aqui, e não conferido contra o banco, de propósito: são
 * 36^4 combinações para um estoque de dez carros. Conferir custaria uma ida ao
 * banco em toda criação para evitar um encontro que, na prática, não acontece —
 * e se acontecer, a restrição UNIQUE da coluna barra e o cadastro é refeito.
 */
export function gerarSlug(dados: DadosSlug): string {
  const partes = [dados.marca, dados.modelo, dados.versao ?? '', String(dados.anoModelo)]
    .map(normalizar)
    .filter(Boolean)
  const sufixo = Math.random().toString(36).slice(2, 6)
  return `${partes.join('-')}-${sufixo}`
}
