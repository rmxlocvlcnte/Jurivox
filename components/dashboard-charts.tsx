'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface ProcessosMesData {
  mes: string
  civil: number
  criminal: number
  trabalhista: number
  tributario: number
  previdenciario: number
  outro: number
}

interface HorasData {
  semana: string
  horas: number
}

export function GraficoIndicadoresAnuais({ dados }: { dados: ProcessosMesData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={dados} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px' }}
          formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
        />
        <Line type="monotone" dataKey="civil" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="tributario" stroke="#ef4444" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="trabalhista" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="criminal" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="previdenciario" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function GraficoHorasSemanais({ dados }: { dados: HorasData[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={dados} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(v) => [`${v ?? 0}h`, 'Horas']}
        />
        <Bar dataKey="horas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
