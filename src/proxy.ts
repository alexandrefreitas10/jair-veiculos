import { auth } from './auth'
import { NextResponse } from 'next/server'

// Este site é o contrário do normal: quase tudo é PÚBLICO (é uma vitrine, o
// objetivo é que estranhos entrem) e só `/admin` é fechado. Por isso a regra
// aqui é uma lista curta do que se protege, e não uma lista longa do que se
// libera — inverter isso deixaria a vitrine atrás de login por engano no dia
// em que alguém criasse uma rota nova.
//
// Isto é só a camada de navegação. A proteção que vale é `exigirSessao()`
// dentro de cada ação de servidor (ver src/lib/sessao.ts).
export default auth((req) => {
  const { pathname } = req.nextUrl
  const precisaDeSessao = pathname === '/admin' || pathname.startsWith('/admin/')

  if (!precisaDeSessao) return NextResponse.next()
  if (req.auth) return NextResponse.next()

  const destino = new URL('/login', req.url)
  // Depois de entrar, volta pra onde ele queria ir.
  destino.searchParams.set('voltar', pathname)
  return NextResponse.redirect(destino)
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
