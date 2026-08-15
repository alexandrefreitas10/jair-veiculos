// Tudo que depende de uma informação do Jair mora aqui. Um arquivo só, para
// trocar sem caçar texto espalhado pelo projeto.

// ⚠️ LEIA ANTES DE DIVULGAR O SITE
//
// Os textos de `financiamento` e `incluidoNaCompra` abaixo vieram do handoff de
// design, onde eram texto de preenchimento. Num site no ar eles deixam de ser
// enfeite e viram OFERTA: o Código de Defesa do Consumidor trata publicidade
// como vinculante, e "garantia de motor e câmbio por 3 meses" é uma obrigação
// que o Jair passa a ter com quem comprar.
//
// Confirme item por item com ele antes de publicar qualquer carro. O que não
// for verdade, apague da lista — lista vazia some da tela sozinha.

type ConfiguracaoSite = {
  nome: string
  descricao: string
  whatsapp: string
  /** Vazio esconde o item no rodapé — o Jair ainda vai informar. */
  instagram: string
  telefone: string
  cidade: string
  estado: string
  url: string

  financiamento: {
    /** `false` esconde o simulador inteiro do site. */
    ativo: boolean
    /** Taxa mensal usada na tabela Price. 0.0149 = 1,49% a.m. */
    taxaMensal: number
    /** Aparece embaixo da parcela, junto com a taxa. */
    ressalva: string
    prazos: number[]
  }

  /** Some da tela quando a lista está vazia. */
  incluidoNaCompra: string[]
}

export const SITE: ConfiguracaoSite = {
  nome: 'Jair Junior Veículos',
  descricao:
    'Carros usados e seminovos selecionados, com procedência verificada. Fale direto com o vendedor pelo WhatsApp.',

  /** Só dígitos, com DDI e DDD: 55 + 62 (Goiânia) + 98192-8080.
   *  O link do WhatsApp não aceita traço nem parêntese. */
  whatsapp: '5562981928080',

  instagram: '@jairpiresjr85',

  /** Vazio de propósito: o telefone dele é o mesmo do WhatsApp, e repetir o
   *  número duas vezes no rodapé parece erro. Preencher só se um dia houver
   *  uma linha fixa ou comercial diferente. */
  telefone: '',

  cidade: 'Goiânia',
  estado: 'GO',

  /** Endereço público do site. Em produção vem do ambiente. */
  url: process.env.NEXT_PUBLIC_URL_SITE ?? 'http://localhost:3000',

  // ⚠️ CONFIRMAR COM O JAIR (ver aviso no topo do arquivo).
  financiamento: {
    ativo: true,
    taxaMensal: 0.0149,
    ressalva: 'Simulação com taxa de 1,49% a.m. Valor final sujeito a análise de crédito.',
    prazos: [24, 36, 48, 60],
  },

  // ⚠️ CONFIRMAR COM O JAIR, um por um. Cada linha aqui é uma promessa ao
  // comprador. Apague o que não for verdade — lista vazia some da tela.
  incluidoNaCompra: [
    'Transferência e documentação',
    'Revisão completa antes da entrega',
    'Garantia de motor e câmbio por 3 meses',
    'Laudo cautelar em mãos',
  ],
}

/** Link do WhatsApp com a mensagem já escrita.
 *
 *  O link do anúncio vai DENTRO da mensagem de propósito: o Jair recebe várias
 *  conversas por dia e "tenho interesse no carro" sem referência obriga ele a
 *  perguntar de qual carro se trata — atrito bobo no momento mais quente. */
export function linkWhatsapp(mensagem: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensagem)}`
}
