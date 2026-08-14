// Popula o banco LOCAL com carros de exemplo, pra conferir o site com conteúdo.
//
//   npm run dados-demo
//
// As fotos são retângulos coloridos gerados na hora — servem pra ver o layout,
// não pra parecer carro de verdade.
//
// Recusa banco remoto. Rodar isto contra produção encheria o site do Jair de
// carro inventado, e ele descobriria pelo cliente.
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import postgres from 'postgres'
import sharp from 'sharp'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('\nSem DATABASE_URL. Confira o .env.local.\n')
  process.exit(1)
}

const host = new URL(url).hostname
if (!/^(localhost|127\.0\.0\.1|::1)$/.test(host)) {
  console.error(
    `\n${'='.repeat(60)}\n` +
      `  RECUSADO: DATABASE_URL aponta pra ${host}, que não é local.\n\n` +
      `  Este script cria carros inventados. Contra o banco de produção,\n` +
      `  o site do Jair ficaria cheio de anúncio falso.\n` +
      `${'='.repeat(60)}\n`,
  )
  process.exit(1)
}

const sql = postgres(url, { ssl: false, max: 4, onnotice: () => {} })
const RAIZ = resolve(process.cwd(), '.uploads')

const CARROS = [
  { marca: 'Chevrolet', modelo: 'Onix', versao: 'LT 1.0 Turbo', anoFab: 2021, anoMod: 2022, km: 38_000, cambio: 'automatico', combustivel: 'flex', cor: 'Prata', preco: 7_890_000, compra: 6_600_000, destaque: true, cores: ['#8e9aa6', '#5b6670'] },
  { marca: 'Fiat', modelo: 'Argo', versao: 'Drive 1.3', anoFab: 2020, anoMod: 2020, km: 54_200, cambio: 'manual', combustivel: 'flex', cor: 'Vermelho', preco: 5_990_000, compra: 5_100_000, destaque: false, cores: ['#b23b3b', '#7a2020'] },
  { marca: 'Honda', modelo: 'Civic', versao: 'EXL 2.0', anoFab: 2018, anoMod: 2019, km: 78_500, cambio: 'automatico', combustivel: 'flex', cor: 'Preto', preco: 11_500_000, compra: null, destaque: true, consignado: true, cores: ['#23262c', '#12141a'] },
  { marca: 'Volkswagen', modelo: 'Gol', versao: '1.6 MSI', anoFab: 2017, anoMod: 2018, km: 96_000, cambio: 'manual', combustivel: 'flex', cor: 'Branco', preco: 4_290_000, compra: 3_600_000, destaque: false, cores: ['#d8dade', '#a8acb3'] },
  { marca: 'Toyota', modelo: 'Corolla', versao: 'XEi 2.0', anoFab: 2022, anoMod: 2023, km: 21_400, cambio: 'cvt', combustivel: 'flex', cor: 'Cinza', preco: 15_900_000, compra: 14_100_000, destaque: true, cores: ['#6a707a', '#3f444d'] },
  { marca: 'Hyundai', modelo: 'HB20', versao: 'Comfort 1.0', anoFab: 2019, anoMod: 2020, km: 61_800, cambio: 'manual', combustivel: 'flex', cor: 'Azul', preco: 5_490_000, compra: 4_700_000, destaque: false, cores: ['#33557f', '#1e3350'] },
]

const normalizar = (t) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

async function foto(de, para, texto) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${de}"/><stop offset="100%" stop-color="${para}"/>
    </linearGradient></defs>
    <rect width="1600" height="1200" fill="url(#g)"/>
    <text x="800" y="620" font-family="sans-serif" font-size="76" fill="rgba(255,255,255,0.5)"
      text-anchor="middle">${texto}</text>
  </svg>`
  return Buffer.from(svg)
}

async function gravar(chave, dados) {
  const destino = join(RAIZ, chave)
  await mkdir(dirname(destino), { recursive: true })
  await writeFile(destino, dados)
}

try {
  console.log('\nLimpando o que havia…')
  await sql`DELETE FROM negocios`
  await sql`DELETE FROM veiculo_custos`
  await sql`DELETE FROM veiculo_fotos`
  await sql`DELETE FROM veiculos`

  for (const c of CARROS) {
    const slug = `${normalizar(`${c.marca} ${c.modelo} ${c.versao} ${c.anoMod}`)}-${randomBytes(2).toString('hex')}`

    const [v] = await sql`
      INSERT INTO veiculos (
        slug, marca, modelo, versao, ano_fabricacao, ano_modelo, km, cambio,
        combustivel, cor, portas, preco_centavos, aceita_troca, destaque, descricao,
        ipva_pago, licenciamento_ok, sem_multas, sem_debitos, laudo_cautelar_ok,
        unico_dono, chave_reserva, revisoes_em_dia,
        origem, valor_compra_centavos, consignante_nome, data_entrada, estado,
        opcionais
      ) VALUES (
        ${slug}, ${c.marca}, ${c.modelo}, ${c.versao}, ${c.anoFab}, ${c.anoMod},
        ${c.km}, ${c.cambio}, ${c.combustivel}, ${c.cor}, 4, ${c.preco}, true,
        ${c.destaque},
        ${`${c.marca} ${c.modelo} ${c.versao} em ótimo estado de conservação. Revisões em dia, pneus com boa banda, sem retoque de pintura. Aceito troca e ajudo com o financiamento.`},
        true, true, true, true, true, ${!c.consignado}, true, true,
        ${c.consignado ? 'consignado' : 'proprio'}, ${c.compra},
        ${c.consignado ? 'Maria Aparecida' : null},
        ${new Date(Date.now() - Math.floor(Math.random() * 120) * 86400000).toISOString().slice(0, 10)},
        'disponivel',
        ${['Ar-condicionado', 'Direção elétrica', 'Vidros elétricos', 'Airbag', 'Freios ABS', 'Central multimídia']}
      ) RETURNING id
    `

    for (let i = 0; i < 4; i++) {
      const nome = randomBytes(6).toString('hex')
      const chave = `veiculos/${v.id}/${nome}.webp`
      const mini = `veiculos/${v.id}/${nome}-mini.webp`
      const svg = await foto(c.cores[0], c.cores[1], `${c.marca} ${c.modelo}`)

      await gravar(chave, await sharp(svg).resize({ width: 1600 }).webp({ quality: 82 }).toBuffer())
      await gravar(mini, await sharp(svg).resize({ width: 400 }).webp({ quality: 70 }).toBuffer())

      await sql`
        INSERT INTO veiculo_fotos (veiculo_id, chave, chave_miniatura, largura, altura, ordem, capa)
        VALUES (${v.id}, ${chave}, ${mini}, 1600, 1200, ${i}, ${i === 0})
      `
    }

    if (!c.consignado) {
      await sql`
        INSERT INTO veiculo_custos (veiculo_id, data, categoria, descricao, valor_centavos)
        VALUES
          (${v.id}, CURRENT_DATE, 'documentacao', 'Transferência', ${Math.floor(Math.random() * 60000) + 40000}),
          (${v.id}, CURRENT_DATE, 'lavagem', 'Polimento e higienização', ${Math.floor(Math.random() * 30000) + 15000})
      `
    }

    console.log(`  ${c.marca} ${c.modelo} — 4 fotos`)
  }

  // Duas vendas passadas, pra o painel e o relatório terem o que mostrar.
  const [vendido] = await sql`
    INSERT INTO veiculos (
      slug, marca, modelo, versao, ano_fabricacao, ano_modelo, km, cambio, combustivel,
      cor, preco_centavos, origem, valor_compra_centavos, data_entrada, estado
    ) VALUES (
      ${`renault-sandero-2019-${randomBytes(2).toString('hex')}`}, 'Renault', 'Sandero',
      'Expression 1.0', 2018, 2019, 72000, 'manual', 'flex', 'Branco',
      4_690_000, 'proprio', 3_900_000, CURRENT_DATE - 90, 'vendido'
    ) RETURNING id
  `
  await sql`
    INSERT INTO veiculo_custos (veiculo_id, data, categoria, descricao, valor_centavos)
    VALUES (${vendido.id}, CURRENT_DATE - 60, 'mecanica', 'Embreagem', 180000)
  `
  await sql`
    INSERT INTO negocios (veiculo_id, data, comprador_nome, comprador_contato, valor_venda_centavos, forma_pagamento)
    VALUES (${vendido.id}, CURRENT_DATE - 25, 'Carlos Souza', '11 97777-1234', 4_690_000, 'financiado')
  `

  console.log('\nPronto. Seis carros no ar, um vendido.\n')
} catch (err) {
  console.error('\nFalhou:', err.message, '\n')
  process.exitCode = 1
} finally {
  await sql.end()
}
