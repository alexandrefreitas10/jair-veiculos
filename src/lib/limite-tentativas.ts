// Freio de força bruta no login.
//
// O painel tem UM usuário e uma senha. Sem freio, um script tenta senha o dia
// inteiro contra um endereço que qualquer um descobre — /login está na
// internet aberta, e o prêmio é publicar ou apagar os anúncios do Jair.
//
// A contagem é em memória, de propósito. O app roda numa instância só no
// Render, então um Map resolve. Guardar isso no banco custaria duas idas ao
// Postgres em cada tentativa de login para proteger contra um cenário —
// múltiplas instâncias — que não existe hoje. Se um dia houver mais de uma
// instância, o freio afrouxa (cada uma conta as suas), e aí vale mover pro
// banco. Este comentário existe pra que essa decisão seja revista de propósito,
// e não descoberta de susto.

const MAX_TENTATIVAS = 5
const BLOQUEIO_MS = 15 * 60 * 1000 // 15 minutos
const JANELA_MS = 15 * 60 * 1000

type Registro = { falhas: number[]; bloqueadoAte: number }

const registros = new Map<string, Registro>()

export type Situacao = { bloqueado: boolean; restaSegundos: number }

function obter(chave: string): Registro {
  let r = registros.get(chave)
  if (!r) {
    r = { falhas: [], bloqueadoAte: 0 }
    registros.set(chave, r)
  }
  return r
}

export function conferirBloqueio(chave: string, agora = Date.now()): Situacao {
  const r = obter(chave)
  if (r.bloqueadoAte > agora) {
    return { bloqueado: true, restaSegundos: Math.ceil((r.bloqueadoAte - agora) / 1000) }
  }
  return { bloqueado: false, restaSegundos: 0 }
}

export function registrarFalha(chave: string, agora = Date.now()): Situacao {
  const r = obter(chave)
  r.falhas = r.falhas.filter((t) => agora - t < JANELA_MS)
  r.falhas.push(agora)

  if (r.falhas.length >= MAX_TENTATIVAS) {
    r.bloqueadoAte = agora + BLOQUEIO_MS
    r.falhas = []
    return { bloqueado: true, restaSegundos: Math.ceil(BLOQUEIO_MS / 1000) }
  }
  return { bloqueado: false, restaSegundos: 0 }
}

/** Login deu certo: zera tudo. Sem isso, cinco erros de digitação espalhados
 *  ao longo do mês bloqueariam o Jair no dia em que ele acertasse. */
export function limparTentativas(chave: string): void {
  registros.delete(chave)
}

/** Só para os testes. */
export function zerarTudo(): void {
  registros.clear()
}
