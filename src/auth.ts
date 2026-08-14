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
