'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const CORES = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']

// ── Gráfico de Faturamento Mensal ──────────────────────────────
export function GraficoFaturamento({ dados }: {
  dados: { mes: string; honorarios: number; recebido: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="honorarios" name="Honorários" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="recebido" name="Recebido" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Gráfico de Processos por Advogado ─────────────────────────
export function GraficoAdvogados({ dados }: {
  dados: { nome: string; processos: number; prazos: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis dataKey="nome" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={100} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="processos" name="Processos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="prazos" name="Prazos pendentes" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Gráfico de Processos por Área ─────────────────────────────
export function GraficoAreasPizza({ dados }: {
  dados: { area: string; total: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={dados}
          dataKey="total"
          nameKey="area"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ area, percent }) =>
            percent > 0.05 ? `${area} (${(percent * 100).toFixed(0)}%)` : ''
          }
          labelLine={false}
        >
          {dados.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => `${v} processos`}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Gráfico de Evolução de Horas ──────────────────────────────
export function GraficoHorasMensais({ dados }: {
  dados: { mes: string; horas: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={dados} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          formatter={(v: number) => `${v}h`}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Line type="monotone" dataKey="horas" name="Horas trabalhadas"
          stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
