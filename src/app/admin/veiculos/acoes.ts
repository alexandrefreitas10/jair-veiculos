'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exigirSessao } from '@/lib/sessao'
import { paraCentavos } from '@/lib/dinheiro'
import { atualizarVeiculo, criarVeiculo, apagarVeiculo, mudarEstado } from '@/lib/veiculos'
import { adicionarFoto, definirCapa, removerFoto } from '@/lib/fotos'
import { lancarCusto, removerCusto } from '@/lib/custos'
import { TAMANHO_MAXIMO_BYTES } from '@/lib/imagem'
import {
  CAMBIOS, CARROCERIAS, CATEGORIAS_CUSTO, COMBUSTIVEIS, ESTADOS, ORIGENS,
} from '@/lib/veiculos-tipos'
import type {
  Cambio, Carroceria, CategoriaCusto, Combustivel, Estado, Origem,
} from '@/lib/veiculos-tipos'

// TODA ação deste arquivo chama `exigirSessao()` na primeira linha.
//
// Não é zelo excessivo: uma Server Action é um endpoint POST de verdade,
// alcançável de fora do navegador por quem souber o identificador dela. O
// redirecionamento do proxy protege a navegação até a página — não protege a
// ação. Sem esta linha, um POST montado à mão apagaria anúncio ou leria o
// valor de compra dos carros.

// ── Leitura do formulário ───────────────────────────────────────────────────

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

const marcado = (f: FormData, campo: string): boolean => f.get(campo) === 'on' || f.get(campo) === 'true'

function daLista<T extends string>(f: FormData, campo: string, lista: readonly T[]): T | null {
  const v = texto(f, campo)
  return v && (lista as readonly string[]).includes(v) ? (v as T) : null
}

/** Traduz o formulário em dados do veículo.
 *
 *  O que vem do formulário é texto de fora e é tratado como suspeito: valor
 *  fora da lista conhecida vira `null` em vez de ir parar no banco. */
function lerFormulario(f: FormData) {
  const origem = daLista<Origem>(f, 'origem', ORIGENS) ?? 'proprio'
  const consignado = origem === 'consignado'

  return {
    marca: texto(f, 'marca') ?? '',
    modelo: texto(f, 'modelo') ?? '',
    versao: texto(f, 'versao'),
    anoFabricacao: inteiro(f, 'anoFabricacao') ?? new Date().getFullYear(),
    anoModelo: inteiro(f, 'anoModelo') ?? new Date().getFullYear(),
    km: inteiro(f, 'km') ?? 0,
    cambio: daLista<Cambio>(f, 'cambio', CAMBIOS) ?? 'manual',
    combustivel: daLista<Combustivel>(f, 'combustivel', COMBUSTIVEIS) ?? 'flex',
    cor: texto(f, 'cor') ?? '',
    portas: inteiro(f, 'portas') ?? 4,
    carroceria: daLista<Carroceria>(f, 'carroceria', CARROCERIAS),
    finalPlaca: texto(f, 'finalPlaca'),
    opcionais: f.getAll('opcionais').filter((o): o is string => typeof o === 'string'),
    precoCentavos: paraCentavos(texto(f, 'preco')) ?? 0,
    aceitaTroca: marcado(f, 'aceitaTroca'),
    descricao: texto(f, 'descricao'),
    destaque: marcado(f, 'destaque'),

    ipvaPago: marcado(f, 'ipvaPago'),
    licenciamentoOk: marcado(f, 'licenciamentoOk'),
    semMultas: marcado(f, 'semMultas'),
    semDebitos: marcado(f, 'semDebitos'),
    laudoCautelarOk: marcado(f, 'laudoCautelarOk'),
    unicoDono: marcado(f, 'unicoDono'),
    chaveReserva: marcado(f, 'chaveReserva'),
    manual: marcado(f, 'manual'),
    revisoesEmDia: marcado(f, 'revisoesEmDia'),

    origem,
    // Carro consignado não tem valor de compra: ele não é do Jair. Deixar um
    // resto de valor aqui inflaria o custo e comeria o lucro de um negócio que
    // é só comissão.
    valorCompraCentavos: consignado ? null : paraCentavos(texto(f, 'valorCompra')),
    consignanteNome: consignado ? texto(f, 'consignanteNome') : null,
    consignanteContato: consignado ? texto(f, 'consignanteContato') : null,
    dataEntrada: texto(f, 'dataEntrada') ?? undefined,
    observacoesInternas: texto(f, 'observacoesInternas'),
  }
}

// ── Veículo ─────────────────────────────────────────────────────────────────

/** As despesas do passo 2 chegam como JSON num campo escondido: a tabela é
 *  dinâmica e o servidor precisa recebê-la inteira. JSON inválido vira lista
 *  vazia — perder uma despesa é ruim, mas derrubar o cadastro inteiro do carro
 *  por causa dela é pior. */
function lerDespesas(f: FormData): Array<{ descricao: string; categoria: string; valor: string }> {
  const bruto = texto(f, 'despesas')
  if (!bruto) return []
  try {
    const lista = JSON.parse(bruto)
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

export async function criarVeiculoAcao(_anterior: unknown, formulario: FormData) {
  await exigirSessao()

  const dados = lerFormulario(formulario)
  if (!dados.marca || !dados.modelo) {
    return { erro: 'Marca e modelo são obrigatórios.' }
  }

  // "Já no site" só vale se o botão de publicar foi usado; "Salvar rascunho"
  // sempre guarda como rascunho, mesmo com o segmentado marcado — o botão que
  // ele clicou diz mais sobre a intenção do que o campo que ficou marcado.
  const querPublicar = texto(formulario, 'publicar') === 'site' && !formulario.get('rascunho')

  // O preço vem do preço sugerido do aside (custo × margem alvo) quando ele não
  // digitou um preço próprio.
  const precoSugerido = inteiro(formulario, 'precoSugerido')
  const preco = dados.precoCentavos > 0 ? dados.precoCentavos : (precoSugerido ?? 0)

  const id = await criarVeiculo({ ...dados, precoCentavos: preco, estado: 'rascunho' })

  // As despesas entram depois do veículo, na mesma requisição. Se alguma falhar
  // o cadastro continua de pé — e ele relança pelo livro, que é uma tela feita
  // pra isso.
  for (const d of lerDespesas(formulario)) {
    const valorCentavos = paraCentavos(d.valor)
    if (valorCentavos === null || valorCentavos === 0) continue
    const categoria = (CATEGORIAS_CUSTO as readonly string[]).includes(d.categoria)
      ? (d.categoria as CategoriaCusto)
      : 'outros'
    await lancarCusto({
      veiculoId: id,
      categoria,
      valorCentavos,
      descricao: d.descricao?.trim() || null,
      data: dados.dataEntrada,
    })
  }

  if (querPublicar) await mudarEstado(id, 'disponivel')

  revalidatePath('/admin/veiculos')
  revalidatePath('/admin')
  revalidatePath('/')
  redirect(`/admin/veiculos/${id}?novo=1`)
}

export async function salvarVeiculoAcao(_anterior: unknown, formulario: FormData) {
  await exigirSessao()

  const id = Number(formulario.get('id'))
  if (!Number.isInteger(id)) return { erro: 'Veículo inválido.' }

  const dados = lerFormulario(formulario)
  if (!dados.marca || !dados.modelo) return { erro: 'Marca e modelo são obrigatórios.' }

  await atualizarVeiculo(id, dados)

  revalidatePath(`/admin/veiculos/${id}`)
  revalidatePath('/admin/veiculos')
  revalidatePath('/')
  return { erro: null, salvoEm: Date.now() }
}

export async function mudarEstadoAcao(formulario: FormData) {
  await exigirSessao()

  const id = Number(formulario.get('id'))
  const estado = daLista<Estado>(formulario, 'estado', ESTADOS)
  if (!Number.isInteger(id) || !estado) return

  await mudarEstado(id, estado)

  revalidatePath(`/admin/veiculos/${id}`)
  revalidatePath('/admin/veiculos')
  revalidatePath('/')
}

export async function apagarVeiculoAcao(formulario: FormData) {
  await exigirSessao()

  const id = Number(formulario.get('id'))
  if (!Number.isInteger(id)) return

  // Um veículo com venda registrada é barrado pelo banco (ON DELETE RESTRICT).
  // O erro sobe e vira a página de erro — apagar o carro apagaria o histórico
  // financeiro junto, e é isso que o banco está impedindo.
  await apagarVeiculo(id)

  revalidatePath('/admin/veiculos')
  revalidatePath('/')
  redirect('/admin/veiculos')
}

// ── Fotos ───────────────────────────────────────────────────────────────────

export async function enviarFotosAcao(_anterior: unknown, formulario: FormData) {
  await exigirSessao()

  const id = Number(formulario.get('id'))
  if (!Number.isInteger(id)) return { erro: 'Veículo inválido.' }

  const arquivos = formulario.getAll('fotos').filter((a): a is File => a instanceof File && a.size > 0)
  if (arquivos.length === 0) return { erro: 'Escolha pelo menos uma foto.' }

  const problemas: string[] = []

  for (const arquivo of arquivos) {
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      problemas.push(`${arquivo.name}: arquivo grande demais.`)
      continue
    }
    try {
      await adicionarFoto(id, Buffer.from(await arquivo.arrayBuffer()))
    } catch {
      // Uma foto ruim no meio de dez não pode derrubar as outras nove: o Jair
      // seleciona tudo de uma vez na galeria do celular e às vezes pega um
      // vídeo sem querer.
      problemas.push(`${arquivo.name}: não deu para processar.`)
    }
  }

  revalidatePath(`/admin/veiculos/${id}`)
  revalidatePath('/')
  return { erro: problemas.length > 0 ? problemas.join(' ') : null, salvoEm: Date.now() }
}

export async function removerFotoAcao(formulario: FormData) {
  await exigirSessao()

  const fotoId = Number(formulario.get('fotoId'))
  const veiculoId = Number(formulario.get('veiculoId'))
  if (!Number.isInteger(fotoId)) return

  await removerFoto(fotoId)

  revalidatePath(`/admin/veiculos/${veiculoId}`)
  revalidatePath('/')
}

export async function definirCapaAcao(formulario: FormData) {
  await exigirSessao()

  const fotoId = Number(formulario.get('fotoId'))
  const veiculoId = Number(formulario.get('veiculoId'))
  if (!Number.isInteger(fotoId) || !Number.isInteger(veiculoId)) return

  await definirCapa(veiculoId, fotoId)

  revalidatePath(`/admin/veiculos/${veiculoId}`)
  revalidatePath('/')
}

// ── Custos ──────────────────────────────────────────────────────────────────

export async function lancarCustoAcao(_anterior: unknown, formulario: FormData) {
  await exigirSessao()

  const veiculoId = Number(formulario.get('veiculoId'))
  const categoria = daLista<CategoriaCusto>(formulario, 'categoria', CATEGORIAS_CUSTO)
  const valorCentavos = paraCentavos(texto(formulario, 'valor'))

  if (!Number.isInteger(veiculoId) || !categoria) return { erro: 'Escolha a categoria.' }
  if (valorCentavos === null || valorCentavos === 0) return { erro: 'Informe o valor.' }

  await lancarCusto({
    veiculoId,
    categoria,
    valorCentavos,
    descricao: texto(formulario, 'descricao'),
    data: texto(formulario, 'data') ?? undefined,
  })

  revalidatePath(`/admin/veiculos/${veiculoId}`)
  revalidatePath('/admin')
  return { erro: null, salvoEm: Date.now() }
}

export async function removerCustoAcao(formulario: FormData) {
  await exigirSessao()

  const id = Number(formulario.get('custoId'))
  const veiculoId = Number(formulario.get('veiculoId'))
  if (!Number.isInteger(id)) return

  await removerCusto(id)

  revalidatePath(`/admin/veiculos/${veiculoId}`)
  revalidatePath('/admin')
}
