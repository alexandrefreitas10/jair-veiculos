'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirSessao } from '@/lib/sessao'
import { paraCentavos } from '@/lib/dinheiro'
import { cancelarNegocio, registrarNegocio } from '@/lib/negocios'
import { CAMBIOS, COMBUSTIVEIS, FORMAS_PAGAMENTO } from '@/lib/veiculos-tipos'
import type { Cambio, Combustivel, FormaPagamento } from '@/lib/veiculos-tipos'

function texto(f: FormData, campo: string): string | null {
  const v = f.get(campo)
  if (typeof v !== 'string') return null
  const limpo = v.trim()
  return limpo === '' ? null : limpo
}

function inteiro(f: FormData, campo: string): number | null {
  const v = texto(f, campo)
  if (v === null) return null
  const n = Number(v.replace(/\D/g, ''))
  return Number.isFinite(n) ? n : null
}

function daLista<T extends string>(f: FormData, campo: string, lista: readonly T[]): T | null {
  const v = texto(f, campo)
  return v && (lista as readonly string[]).includes(v) ? (v as T) : null
}

export async function registrarNegocioAcao(_anterior: unknown, formulario: FormData) {
  await exigirSessao()

  const veiculoId = Number(formulario.get('veiculoId'))
  if (!Number.isInteger(veiculoId) || veiculoId <= 0) {
    return { erro: 'Escolha o carro que foi vendido.' }
  }

  const valorVendaCentavos = paraCentavos(texto(formulario, 'valorVenda'))
  if (valorVendaCentavos === null || valorVendaCentavos <= 0) {
    return { erro: 'Informe o valor da venda.' }
  }

  const houveTroca = formulario.get('houveTroca') === 'on'
  const valorAvaliadoCentavos = paraCentavos(texto(formulario, 'entradaValor'))

  // Marcou troca mas não descreveu o carro: recusa em vez de registrar pela
  // metade. Um negócio com troca sem o carro de entrada deixaria um carro no
  // pátio que o sistema não conhece — e o lucro do próximo negócio sairia
  // errado, porque o custo de aquisição dele se perde.
  if (houveTroca) {
    const marca = texto(formulario, 'entradaMarca')
    const modelo = texto(formulario, 'entradaModelo')
    if (!marca || !modelo) return { erro: 'Informe marca e modelo do carro que entrou na troca.' }
    if (valorAvaliadoCentavos === null || valorAvaliadoCentavos <= 0) {
      return { erro: 'Informe por quanto você aceitou o carro da troca.' }
    }
  }

  try {
    await registrarNegocio({
      veiculoId,
      valorVendaCentavos,
      data: texto(formulario, 'data') ?? undefined,
      compradorNome: texto(formulario, 'compradorNome'),
      compradorContato: texto(formulario, 'compradorContato'),
      formaPagamento: daLista<FormaPagamento>(formulario, 'formaPagamento', FORMAS_PAGAMENTO),
      comissaoRecebidaCentavos: paraCentavos(texto(formulario, 'comissaoRecebida')),
      observacoes: texto(formulario, 'observacoes'),
      entrada: houveTroca
        ? {
            marca: texto(formulario, 'entradaMarca')!,
            modelo: texto(formulario, 'entradaModelo')!,
            versao: texto(formulario, 'entradaVersao'),
            anoFabricacao: inteiro(formulario, 'entradaAnoFabricacao') ?? new Date().getFullYear(),
            anoModelo: inteiro(formulario, 'entradaAnoModelo') ?? new Date().getFullYear(),
            km: inteiro(formulario, 'entradaKm') ?? 0,
            cambio: daLista<Cambio>(formulario, 'entradaCambio', CAMBIOS) ?? 'manual',
            combustivel: daLista<Combustivel>(formulario, 'entradaCombustivel', COMBUSTIVEIS) ?? 'flex',
            cor: texto(formulario, 'entradaCor') ?? '',
            valorAvaliadoCentavos: valorAvaliadoCentavos!,
          }
        : null,
    })
  } catch (err) {
    // "Já foi vendido" e "não encontrado" viram mensagem na tela; o resto sobe.
    return { erro: (err as Error).message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/negocios')
  revalidatePath('/admin/veiculos')
  revalidatePath('/')
  redirect('/admin/negocios?registrado=1')
}

export async function cancelarNegocioAcao(formulario: FormData) {
  await exigirSessao()

  const id = Number(formulario.get('id'))
  if (!Number.isInteger(id)) return

  await cancelarNegocio(id)

  revalidatePath('/admin')
  revalidatePath('/admin/negocios')
  revalidatePath('/admin/veiculos')
  revalidatePath('/')
}
