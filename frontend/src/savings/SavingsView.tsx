import { useEffect, useState } from 'react'
import type { SavingsMetric } from '../types'
import { fetchSavingsSummary } from '../services/api'

const SURFACE = 'bg-slate-900/80'

const SavingsView = () => {
  const [metrics, setMetrics] = useState<SavingsMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await fetchSavingsSummary()
        setMetrics(data)
      } catch (err) {
        setError('Failed to fetch savings summary')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && metrics.length === 0) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (metrics.length === 0) {
    return <div className="text-center py-8">No savings data available.</div>
  }

  return (
    <div className="container mx-auto p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Savings summary</h2>
          <p className="mt-2 text-sm text-slate-400">
            Review your cumulative savings and projected value over time.
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500 hover:text-slate-950"
        >
          Back to dashboard
        </button>
      </header>

      <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.12),transparent_60%)]`}>
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 text-center shadow-[0_8px_24px_rgba(8,47,73,0.35)]">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{metric.amount}</p>
              <p className="mt-2 text-xs text-slate-500">{metric.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_60%)]`}>
        <h3 className="text-lg font-semibold text-white">Projected milestones</h3>
        <p className="mt-2 text-sm text-slate-400">
          Estimate how much you could save by sticking with your optimized card mix.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-5 shadow-[0_10px_30px_rgba(8,47,73,0.35)]">
            <p className="text-xs uppercase tracking-wide text-slate-500">90 days</p>
            <p className="mt-3 text-2xl font-semibold text-white">+$210</p>
            <p className="mt-2 text-xs text-slate-500">Assuming your current average checkout volume.</p>
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-5 shadow-[0_10px_30px_rgba(8,47,73,0.35)]">
            <p className="text-xs uppercase tracking-wide text-slate-500">12 months</p>
            <p className="mt-3 text-2xl font-semibold text-white">+$1,020</p>
            <p className="mt-2 text-xs text-slate-500">Targets cumulative rewards against standard cards.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SavingsView
