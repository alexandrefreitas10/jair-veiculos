import postgres from 'postgres'

// SSL ligado para host remoto (o Postgres do Render exige, na URL interna e na
// externa). Desligado só para Postgres local.
const url = process.env.DATABASE_URL ?? ''
const bancoLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url)
const ssl = bancoLocal ? false : ('require' as const)

// As migrações são idempotentes, então TODO boot gera um punhado de avisos
// "relação já existe, ignorando". Impressos, eles enterram qualquer aviso de
// verdade e ensinam quem lê o log a ignorar o log. Silencia só os esperados;
// qualquer outro aviso do Postgres continua aparecendo.
function aoReceberAviso(aviso: { code?: string; message?: string }) {
  if (aviso.code && DDL_ESPERADO.has(aviso.code)) return
  console.warn('[postgres]', aviso.code, aviso.message)
}

// Sem DATABASE_URL (dev/test sem banco), usa o overload sem url para não lançar
// erro na construção — a conexão é preguiçosa de qualquer forma.
const opcoes = { ssl, max: 10, onnotice: aoReceberAviso }
const sql = url ? postgres(url, opcoes) : postgres(opcoes)

/**
 * Recusa subir em produção sem DATABASE_URL, com mensagem que diz o que fazer.
 *
 * Sem esta checagem o sintoma é cruel: a biblioteca `postgres`, chamada sem
 * URL, assume o padrão dela — `localhost:5432`. Em produção isso vira
 * `ECONNREFUSED 127.0.0.1:5432` no log, que parece problema de rede ou de
 * banco caído e manda quem está diagnosticando procurar no lugar errado. A
 * verdade é banal: a variável não foi preenchida.
 *
 * Aconteceu de verdade no primeiro deploy deste projeto, em 15/08/2026.
 *
 * A ausência de URL continua permitida FORA de produção, porque os testes que
 * não tocam o banco precisam poder importar este módulo.
 */
export function conferirConfiguracao(url: string, ambiente: string | undefined): void {
  if (url || ambiente !== 'production') return
  throw new Error(
    'DATABASE_URL não está configurada.\n' +
      'O app tentaria conectar em localhost:5432 e falharia com ECONNREFUSED.\n' +
      'No Render: abra o banco, copie a Internal Database URL (a que NÃO tem\n' +
      '".oregon-postgres" no meio) e cole em Environment → DATABASE_URL.',
  )
}

// Memoiza a migração: roda UMA vez por processo. Em falha, limpa o cache p/ retry.
let schemaPronto: Promise<void> | null = null
export function initSchema(): Promise<void> {
  conferirConfiguracao(url, process.env.NODE_ENV)
  if (!schemaPronto) {
    schemaPronto = migrar().catch((err) => {
      schemaPronto = null
      throw err
    })
  }
  return schemaPronto
}

// Códigos do Postgres ESPERADOS numa migração idempotente (o objeto já existe).
// Qualquer outro erro — permissão negada, disco cheio, tipo incompatível — é
// falha real: precisa aparecer e derrubar o boot. Um app que sobe com o schema
// pela metade quebra depois, em lugares que não parecem ter relação com a causa.
const DDL_ESPERADO = new Set([
  '42701', // duplicate_column
  '42P07', // duplicate_table / duplicate_index
  '42710', // duplicate_object (constraint já existe)
  '42P16', // invalid_table_definition (alteração já aplicada)
])

async function ddl(comando: string): Promise<void> {
  try {
    await sql.unsafe(comando)
  } catch (err) {
    const codigo = (err as { code?: string })?.code
    if (codigo && DDL_ESPERADO.has(codigo)) return
    console.error('[migracoes] FALHOU:', comando.trim().slice(0, 120), '| code:', codigo, '|', (err as Error)?.message)
    throw err
  }
}

async function migrar() {
  // ── Usuários ────────────────────────────────────────────────────────────
  // Só o Jair. Não existe tela de cadastro; o usuário nasce pelo script
  // scripts/criar-usuario.mjs. Site de anúncio com auto-cadastro aberto é
  // convite pra qualquer um publicar carro no nome dele.
  await ddl(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // ── Veículos ────────────────────────────────────────────────────────────
  // O registro central. Três blocos de campos convivem aqui: o que vira o
  // anúncio, os selos de documentação e o que é só do Jair (quanto pagou, de
  // quem é o carro consignado). A separação NÃO é por tabela — é por quem
  // consulta: src/lib/vitrine.ts lista as colunas públicas uma a uma.
  await ddl(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,

      -- público: é o anúncio
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      versao TEXT,
      ano_fabricacao INTEGER NOT NULL,
      ano_modelo INTEGER NOT NULL,
      km INTEGER NOT NULL DEFAULT 0,
      cambio TEXT NOT NULL,
      combustivel TEXT NOT NULL,
      cor TEXT NOT NULL,
      portas INTEGER NOT NULL DEFAULT 4,
      carroceria TEXT,
      final_placa TEXT,
      opcionais TEXT[] NOT NULL DEFAULT '{}',
      preco_centavos INTEGER NOT NULL DEFAULT 0,
      aceita_troca BOOLEAN NOT NULL DEFAULT TRUE,
      descricao TEXT,
      destaque BOOLEAN NOT NULL DEFAULT FALSE,

      -- selos documentais: público, mas SEM imagem de documento (o CRLV tem
      -- CPF, nome e endereço do dono — publicar isso é risco de golpe e LGPD)
      ipva_pago BOOLEAN NOT NULL DEFAULT FALSE,
      licenciamento_ok BOOLEAN NOT NULL DEFAULT FALSE,
      sem_multas BOOLEAN NOT NULL DEFAULT FALSE,
      sem_debitos BOOLEAN NOT NULL DEFAULT FALSE,
      laudo_cautelar_ok BOOLEAN NOT NULL DEFAULT FALSE,
      unico_dono BOOLEAN NOT NULL DEFAULT FALSE,
      chave_reserva BOOLEAN NOT NULL DEFAULT FALSE,
      manual BOOLEAN NOT NULL DEFAULT FALSE,
      revisoes_em_dia BOOLEAN NOT NULL DEFAULT FALSE,

      -- privado: nunca sai numa resposta pública
      origem TEXT NOT NULL DEFAULT 'proprio',
      valor_compra_centavos INTEGER,
      consignante_nome TEXT,
      consignante_contato TEXT,
      comissao_tipo TEXT,
      comissao_percentual_bps INTEGER,
      comissao_fixa_centavos INTEGER,
      data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
      observacoes_internas TEXT,

      estado TEXT NOT NULL DEFAULT 'rascunho',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // ── Fotos ───────────────────────────────────────────────────────────────
  // `chave` é o caminho no armazenamento, não uma URL. A URL depende do driver
  // (disco local em dev, R2 em produção) e é montada na hora de exibir — URL
  // gravada no banco vira link quebrado no dia que o provedor mudar.
  await ddl(`
    CREATE TABLE IF NOT EXISTS veiculo_fotos (
      id SERIAL PRIMARY KEY,
      veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
      chave TEXT NOT NULL,
      chave_miniatura TEXT,
      largura INTEGER,
      altura INTEGER,
      ordem INTEGER NOT NULL DEFAULT 0,
      capa BOOLEAN NOT NULL DEFAULT FALSE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // ── Custos ──────────────────────────────────────────────────────────────
  // Tudo que o Jair põe DENTRO do carro depois de comprar. É o que separa o
  // lucro de verdade da diferença ingênua entre compra e venda.
  await ddl(`
    CREATE TABLE IF NOT EXISTS veiculo_custos (
      id SERIAL PRIMARY KEY,
      veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
      data DATE NOT NULL DEFAULT CURRENT_DATE,
      categoria TEXT NOT NULL,
      descricao TEXT,
      valor_centavos INTEGER NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // ── Negócios ────────────────────────────────────────────────────────────
  // A venda.
  //
  // `veiculo_id` é UNIQUE de propósito: o banco recusa vender o mesmo carro
  // duas vezes, mesmo que a regra em TypeScript falhe ou alguém chame a função
  // duas vezes por causa de um duplo clique.
  //
  // ON DELETE RESTRICT: não dá pra apagar um veículo que já foi vendido. O
  // histórico financeiro não pode sumir junto com uma faxina de cadastro.
  await ddl(`
    CREATE TABLE IF NOT EXISTS negocios (
      id SERIAL PRIMARY KEY,
      veiculo_id INTEGER NOT NULL UNIQUE REFERENCES veiculos(id) ON DELETE RESTRICT,
      data DATE NOT NULL DEFAULT CURRENT_DATE,
      comprador_nome TEXT,
      comprador_contato TEXT,
      valor_venda_centavos INTEGER NOT NULL,
      forma_pagamento TEXT,
      comissao_recebida_centavos INTEGER,
      veiculo_entrada_id INTEGER REFERENCES veiculos(id) ON DELETE SET NULL,
      valor_avaliado_entrada_centavos INTEGER,
      observacoes TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // ── Índices ─────────────────────────────────────────────────────────────
  // Uma capa por veículo, garantido pelo banco. Sem este índice, dois cliques
  // rápidos em "definir capa" deixam o carro com duas capas e a listagem passa
  // a mostrar uma foto diferente a cada carregamento.
  await ddl(`CREATE UNIQUE INDEX IF NOT EXISTS ix_foto_capa_unica ON veiculo_fotos (veiculo_id) WHERE capa;`)
  await ddl(`CREATE INDEX IF NOT EXISTS ix_veiculos_estado ON veiculos (estado);`)
  await ddl(`CREATE INDEX IF NOT EXISTS ix_veiculos_marca_modelo ON veiculos (marca, modelo);`)
  await ddl(`CREATE INDEX IF NOT EXISTS ix_fotos_veiculo ON veiculo_fotos (veiculo_id, ordem);`)
  await ddl(`CREATE INDEX IF NOT EXISTS ix_custos_veiculo ON veiculo_custos (veiculo_id);`)
  await ddl(`CREATE INDEX IF NOT EXISTS ix_negocios_data ON negocios (data);`)
}

export default sql
