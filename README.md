# Jair Junior Veículos

Vitrine de carros usados, painel privado do Jair e controle financeiro dos negócios.

- **Vitrine pública** — home, estoque com filtros e página do anúncio, com contato direto por WhatsApp.
- **Painel** (`/admin`) — só o Jair entra. Cadastro de veículos, fotos, custos e vendas.
- **Financeiro** — lucro por carro, fechamento do mês, relatório por período e exportação para Excel.

Desenho e decisões: [`docs/superpowers/specs/2026-08-14-site-jair-veiculos-design.md`](docs/superpowers/specs/2026-08-14-site-jair-veiculos-design.md)

## Rodar na sua máquina

Precisa de Node 20+ e um Postgres local.

```bash
npm install
```

Crie o banco:

```bash
createdb jair_veiculos && createdb jair_veiculos_test
```

Copie `.env.local.example` para `.env.local` e preencha. Depois:

```bash
npm run criar-usuario -- "Jair Junior" jair@exemplo.com "uma-senha-forte"
```

```bash
npm run dev
```

Para ver o site com conteúdo, popule com carros de exemplo (só funciona em banco local):

```bash
npm run dados-demo
```

## Testes

```bash
npm test
```

A suíte **se recusa a rodar contra banco remoto**. Ela cria e apaga veículos e vendas — contra produção, apagaria o estoque real. Se `DATABASE_URL` apontar para fora de `localhost`, ela para e explica. A saída de emergência é `PERMITIR_BANCO_REMOTO=1`, e existe só para diagnosticar algo que só acontece em produção.

Os testes preferem `.env.test.local` a `.env.local`, então o banco de teste é sempre outro.

## Publicar no Render

1. Suba o repositório para o GitHub e crie o serviço pelo `render.yaml`.
2. **Crie o bucket na Cloudflare R2** e preencha no painel do Render: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` e `R2_URL_PUBLICA`. Sem isso o serviço sobe e falha na primeira foto.
3. Preencha `DATABASE_URL` com a **URL interna** do banco (a que não tem `.oregon-postgres`).
4. Preencha `NEXT_PUBLIC_URL_SITE` com o endereço final do site.
5. Depois do primeiro deploy, crie o usuário do Jair — pelo Shell do Render:
   ```bash
   npm run criar-usuario -- "Jair Junior" email@dele.com "senha-forte"
   ```

### O que vai morder se for esquecido

**`ARMAZENAMENTO` precisa ser `r2` em produção.** No modo `local` as fotos vão pro disco do container, que é apagado a cada deploy — o site fica com os anúncios sem imagem e ninguém percebe até um cliente reclamar.

Os planos já estão pagos no `render.yaml` (`starter` no web, `basic-256mb` no banco), de propósito: o free hiberna e o Postgres gratuito expira em 90 dias.

## O que fica configurável

O que depende de informação do Jair mora em [`src/lib/config-site.ts`](src/lib/config-site.ts): nome do negócio, WhatsApp, Instagram, telefone e cidade. Trocar ali muda o site inteiro.

## Como o código está organizado

```
src/lib/      regra de negócio, um arquivo por responsabilidade
src/app/      rotas (vitrine pública + /admin)
src/components/  peças de tela
__tests__/    testes da regra de negócio, sem passar pela interface
```

Quatro regras que sustentam o resto — detalhadas em [`AGENTS.md`](AGENTS.md):

1. **Dinheiro é inteiro em centavos.** Nunca ponto flutuante.
2. **A vitrine nunca devolve campo privado.** `src/lib/vitrine.ts` lista as colunas uma a uma; valor de compra e dados do consignante só saem por `src/lib/veiculos.ts`, atrás de sessão.
3. **Toda ação de servidor do painel chama `exigirSessao()` na primeira linha.** Server Action é alcançável por POST direto.
4. **`__tests__` fica fora do `tsconfig.json`.** Se entrar, o build type-checa os testes e o deploy quebra.

## O que ficou de fora, de propósito

Despesas fixas do negócio, contas a receber de venda parcelada pelo próprio Jair, fluxo de caixa diário, banco de leads, múltiplos usuários e integração com Webmotors/OLX. Nada disso está bloqueado — só não foi feito nesta primeira entrega.
