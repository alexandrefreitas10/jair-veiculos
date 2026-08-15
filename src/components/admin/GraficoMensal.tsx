'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatarReaisCurto } from '@/lib/dinheiro'

type Ponto = { chave: string; rotulo: string; vendas: number; receita: number; lucro: number }

// Barra por mês, com prejuízo em vermelho.
//
// Barra e não linha porque cada mês é uma quantidade fechada, não uma medição
// contínua — a linha entre dois meses sugere que existiu um valor no meio do
// caminho, e não existiu.

// Cores do design system. Ficam aqui como literais porque o recharts escreve
// os valores direto no SVG e não lê variável CSS.
const DOURADO = '#b68235'
const VERMELHO = '#b91c1c'
const HAIRLINE = '#d7d3d3'
const TEXTO_FRACO = '#7d7979'

export function GraficoMensal({ dados }: { dados: Ponto[] }) {
  const temMovimento = dados.some((d) => d.lucro !== 0 || d.vendas > 0)

  if (!temMovimento) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-divider)]">
        <p className="m-0 text-[13px] text-muted">Ainda não há vendas registradas.</p>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={HAIRLINE} vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fill: TEXTO_FRACO, fontSize: 12 }}
            axisLine={{ stroke: HAIRLINE }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: TEXTO_FRACO, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v: number) => formatarReaisCurto(v).replace('R$', '').trim()}
          />
          <Tooltip
            cursor={{ fill: 'rgba(32,31,29,0.04)' }}
            contentStyle={{
              background: '#f3f2f2',
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 4,
              fontSize: 13,
            }}
            labelStyle={{ color: TEXTO_FRACO }}
            // A assinatura do recharts entrega o valor como possivelmente
            // indefinido; converter aqui evita "R$ NaN" na dica do gráfico.
            formatter={(valor) => [formatarReaisCurto(Number(valor ?? 0)), 'Lucro']}
          />
          <Bar dataKey="lucro" radius={[2, 2, 0, 0]}>
            {dados.map((d) => (
              <Cell key={d.chave} fill={d.lucro < 0 ? VERMELHO : DOURADO} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
