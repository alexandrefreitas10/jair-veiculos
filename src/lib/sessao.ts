import { auth } from '@/auth'

export class NaoAutorizado extends Error {
  constructor() {
    super('Não autorizado')
    this.name = 'NaoAutorizado'
  }
}

/**
 * Porteiro de TODA ação de servidor do painel. Chamar na PRIMEIRA linha.
 *
 * O redirecionamento do `proxy.ts` protege a navegação, não a ação: uma Server
 * Action é alcançável por POST direto, sem passar por página nenhuma. Quem
 * souber o identificador da ação consegue chamá-la de fora do navegador. Se a
 * checagem morasse só no proxy, um POST montado à mão apagaria anúncio,
 * registraria venda ou leria o valor de compra dos carros.
 *
 * Está escrito na documentação do Next em letras garrafais e ainda assim é o
 * erro mais comum de quem usa Server Actions.
 */
export async function exigirSessao(): Promise<{ id: string; nome: string }> {
  const sessao = await auth()
  const usuario = sessao?.user
  if (!usuario?.id) throw new NaoAutorizado()
  return { id: String(usuario.id), nome: usuario.name ?? '' }
}

/** Para tela: diz se há sessão sem derrubar a renderização. */
export async function temSessao(): Promise<boolean> {
  const sessao = await auth()
  return Boolean(sessao?.user?.id)
}
