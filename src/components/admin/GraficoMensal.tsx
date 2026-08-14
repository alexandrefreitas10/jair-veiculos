'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatarReaisCurto } from '@/lib/dinheiro'

type Ponto = { chave: string; rotulo: string; vendas: number; receita: number; lucro: number }

// Barra por mês, com prejuízo em vermelho.
//
// Escolhi barra e não linha porque cada mês é uma quantidade fechada, não uma
// medição contínua — linha entre dois meses sugere que existiu um valor no
// meio do caminho, e não existiu.

export function GraficoMensal({ dados }: { dados: Ponto[] }) {
  const temMovimento = dados.some((d) => d.lucro !== 0 || d.vendas > 0)

  if (!temMovimento) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-grafite-700">
        <p className="text-sm text-grafite-500">Ainda não há vendas registradas.</p>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c2f39" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fill: '#747986', fontSize: 12 }}
            axisLine={{ stroke: '#2c2f39' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#747986', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v: number) => formatarReaisCurto(v).replace('R$', '').trim()}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{
              background: '#1c1e26',
              border: '1px solid #2c2f39',
              borderRadius: 10,
              fontSize: 13,
            }}
            labelStyle={{ color: '#a0a4ae' }}
            // A assinatura do recharts entrega o valor como possivelmente
            // indefinido; converter aqui evita "R$ NaN" na dica do gráfico.
            formatter={(valor) => [formatarReaisCurto(Number(valor ?? 0)), 'Lucro']}
          />
          <Bar dataKey="lucro" radius={[4, 4, 0, 0]}>
            {dados.map((d) => (
              <Cell key={d.chave} fill={d.lucro < 0 ? '#f87171' : '#f9840f'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
