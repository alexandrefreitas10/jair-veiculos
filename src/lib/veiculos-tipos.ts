// Listas fixas e tipos do veículo. Ficam num arquivo só para que o formulário,
// os filtros da vitrine e a validação nunca discordem sobre o que é um câmbio
// válido.

export const ESTADOS = ['rascunho', 'disponivel', 'reservado', 'vendido', 'arquivado'] as const
export type Estado = (typeof ESTADOS)[number]

/** Os únicos estados que aparecem na vitrine pública. */
export const ESTADOS_PUBLICOS: Estado[] = ['disponivel', 'reservado']

export const ROTULO_ESTADO: Record<Estado, string> = {
  rascunho: 'Rascunho',
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  arquivado: 'Arquivado',
}

export const CAMBIOS = ['manual', 'automatico', 'automatizado', 'cvt'] as const
export type Cambio = (typeof CAMBIOS)[number]
export const ROTULO_CAMBIO: Record<Cambio, string> = {
  manual: 'Manual',
  automatico: 'Automático',
  automatizado: 'Automatizado',
  cvt: 'CVT',
}

export const COMBUSTIVEIS = ['flex', 'gasolina', 'etanol', 'diesel', 'gnv', 'hibrido', 'eletrico'] as const
export type Combustivel = (typeof COMBUSTIVEIS)[number]
export const ROTULO_COMBUSTIVEL: Record<Combustivel, string> = {
  flex: 'Flex',
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
  hibrido: 'Híbrido',
  eletrico: 'Elétrico',
}

export const CARROCERIAS = ['hatch', 'sedan', 'suv', 'picape', 'minivan', 'perua', 'cupe', 'conversivel'] as const
export type Carroceria = (typeof CARROCERIAS)[number]
export const ROTULO_CARROCERIA: Record<Carroceria, string> = {
  hatch: 'Hatch',
  sedan: 'Sedã',
  suv: 'SUV',
  picape: 'Picape',
  minivan: 'Minivan',
  perua: 'Perua',
  cupe: 'Cupê',
  conversivel: 'Conversível',
}

export const ORIGENS = ['proprio', 'consignado'] as const
export type Origem = (typeof ORIGENS)[number]
export const ROTULO_ORIGEM: Record<Origem, string> = {
  proprio: 'Estoque próprio',
  consignado: 'Consignado',
}

export const CATEGORIAS_CUSTO = [
  'compra',
  'funilaria',
  'mecanica',
  'documentacao',
  'pneus',
  'lavagem',
  'transporte',
  'outros',
] as const
export type CategoriaCusto = (typeof CATEGORIAS_CUSTO)[number]
export const ROTULO_CATEGORIA_CUSTO: Record<CategoriaCusto, string> = {
  compra: 'Compra',
  funilaria: 'Funilaria e pintura',
  mecanica: 'Mecânica',
  documentacao: 'Documentação',
  pneus: 'Pneus',
  lavagem: 'Lavagem e estética',
  transporte: 'Transporte e guincho',
  outros: 'Outros',
}

export const FORMAS_PAGAMENTO = ['a_vista', 'financiado', 'parcelado_direto', 'misto'] as const
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]
export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  a_vista: 'À vista',
  financiado: 'Financiado por banco',
  parcelado_direto: 'Parcelado direto com ele',
  misto: 'Misto',
}

/** Os selos que aparecem no anúncio. A ordem aqui é a ordem na tela. */
export const SELOS = [
  { campo: 'ipva_pago', rotulo: 'IPVA pago' },
  { campo: 'licenciamento_ok', rotulo: 'Licenciamento em dia' },
  { campo: 'sem_multas', rotulo: 'Sem multas' },
  { campo: 'sem_debitos', rotulo: 'Sem débitos' },
  { campo: 'laudo_cautelar_ok', rotulo: 'Laudo cautelar aprovado' },
  { campo: 'unico_dono', rotulo: 'Único dono' },
  { campo: 'revisoes_em_dia', rotulo: 'Revisões em dia' },
  { campo: 'chave_reserva', rotulo: 'Chave reserva' },
  { campo: 'manual', rotulo: 'Manual do proprietário' },
] as const
export type CampoSelo = (typeof SELOS)[number]['campo']

/** Opcionais oferecidos no formulário. Lista curta de propósito: o que o
 *  comprador de usado realmente procura no filtro. */
export const OPCIONAIS = [
  'Ar-condicionado',
  'Direção hidráulica',
  'Direção elétrica',
  'Vidros elétricos',
  'Travas elétricas',
  'Airbag',
  'Freios ABS',
  'Central multimídia',
  'Câmera de ré',
  'Sensor de estacionamento',
  'Piloto automático',
  'Bancos de couro',
  'Teto solar',
  'Rodas de liga leve',
  'Faróis de LED',
  'Engate',
  'Blindado',
] as const

export function ehEstado(v: string): v is Estado {
  return (ESTADOS as readonly string[]).includes(v)
}
