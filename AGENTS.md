<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Este projeto

Site de venda de carros do Jair Junior: vitrine pública, painel privado dele e controle financeiro.

Leia `docs/superpowers/specs/2026-08-14-site-jair-veiculos-design.md` antes de mexer em regra de negócio.

## Regras que não se negociam

- **Dinheiro é `INTEGER` em centavos.** Nunca float, nunca `NUMERIC` no código.
- **A vitrine pública nunca devolve campo privado.** Valor de compra, dados do
  consignante e comissão só saem por funções de `src/lib/veiculos.ts`, atrás de
  sessão. `src/lib/vitrine.ts` lista as colunas uma a uma — nada de `SELECT *`.
- **Toda ação de servidor do painel chama `exigirSessao()` na primeira linha.**
  Ação de servidor é alcançável por POST direto; o redirecionamento do proxy
  não protege ela.
- **`__tests__` fica fora do `tsconfig.json`.** Se entrar, o `next build`
  type-checa os testes e o deploy quebra no Render.
- **Os testes rodam contra Postgres local.** A suíte se recusa a rodar contra
  banco remoto (`jest.setup-global.ts`).
