// Tudo que depende de uma informação do Jair mora aqui. Um arquivo só, para
// trocar sem caçar texto espalhado pelo projeto.

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
}

/** Link do WhatsApp com a mensagem já escrita.
 *
 *  O link do anúncio vai DENTRO da mensagem de propósito: o Jair recebe várias
 *  conversas por dia e "tenho interesse no carro" sem referência obriga ele a
 *  perguntar de qual carro se trata — atrito bobo no momento mais quente. */
export function linkWhatsapp(mensagem: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensagem)}`
}
