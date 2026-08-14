# Site do Jair Junior — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a vitrine pública de carros, o painel privado do Jair e o financeiro com painel e relatórios, rodando local e pronto para o Render.

**Architecture:** Next.js App Router. Regra de negócio isolada em `src/lib`, testada sem passar pela interface. O veículo é o centro: custos penduram nele, o negócio (venda) aponta para ele, e a troca cria o veículo de entrada. Consulta pública e consulta privada são funções diferentes, com colunas listadas uma a uma.

**Tech Stack:** Next.js 16.2.7, React 19.2.4, TypeScript, Tailwind v4, `postgres` (porsager), next-auth v5, bcryptjs, sharp, @aws-sdk/client-s3 (R2), Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-08-14-site-jair-veiculos-design.md`

---

## Estrutura de arquivos

### Configuração
| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `tsconfig.json` | Dependências e compilação. `__tests__` **fora** do tsconfig (senão o type-check quebra o build no Render) |
| `next.config.ts` | Cabeçalhos de segurança |
| `jest.config.ts`, `jest.setup-global.ts` | Suíte + trava contra banco remoto |
| `render.yaml` | Deploy |
| `.env.local`, `.env.test.local` | Segredos locais (fora do git) |

### `src/lib` — regra de negócio, um arquivo por responsabilidade
| Arquivo | Responsabilidade |
|---|---|
| `db.ts` | Conexão e migrações idempotentes |
| `dinheiro.ts` | Centavos: converter, formatar, somar |
| `config-site.ts` | Nome do negócio, WhatsApp, Instagram — o que o Jair ainda vai informar |
| `veiculos-tipos.ts` | Tipos e listas fixas (câmbio, combustível, categorias de custo, estados) |
| `veiculos.ts` | CRUD privado do veículo |
| `vitrine.ts` | **Só** consultas públicas. Colunas listadas uma a uma |
| `slug.ts` | Gera o slug da URL |
| `fotos.ts` | Registro das fotos no banco, ordem e capa |
| `armazenamento.ts` | Interface de arquivo + driver `local` e driver `r2` |
| `imagem.ts` | Redimensiona e converte para WebP (sharp) |
| `custos.ts` | Lançamentos de custo do veículo |
| `negocios.ts` | Registrar venda, incluindo troca e consignação |
| `lucro.ts` | Cálculo de lucro. Função pura, sem banco |
| `financeiro.ts` | Agregações do painel e dos relatórios |
| `periodo.ts` | Datas em horário de Brasília (UTC−3) |

### `src/app`
| Rota | Responsabilidade |
|---|---|
| `page.tsx` | Home da vitrine |
| `carros/page.tsx` | Lista com filtros na URL |
| `carros/[slug]/page.tsx` | Anúncio + `generateMetadata` para o preview de link |
| `sitemap.ts`, `robots.ts` | Indexação |
| `login/page.tsx` | Entrada do Jair |
| `admin/page.tsx` | Painel financeiro |
| `admin/veiculos/...` | Lista, criação, edição, fotos, custos |
| `admin/negocios/...` | Registrar e listar vendas |
| `admin/relatorios/page.tsx` | Relatório por período + CSV |
| `api/auth/[...nextauth]/route.ts` | next-auth |
| `api/fotos/[chave]/route.ts` | Serve foto quando o driver é `local` |

---

## Task 1: Esqueleto e banco

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `jest.config.ts`, `jest.setup-global.ts`, `src/lib/db.ts`, `.gitignore`

- [ ] **Step 1: Criar o projeto e instalar as dependências**

```bash
cd C:/Users/alexa/jair-veiculos
npm install next@16.2.7 react@19.2.4 react-dom@19.2.4 postgres bcryptjs next-auth@5.0.0-beta.31 sharp @aws-sdk/client-s3 recharts
npm install -D typescript @types/node @types/react @types/react-dom @types/bcryptjs tailwindcss@4 @tailwindcss/postcss jest@30 ts-jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: `tsconfig.json` excluindo os testes**

O `exclude` precisa conter `__tests__`, `jest.config.ts` e `jest.setup*.ts`. Sem isso o `next build` type-checa os testes, não acha `@types/jest` em produção e o deploy quebra.

- [ ] **Step 3: `src/lib/db.ts` com as cinco tabelas**

SSL ligado para host remoto, desligado para localhost. Migração memoizada por processo. `ddl()` silencia só código de "objeto já existe" (`42701`, `42P07`, `42710`, `42P16`); qualquer outro erro derruba o boot.

Tabelas: `usuarios`, `veiculos`, `veiculo_fotos`, `veiculo_custos`, `negocios`. Todo valor em dinheiro é `INTEGER` (centavos).

- [ ] **Step 4: Trava de banco remoto nos testes**

`jest.setup-global.ts` lê `DATABASE_URL`; se o host não for localhost, lança erro explicando como rodar local. Escape: `PERMITIR_BANCO_REMOTO=1`.

- [ ] **Step 5: Verificar que o schema sobe**

Run: `npm test -- __tests__/lib/db.test.ts`
Expected: PASS — as cinco tabelas existem.

- [ ] **Step 6: Commit**

---

## Task 2: Dinheiro e lucro (funções puras, sem banco)

**Files:** `src/lib/dinheiro.ts`, `src/lib/lucro.ts`, `__tests__/lib/lucro.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

```ts
import { calcularLucro } from '@/lib/lucro'

test('carro proprio: venda menos compra menos custos', () => {
  const r = calcularLucro({
    origem: 'proprio',
    valorCompra: 5_000_000,        // R$ 50.000
    custos: [800_00, 1_200_00],    // R$ 800 + R$ 1.200
    valorVenda: 6_200_000,         // R$ 62.000
    comissaoRecebida: null,
  })
  expect(r.lucro).toBe(1_000_000)  // R$ 10.000
})

test('consignado: so a comissao menos o que ele bancou', () => {
  const r = calcularLucro({
    origem: 'consignado',
    valorCompra: null,
    custos: [300_00],
    valorVenda: 6_200_000,
    comissaoRecebida: 300_000,     // R$ 3.000
  })
  expect(r.lucro).toBe(270_000)    // R$ 2.700
})

test('consignado nao conta o valor da venda como receita dele', () => {
  const r = calcularLucro({
    origem: 'consignado', valorCompra: null, custos: [],
    valorVenda: 10_000_000, comissaoRecebida: 500_000,
  })
  expect(r.lucro).toBe(500_000)
})

test('prejuizo aparece como negativo, nao como zero', () => {
  const r = calcularLucro({
    origem: 'proprio', valorCompra: 6_000_000, custos: [500_00],
    valorVenda: 5_800_000, comissaoRecebida: null,
  })
  expect(r.lucro).toBe(-250_000)   // -R$ 2.500
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test -- lucro` → FAIL, módulo não existe.

- [ ] **Step 3: Implementar `calcularLucro`**

Retorna `{ receita, custoTotal, lucro, margem }`. Em consignado a receita é a comissão, nunca o valor da venda — esse é o erro que faria o faturamento do Jair parecer dez vezes maior do que é. Margem sobre a receita; quando a receita é zero, margem é `null` (não `NaN`, não zero).

- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit.**

---

## Task 3: Separação público × privado

**Files:** `src/lib/vitrine.ts`, `src/lib/veiculos.ts`, `__tests__/lib/vitrine.test.ts`

Esta é a tarefa que impede vazar o valor de compra. O teste vale mais que o código.

- [ ] **Step 1: Escrever o teste que falha**

```ts
const PROIBIDO = [
  'valor_compra', 'valorCompra',
  'consignante_nome', 'consignanteNome',
  'consignante_contato', 'consignanteContato',
  'comissao_valor', 'comissaoValor',
]

test('carro da vitrine nao carrega nenhum campo privado', async () => {
  const id = await criarVeiculo({ /* ...com valorCompra: 5_000_000... */ })
  await publicar(id)
  const lista = await listarVitrine({})
  const bruto = JSON.stringify(lista)
  for (const campo of PROIBIDO) expect(bruto).not.toContain(campo)
  expect(bruto).not.toContain('5000000')
})

test('carro em rascunho, vendido ou arquivado nao aparece na vitrine', async () => { /* ... */ })
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar `vitrine.ts` com as colunas listadas uma a uma.** Nenhum `SELECT *`. O filtro de estado (`disponivel`, `reservado`) fica dentro da função, não na chamada.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit.**

---

## Task 4: Login do Jair

**Files:** `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/page.tsx`, `scripts/criar-usuario.ts`, `__tests__/lib/auth.test.ts`

- [ ] **Step 1: Teste** — senha errada não autentica; senha certa autentica; hash bcrypt nunca sai em resposta.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.** next-auth v5, provider de credenciais, `trustHost: true` (sem isso o login falha atrás do proxy do Render). Sessão em JWT.
- [ ] **Step 4: Script de seed** que cria o usuário do Jair pedindo e-mail e senha.
- [ ] **Step 5: Rodar e ver passar. Commit.**

---

## Task 5: Guarda das rotas do painel

**Files:** `src/proxy.ts`, `src/lib/sessao.ts`, `__tests__/lib/sessao.test.ts`

- [ ] **Step 1: Teste** — `exigirSessao()` lança quando não há sessão.
- [ ] **Step 2: Implementar.** Duas camadas: o proxy redireciona a navegação para `/login`, e **toda ação de servidor chama `exigirSessao()` na primeira linha** — ação de servidor é alcançável por POST direto, o redirecionamento do proxy não protege ela.
- [ ] **Step 3: Commit.**

---

## Task 6: Veículos, fotos e custos

**Files:** `src/lib/veiculos-tipos.ts`, `src/lib/slug.ts`, `src/lib/armazenamento.ts`, `src/lib/imagem.ts`, `src/lib/fotos.ts`, `src/lib/custos.ts`, testes correspondentes

- [ ] **Step 1: Testes** — slug único mesmo com dois carros iguais; foto de capa é única por veículo; remover a capa promove a próxima; custo entra em centavos.
- [ ] **Step 2: Implementar `armazenamento.ts`** com a interface `{ salvar, apagar, urlPublica }` e dois drivers. `local` grava em `.uploads/` e serve por `/api/fotos/[chave]`; `r2` usa o SDK da S3. Escolhido por `ARMAZENAMENTO=local|r2`.
- [ ] **Step 3: Implementar `imagem.ts`** — sharp gera WebP de 1600px (anúncio) e 400px (listagem). Sem isso a página não abre no 4G.
- [ ] **Step 4: Rodar os testes. Commit.**

---

## Task 7: Negócios, incluindo a troca

**Files:** `src/lib/negocios.ts`, `__tests__/lib/negocios.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

```ts
test('registrar a venda marca o veiculo como vendido e tira da vitrine', async () => {
  const id = await criarVeiculo({ origem: 'proprio', valorCompra: 5_000_000 })
  await publicar(id)
  await registrarNegocio({ veiculoId: id, valorVenda: 6_000_000, /* ... */ })
  expect((await buscarVeiculo(id)).estado).toBe('vendido')
  expect(await listarVitrine({})).toHaveLength(0)
})

test('troca cria o veiculo de entrada como rascunho com o custo avaliado', async () => {
  const vendido = await criarVeiculo({ origem: 'proprio', valorCompra: 5_000_000 })
  const { veiculoEntradaId } = await registrarNegocio({
    veiculoId: vendido,
    valorVenda: 6_000_000,
    entrada: { marca: 'Fiat', modelo: 'Argo', anoModelo: 2019, valorAvaliado: 4_000_000 },
  })
  const entrada = await buscarVeiculo(veiculoEntradaId!)
  expect(entrada.estado).toBe('rascunho')       // ele ainda vai fotografar
  expect(entrada.valorCompra).toBe(4_000_000)   // custo real de aquisicao
  expect(entrada.origem).toBe('proprio')
})

test('vender o mesmo carro duas vezes e recusado', async () => { /* ... */ })
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.** Venda e criação do veículo de entrada **na mesma transação** — se a criação do carro de entrada falhar, a venda não pode ficar registrada sozinha.
- [ ] **Step 4: Rodar e ver passar. Commit.**

---

## Task 8: Financeiro — painel e relatórios

**Files:** `src/lib/periodo.ts`, `src/lib/financeiro.ts`, `__tests__/lib/financeiro.test.ts`

- [ ] **Step 1: Testes** — venda registrada às 22h de Brasília (01h UTC do dia seguinte) cai no dia certo do relatório; estoque soma compra + custos; tempo de giro conta da entrada até a venda; mês sem venda devolve zero, não erro.
- [ ] **Step 2: Implementar `periodo.ts`** convertendo a fronteira do dia para UTC−3.
- [ ] **Step 3: Implementar `financeiro.ts`** — resumo do mês, série de 12 meses, lucro por carro, carros parados.
- [ ] **Step 4: Rodar e ver passar. Commit.**

---

## Task 9: Vitrine pública

**Files:** `src/app/page.tsx`, `src/app/carros/page.tsx`, `src/app/carros/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/components/*`, `src/lib/config-site.ts`

- [ ] **Step 1: Home** — busca, destaques, últimos, faixas de preço.
- [ ] **Step 2: Lista** — filtros lidos de `searchParams` e escritos na URL, para ele mandar link filtrado.
- [ ] **Step 3: Anúncio** — galeria, ficha, selos, WhatsApp fixo no rodapé no celular com o link do anúncio na mensagem.
- [ ] **Step 4: `generateMetadata`** com título, descrição e imagem de capa — é o card que aparece quando ele cola o link no WhatsApp.
- [ ] **Step 5: sitemap e robots. Commit.**

---

## Task 10: Painel do Jair

**Files:** `src/app/admin/**`, `src/components/admin/*`

- [ ] **Step 1: Painel** com os cartões e o gráfico de 12 meses.
- [ ] **Step 2: Lista de veículos** com filtro por estado.
- [ ] **Step 3: Formulário do veículo** em quatro blocos, salvando como rascunho e publicando por ação separada.
- [ ] **Step 4: Fotos** — upload múltiplo, reordenar, definir capa.
- [ ] **Step 5: Custos** por veículo.
- [ ] **Step 6: Registrar venda**, com o bloco de troca aparecendo só quando marcado.
- [ ] **Step 7: Relatórios** com período e exportação CSV.
- [ ] **Step 8: Commit.**

---

## Task 11: Fechamento

- [ ] **Step 1:** `npm test` inteiro verde.
- [ ] **Step 2:** `npm run build` sem erro de type-check.
- [ ] **Step 3:** Subir o app local, cadastrar um carro de ponta a ponta, registrar uma venda com troca e conferir o painel.
- [ ] **Step 4:** `render.yaml`, `README.md` com o passo a passo do deploy e da conta R2.
- [ ] **Step 5:** Commit final.

---

## Verificação de cobertura do spec

| Requisito do spec | Tarefa |
|---|---|
| Cinco tabelas, dinheiro em centavos | 1 |
| Lucro nos três tipos de negócio | 2 |
| Nada privado na vitrine | 3 |
| Login só do Jair | 4, 5 |
| Slug, fotos em WebP, armazenamento trocável, custos | 6 |
| Venda muda estado; troca cria veículo de entrada | 7 |
| Painel, relatórios, fuso de Brasília, CSV | 8, 10 |
| Home, filtros na URL, anúncio, WhatsApp, preview de link, sitemap | 9 |
| Formulário em quatro blocos, rascunho antes de publicar | 10 |
| Testes verdes, build limpo, render.yaml | 11 |
