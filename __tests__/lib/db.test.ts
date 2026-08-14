import sql, { initSchema } from '@/lib/db'

const rodar = process.env.DATABASE_URL ? describe : describe.skip

rodar('schema', () => {
  beforeAll(async () => {
    await initSchema()
  })

  test('as cinco tabelas existem', async () => {
    const linhas = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `
    const tabelas = linhas.map((l) => l.table_name)
    for (const t of ['usuarios', 'veiculos', 'veiculo_fotos', 'veiculo_custos', 'negocios']) {
      expect(tabelas).toContain(t)
    }
  })

  test('todo campo de dinheiro é inteiro, nunca ponto flutuante', async () => {
    // Se alguém trocar uma dessas colunas por NUMERIC ou DOUBLE PRECISION, o
    // relatório passa a fechar com um centavo de diferença que ninguém explica.
    const colunas = await sql<{ table_name: string; column_name: string; data_type: string }[]>`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (column_name LIKE '%centavos%' OR column_name LIKE '%_bps')
    `
    expect(colunas.length).toBeGreaterThan(0)
    for (const c of colunas) {
      expect(`${c.table_name}.${c.column_name}=${c.data_type}`).toBe(
        `${c.table_name}.${c.column_name}=integer`,
      )
    }
  })

  test('o banco recusa vender o mesmo veículo duas vezes', async () => {
    // A regra também existe em TypeScript, mas o banco é a última linha: um
    // duplo clique no botão de salvar dispara duas vezes a mesma ação.
    const restricao = await sql<{ contype: string }[]>`
      SELECT c.contype::text
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
      WHERE t.relname = 'negocios' AND a.attname = 'veiculo_id' AND c.contype = 'u'
    `
    expect(restricao).toHaveLength(1)
  })

  test('um veículo não pode ter duas fotos de capa', async () => {
    const indice = await sql<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'veiculo_fotos' AND indexname = 'ix_foto_capa_unica'
    `
    expect(indice).toHaveLength(1)
  })
})
