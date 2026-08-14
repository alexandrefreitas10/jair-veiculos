'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export type EstadoLogin = { erro: string | null }

export async function entrar(_anterior: EstadoLogin, formulario: FormData): Promise<EstadoLogin> {
  const email = String(formulario.get('email') ?? '')
  const senha = String(formulario.get('senha') ?? '')
  const voltar = String(formulario.get('voltar') ?? '/admin')

  if (!email || !senha) return { erro: 'Preencha e-mail e senha.' }

  // Só aceita caminho interno. Sem isso, /login?voltar=https://site-falso.com
  // mandaria o Jair pra fora logo depois de digitar a senha — e o endereço
  // ainda pareceria legítimo, porque o link partiu do site dele.
  const destino = voltar.startsWith('/') && !voltar.startsWith('//') ? voltar : '/admin'

  try {
    await signIn('credentials', { email, senha, redirectTo: destino })
  } catch (err) {
    // signIn sinaliza o redirecionamento por exceção; ela PRECISA subir, senão
    // o login dá certo e o navegador não sai do lugar.
    if (err instanceof AuthError) {
      if (err.type === 'CredentialsSignin' && (err as { code?: string }).code === 'bloqueado') {
        return { erro: 'Muitas tentativas. Espere 15 minutos e tente de novo.' }
      }
      return { erro: 'E-mail ou senha incorretos.' }
    }
    throw err
  }

  return { erro: null }
}
