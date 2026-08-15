import { Cabecalho } from '@/components/Cabecalho'
import { Rodape } from '@/components/Rodape'

// Casca comum das páginas institucionais (financiamento, vender, contato).
// Elas existem porque a nav do handoff aponta pra elas — link de menu que dá
// 404 é pior do que menu curto.
export default function LayoutInstitucional({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-[70ch] px-4 py-8">{children}</main>
      <Rodape />
    </>
  )
}
