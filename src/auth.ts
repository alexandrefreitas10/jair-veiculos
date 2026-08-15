import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { buscarPorEmail, conferirSenha, normalizarEmail } from '@/lib/usuarios'
import { conferirBloqueio, registrarFalha, limparTentativas } from '@/lib/limite-tentativas'

class BloqueadoPorTentativas extends CredentialsSignin {
  code = 'bloqueado'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Atrás do proxy do Render. Sem isto o next-auth v5 recusa o login fora da
  // Vercel, com um erro de host não confiável que não explica nada.
  trustHost: true,

  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credenciais) {
        if (!credenciais?.email || !credenciais?.senha) return null
        const email = normalizarEmail(credenciais.email as string)

        if (conferirBloqueio(email).bloqueado) throw new BloqueadoPorTentativas()

        const usuario = await buscarPorEmail(email)
        if (!usuario) {
          // Conta a falha mesmo para e-mail que não existe: sem isso, dá pra
          // descobrir quais e-mails são válidos só olhando quem é bloqueado.
          registrarFalha(email)
          return null
        }

        if (!(await conferirSenha(usuario, credenciais.senha as string))) {
          if (registrarFalha(email).bloqueado) throw new BloqueadoPorTentativas()
          return null
        }

        limparTentativas(email)
        return { id: String(usuario.id), name: usuario.nome, email: usuario.email }
      },
    }),
  ],

  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },

  // Nome de cookie próprio, em vez do padrão `authjs.session-token`.
  //
  // Cookie não distingue porta: para o navegador, `localhost:3000` e
  // `localhost:54539` são o MESMO site. Com o nome padrão, este app e qualquer
  // outro projeto Next rodando na mesma máquina disputam a mesma chave — e
  // como cada um assina com o seu próprio AUTH_SECRET, o último a gravar
  // derruba a sessão do outro. O sintoma é cruel: você entra, navega, e de
  // repente uma tela qualquer pede senha de novo, sem padrão aparente.
  //
  // Em produção cada app tem seu domínio e isso não aconteceria. É um problema
  // de desenvolvimento — e é em desenvolvimento que ele custa a tarde de
  // alguém procurando bug onde não tem.
  cookies: {
    sessionToken: {
      name: 'jair-veiculos.sessao',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
})
