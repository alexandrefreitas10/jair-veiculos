# Site do Jair Junior — vitrine de carros + painel + financeiro

Data: 2026-08-14
Status: aprovado (seções 1 e 2 pelo Alexandre; 3 a 5 decididas por mim com ele ausente, sujeitas a revisão)

## O problema

Jair Junior vende carros por conta própria. Ele precisa de três coisas:

1. Uma vitrine na internet, no padrão Webmotors/OLX, para mostrar os carros que tem à venda.
2. Um lugar só dele para cadastrar esses carros, com login e senha.
3. Controle financeiro de cada negócio, com painel e relatórios.

Hoje ele não tem nenhuma das três.

## Restrições que moldam o desenho

- **Um usuário só.** Sem equipe, sem permissões, sem multiempresa.
- **Operação pequena:** até ~10 carros em estoque, 2 a 5 vendas por mês. Isso derruba qualquer argumento por arquitetura elaborada.
- **Três formas de negócio:** carro próprio (compra e revende), consignado (comissão) e troca (entra carro como parte do pagamento).
- **Celular primeiro.** Comprador de carro pesquisa no celular; o Jair cadastra do celular.
- **Nenhum documento pessoal publicado.** CRLV tem CPF, nome e endereço do dono. Só selos de status.

## Decisões e o que foi descartado

| Decisão | Por quê | O que foi descartado |
|---|---|---|
| O veículo é o centro do financeiro | Lucro por carro sai por construção, não por soma manual | Livro-caixa com "carro relacionado" opcional (um esquecimento e o número mente); contabilidade de dupla entrada (exagero) |
| Contato por WhatsApp, sem banco de leads | Ele já vive no WhatsApp; formulário vira caixa de entrada esquecida | Formulário de lead, CRM |
| Selos documentais, sem imagem de documento | LGPD e risco de clonagem do anúncio | Publicar foto do CRLV |
| Sem despesas fixas na primeira versão | Ele pediu lucro por carro + fechamento do mês | Fluxo de caixa dia a dia, contas a pagar |
| Armazenamento de foto atrás de uma interface | Roda hoje em disco local, sem conta na Cloudflare; vira R2 trocando variável de ambiente | Acoplar direto no SDK da AWS |

## 1. Modelo de dados

Dinheiro **sempre em centavos inteiros**. Nunca float.

### `usuarios`
Só o Jair. `email`, `senha_hash` (bcrypt), `nome`. Criado por script de seed — não existe tela de cadastro.

### `veiculos`
O registro central, com três blocos de campos:

- **Público (é o anúncio):** marca, modelo, versão, ano de fabricação, ano do modelo, km, câmbio, combustível, cor, portas, carroceria, final da placa, opcionais, preço, aceita troca, descrição.
- **Selos documentais (público, sem imagem):** IPVA pago, licenciamento em dia, sem multas, sem débitos, laudo cautelar OK, único dono, chave reserva, manual, revisões em dia.
- **Privado (nunca sai em resposta pública):** origem (`proprio` | `consignado`), valor de compra, nome/contato do consignante, comissão combinada (percentual sobre a venda **ou** valor fixo) e data de entrada no estoque.

Estado: `rascunho` → `disponivel` → `reservado` → `vendido` → `arquivado`.
Só `disponivel` e `reservado` aparecem na vitrine.

Cada veículo tem um `slug` para a URL: `/carros/chevrolet-onix-lt-2020-a3f9`.

### `veiculo_fotos`
Chave do arquivo no armazenamento, ordem de exibição, qual é a capa.

### `veiculo_custos` (privado)
Data, categoria (funilaria, mecânica, documentação, pneus, lavagem, transporte, outros), descrição, valor.

### `negocios`
A venda. Aponta para o veículo vendido, data, comprador (nome e telefone), valor da venda, forma de pagamento e — se houve troca — qual veículo entrou e por quanto foi avaliado. Em consignado, a comissão recebida.

### Regras que o código garante

1. **Registrar o negócio marca o veículo como `vendido`** e o tira da vitrine. Uma ação só; o Jair não atualiza dois lugares.
2. **Troca cria o veículo de entrada automaticamente**, como `rascunho`, com valor de compra igual ao valor avaliado. É isso que faz o lucro dos dois negócios fechar certo.
3. **Lucro** — próprio: `venda − compra − custos`. Consignado: `comissão − custos bancados por ele`.
4. **Público e privado separados no acesso ao banco:** a consulta da vitrine lista as colunas uma a uma. Nunca `SELECT *`. Valor de compra não vaza por acidente.

## 2. Vitrine pública

- **`/`** — busca, carros em destaque, últimos anunciados, atalhos por faixa de preço.
- **`/carros`** — filtros de marca, modelo, ano, faixa de preço, km, câmbio e combustível; ordenação por mais recente, menor preço, maior preço e menor km. **Filtros na URL**, para ele mandar link já filtrado pelo WhatsApp.
- **`/carros/[slug]`** — galeria, preço em destaque, ficha técnica, selos documentais, descrição.

Botão de WhatsApp **fixo no rodapé no celular**, com mensagem pronta incluindo o link do anúncio — ele recebe várias conversas por dia e precisa saber de qual carro é.

**Preview de link:** cada anúncio gera título, descrição e imagem própria no compartilhamento. Ao colar no WhatsApp ou Instagram, aparece o card com foto e preço. Mais `sitemap.xml` e `robots.txt`.

Fotos entram em WebP, versão leve na listagem e maior no anúncio. Foto de celular tem 5 MB; crua, a página não abre no 4G do cliente.

## 3. Painel do Jair (`/admin`)

Protegido por login. Nenhuma rota `/admin` responde sem sessão — verificado tanto na navegação quanto dentro de cada ação de servidor, porque ação de servidor é alcançável por POST direto.

- **`/admin`** — o painel financeiro (seção 4).
- **`/admin/veiculos`** — todos os carros, inclusive rascunho e vendido, com filtro por estado.
- **`/admin/veiculos/novo`** e **`/admin/veiculos/[id]`** — formulário em quatro blocos: dados do veículo, fotos, documentação (selos) e o bloco privado (origem, compra, consignante). O formulário salva como `rascunho` e só publica quando ele mandar — assim ele pode cadastrar pela metade sem o carro aparecer torto na vitrine.
- **`/admin/veiculos/[id]/custos`** — lançar gasto no carro.
- **`/admin/negocios/novo`** — registrar a venda. É o formulário mais importante: escolhe o carro, valor, comprador, forma de pagamento e, se houve troca, os dados do carro que entrou.
- **`/admin/negocios`** — vendas registradas.
- **`/admin/relatorios`** — período, lucro por carro, exportação.

**Upload de fotos:** ele seleciona várias do celular; o servidor redimensiona com `sharp` para WebP (uma versão de ~1600px e uma miniatura de ~400px), permite reordenar e definir a capa.

## 4. Financeiro

**Painel (`/admin`):**
- Estoque atual: quantos carros e quanto de capital está parado neles (compra + custos).
- Vendas do mês: quantidade e faturamento.
- Lucro do mês.
- Margem média.
- Tempo médio de giro (dias entre entrada e venda).
- Gráfico de lucro e vendas por mês, últimos 12 meses.
- Carros parados há mais tempo — o que mais dói no bolso de quem revende.

**Relatórios (`/admin/relatorios`):** filtro por período, tabela de lucro por carro vendido (compra, custos, venda, lucro, margem, dias em estoque) e exportação em CSV para ele abrir no Excel.

Fusos: as datas de filtro usam o horário de Brasília (UTC−3), com o banco em UTC. Sem isso, venda registrada à noite cai no dia seguinte no relatório.

## 5. Stack, estrutura e testes

Mesma base do Run Coach, porque o Alexandre já conhece as armadilhas dela:

- Next.js 16.2.7 (App Router), React 19.2.4, TypeScript, Tailwind v4
- `postgres` (porsager) direto, sem ORM
- next-auth v5 (beta) com credenciais e bcrypt
- `sharp` para imagem, `@aws-sdk/client-s3` para o R2
- Jest com `ts-jest`

**Estrutura:** `src/app` (rotas), `src/lib` (regra de negócio, uma responsabilidade por arquivo), `src/components`.
A regra de negócio fica em `src/lib` e é testada sem passar pela interface.

**Armazenamento de arquivo atrás de uma interface** (`src/lib/armazenamento.ts`) com dois drivers: `local` (disco, para desenvolvimento) e `r2`. Escolhido por variável de ambiente. Roda hoje sem conta na Cloudflare.

**Migrações idempotentes no boot**, como no Run Coach: `CREATE TABLE IF NOT EXISTS`, erro de "já existe" silenciado, qualquer outro erro derruba o boot.

**Testes** contra Postgres **local**, com a mesma trava do Run Coach: se `DATABASE_URL` apontar para host remoto, a suíte se recusa a rodar. Cobrem:
- cálculo de lucro nos três tipos de negócio;
- a troca criando o veículo de entrada com o custo certo;
- a venda mudando o estado do veículo e tirando ele da vitrine;
- **a consulta pública não devolvendo campo privado** — esse é o teste que impede um vazamento de valor de compra;
- rotas `/admin` recusando quem não está logado.

`__tests__` fora do `tsconfig`, senão o type-check do build quebra no deploy.

**Deploy:** `render.yaml` para Render (web + Postgres), `DATABASE_URL` e segredos preenchidos no painel, `npm ci` no build. `AUTH_TRUST_HOST` ligado — sem isso o next-auth v5 recusa o login atrás do proxy do Render.

## Pendências do Jair (não bloqueiam)

Ficam num arquivo só, `src/lib/config-site.ts`, para trocar em uma linha:
- nome do negócio (provisório: "Jair Junior Veículos")
- número do WhatsApp
- Instagram e telefone, se houver
- cidade/região de atuação

## Fora de escopo nesta entrega

Despesas fixas do negócio, contas a receber de venda parcelada por ele, fluxo de caixa diário, banco de leads, múltiplos usuários, integração com Webmotors/OLX, financiamento e simulação de parcelas.
