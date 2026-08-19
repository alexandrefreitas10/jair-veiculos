import type { NextConfig } from 'next'

// Cabeçalhos de segurança, mesmos do Run Coach.
//
// Não há Content-Security-Policy completa de propósito: o Next injeta scripts
// inline e uma CSP restritiva exigiria nonce por requisição. Mal configurada,
// quebra a aplicação inteira em produção. `frame-ancestors` é a única diretiva
// segura de aplicar sozinha.
const cabecalhosDeSeguranca = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Ninguém embute o site num iframe. Anúncio de carro clonado dentro de um
  // iframe alheio é golpe conhecido: a vítima acha que está falando com o Jair.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // O navegador não "adivinha" o tipo do conteúdo — upload não vira script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), payment=(), usb=(), microphone=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,

  experimental: {
    serverActions: {
      // O padrão do Next é 1 MB, e foto de celular tem de 3 a 8 MB. Com o
      // padrão, o envio de foto morria ANTES de chegar no meu código: o
      // framework recusava a requisição e o navegador mostrava a página de
      // erro do servidor, sem chance de exibir a mensagem preparada.
      //
      // 6 MB e não mais: o navegador já reduz cada foto para ~1600px antes de
      // enviar (ver EnviarFotos.tsx), e cada requisição carrega UMA foto. Esse
      // teto é rede de segurança, não a via normal — o servidor no Render tem
      // 512 MB de memória, e um limite generoso aqui vira porta para derrubar
      // o site enviando arquivos grandes de propósito.
      bodySizeLimit: '6mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: cabecalhosDeSeguranca }]
  },
}

export default nextConfig
