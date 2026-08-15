# Como pôr o site no ar

Roteiro completo, na ordem certa. São quatro partes; a ordem importa porque cada
uma produz um valor que a seguinte pede.

Reserve uns 40 minutos.

---

## Parte 0 — Mandar o código pro GitHub

O Render lê o código do GitHub. Hoje o repositório só existe na sua máquina.

1. Entre no <https://github.com/new>.
2. Nome: `jair-veiculos`. Marque **Private** — o repositório tem a lógica do
   financeiro dele.
3. **Não** marque nada em "Initialize this repository with" (nem README, nem
   .gitignore). O projeto já tem os dois, e marcar cria um conflito na primeira
   subida.
4. Crie e copie a URL que aparece (algo como
   `https://github.com/seu-usuario/jair-veiculos.git`).

Na pasta do projeto:

```bash
git remote add origin https://github.com/SEU-USUARIO/jair-veiculos.git
```

```bash
git push -u origin master
```

> Os arquivos `.env.local` e `.env.test.local` **não sobem** — estão no
> `.gitignore`. É proposital: eles têm a senha do banco.

---

## Parte 1 — Cloudflare R2 (onde as fotos ficam)

No fim desta parte você terá **cinco valores** anotados. Guarde num bloco de
notas; três deles não dá pra ver de novo depois.

### 1.1 Ativar o R2

1. Entre no <https://dash.cloudflare.com/>. Se não tiver conta, crie — é grátis.
2. No menu da esquerda: **Storage & databases → R2 → Overview**.
3. Ele pede pra completar um checkout pra adicionar a assinatura do R2.

> **Sobre cobrança:** a franquia mensal gratuita é de 10 GB de armazenamento,
> 1 milhão de operações de escrita e 10 milhões de leitura — e a saída de dados
> é gratuita, sem teto. As fotos do Jair vão ocupar alguns megabytes. Você não
> vai pagar nada tão cedo. Se o checkout pedir cartão mesmo assim, não é engano
> da sua parte; é como a Cloudflare habilita o serviço.

**Anote o valor 1:** na página do R2, do lado direito em *Account Details*,
aparece o **Account ID**. É um texto longo de letras e números.

### 1.2 Criar o bucket

1. Ainda em **R2**, clique em **Create bucket**.
2. Nome: `jair-veiculos-fotos`.
3. Location: deixe automático.
4. Crie.

**Anote o valor 2:** o nome do bucket, `jair-veiculos-fotos`.

### 1.3 Deixar as fotos acessíveis publicamente

As fotos dos anúncios precisam abrir pra qualquer visitante.

1. Clique no bucket que você acabou de criar.
2. Aba **Settings**.
3. Procure **Public Development URL** e clique em **Enable**.
4. Ele pergunta "Allow Public Access?" — digite `allow` e confirme.
5. Vai aparecer um endereço tipo `https://pub-xxxxxxxx.r2.dev`.

**Anote o valor 3:** esse endereço `https://pub-....r2.dev`, inteiro, com o
`https://` e **sem** barra no fim.

> **Ressalva honesta:** a Cloudflare diz que o endereço `r2.dev` tem limite de
> requisições e é pensado para desenvolvimento. Para o começo do Jair, com
> dezenas de visitas por dia, funciona bem. Quando ele tiver um domínio próprio
> (ex.: `jairjuniorveiculos.com.br`), o certo é trocar por um **Custom Domain**
> aqui mesmo nesta tela — aí ganha cache e proteção, e a troca é só mudar uma
> variável no Render.

### 1.4 Criar a chave de acesso

1. Volte pra tela **R2 → Overview**.
2. Em *Account Details*, ao lado de **API Tokens**, clique em **Manage**.
3. **Create Account API token**.
4. Permissão: **Object Read & Write**.
5. Em *Specify bucket*, escolha só o `jair-veiculos-fotos` — se a chave vazar,
   o estrago fica limitado a esse bucket.
6. Crie.

**Anote os valores 4 e 5:** o **Access Key ID** e o **Secret Access Key**.

> ⚠️ **O Secret Access Key aparece uma única vez.** Se fechar a tela sem copiar,
> não tem como recuperar — só criar outro token. Copie agora.

### Conferência da Parte 1

Você deve ter cinco coisas anotadas:

| # | O quê | Cara do valor |
|---|---|---|
| 1 | Account ID | `a1b2c3d4e5f6...` |
| 2 | Nome do bucket | `jair-veiculos-fotos` |
| 3 | Endereço público | `https://pub-xxxx.r2.dev` |
| 4 | Access Key ID | `f7e8d9...` |
| 5 | Secret Access Key | texto longo, aparece uma vez só |

---

## Parte 2 — Render (onde o site roda)

1. Entre no <https://dashboard.render.com/>.
2. **New → Blueprint**.
3. Escolha o repositório `jair-veiculos` e clique em **Connect**.
   - Se ele não aparecer, clique em *Configure account* e dê acesso ao
     repositório no GitHub.
4. Dê um nome ao Blueprint (`jair-veiculos` serve) e confirme a branch `master`.
5. O Render lê o `render.yaml` e mostra o que vai criar: um serviço web e um
   Postgres, ambos no plano **Free** (custo US$ 0).

   > ⚠️ **O Postgres gratuito expira 30 dias depois de criado**, com mais 14
   > dias de carência antes de o Render apagar. Anote a data no celular agora.
   > Antes do prazo: trocar `plan: free` por `plan: basic-256mb` no
   > `render.yaml`, ou exportar os dados. O serviço web também hiberna após 15
   > min parado e leva ~1 minuto pra acordar.
6. Ele vai pedir os valores das variáveis marcadas como "sync: false". Preencha:

| Variável | O que colocar |
|---|---|
| `R2_ACCOUNT_ID` | valor 1 |
| `R2_BUCKET` | valor 2 (`jair-veiculos-fotos`) |
| `R2_URL_PUBLICA` | valor 3 (o `https://pub-....r2.dev`) |
| `R2_ACCESS_KEY_ID` | valor 4 |
| `R2_SECRET_ACCESS_KEY` | valor 5 |
| `NEXT_PUBLIC_URL_SITE` | `https://jair-veiculos.onrender.com` |
| `DATABASE_URL` | deixe em branco por enquanto — ver abaixo |

7. **Deploy Blueprint**.

### 2.1 Ligar o banco (é aqui que costuma dar errado)

O banco só existe depois que o Blueprint roda. Então:

1. Espere o Postgres aparecer como *Available* no painel.
2. Abra o banco `jair-veiculos-db`.
3. Copie a **Internal Database URL** — a que **não** tem `.oregon-postgres` no
   meio.
4. Vá no serviço web `jair-veiculos` → **Environment** → cole em `DATABASE_URL`.
5. Salve. O Render reinicia sozinho.

> Se colar a *External* no lugar da *Internal*, o site funciona mas cada
> consulta atravessa a internet — fica lento sem motivo e você vai procurar o
> problema no lugar errado.

### 2.2 Conferir o endereço real do site

O Render dá ao serviço o endereço `https://<nome>.onrender.com`. Se o nome
`jair-veiculos` já estiver em uso por outra pessoa, ele acrescenta um sufixo.

1. No topo do serviço web, veja o endereço de verdade.
2. Se for diferente de `https://jair-veiculos.onrender.com`, vá em
   **Environment** e corrija `NEXT_PUBLIC_URL_SITE`.

> Esse valor não é enfeite: ele monta o link que vai **dentro** da mensagem de
> WhatsApp e o cartão de preview quando o Jair cola o anúncio num grupo. Errado,
> o cliente clica e não chega em lugar nenhum — e nada no site parece quebrado,
> o que torna o problema difícil de achar depois.

---

## Parte 3 — Criar o acesso do Jair

O site sobe sem nenhum usuário, de propósito: não existe tela de cadastro.

1. No serviço web, abra a aba **Shell**.
2. Rode, trocando o e-mail e a senha:

```bash
npm run criar-usuario -- "Jair Junior" email-dele@exemplo.com "uma-senha-forte-aqui"
```

Deve responder `Usuário criado`.

> Escolha uma senha longa. Essa é a única porta do painel, e ela fica exposta na
> internet. O sistema bloqueia por 15 minutos depois de 5 tentativas erradas,
> mas isso protege contra força bruta, não contra senha óbvia.
>
> Esse mesmo comando serve pra **trocar a senha** depois: rodar de novo com o
> mesmo e-mail atualiza a senha em vez de dar erro.

---

## Parte 4 — Teste de fumaça (5 minutos, vale muito)

Faça nesta ordem, no celular se possível:

1. Abra o endereço do site. Deve carregar dizendo que não há carros.
2. Entre em `/admin` — deve mandar pro login.
3. Entre com o e-mail e a senha que você criou.
4. **Cadastre um carro de verdade** e suba 3 ou 4 fotos.
   - Se as fotos aparecerem, o R2 está certo. Se der erro, confira as cinco
     variáveis.
5. Publique. Abra o site pelo celular e veja o carro na home.
6. Abra o anúncio e clique no botão de WhatsApp. A mensagem tem que vir pronta,
   com o nome do carro, o preço e o link.
7. **Cole esse link numa conversa de WhatsApp** e veja se aparece o cartão com a
   foto e o preço. É o teste que mais importa: é assim que o Jair vai divulgar.
8. No painel, registre a venda desse carro e confira que ele sumiu do site e que
   o lucro apareceu no painel.
9. Cancele a venda (o carro volta pro site) e apague o carro de teste.

---

## Depois, quando fizer sentido

- **Domínio próprio.** Compre, aponte pra Cloudflare, e então: adicione como
  Custom Domain no serviço do Render, troque `NEXT_PUBLIC_URL_SITE`, e troque o
  `r2.dev` por um Custom Domain no bucket.
- **Google.** O site já gera `sitemap.xml` e `robots.txt`. Cadastre no Google
  Search Console pra os anúncios aparecerem na busca.
