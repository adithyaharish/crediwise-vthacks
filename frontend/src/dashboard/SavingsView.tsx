import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  SavingsCard,
  SavingsCategory,
  SavingsSuggestion,
  UserSavingsResponse,
} from '../services/api'

const SURFACE = 'bg-slate-900/80'
const CATEGORY_COLORS = ['#34d399', '#38bdf8', '#f472b6', '#fbbf24', '#c084fc']
const SUMMARY_COLORS = ['#34d399', '#38bdf8', '#fbbf24']

type SavingsViewProps = {
  onBack: () => void
  savings: UserSavingsResponse | null
  error?: string | null
}

function SavingsView({ onBack, savings, error }: SavingsViewProps) {
  const timeSeries = useMemo(() => savings?.savingsOverTime ?? [], [savings])
  const categories = useMemo(() => savings?.categoryBreakdown ?? [], [savings])
  const cards = useMemo(() => savings?.cardBreakdown ?? [], [savings])
  const suggestions = useMemo(() => savings?.smartSuggestions ?? [], [savings])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Savings summary</h2>
          <p className="mt-2 text-sm text-slate-400">
            Track how much you’ve saved by following the best-card recommendations.
          </p>
          {savings && (
            <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
              {[
                {
                  label: 'Total savings to date',
                  value: `$${savings.totalSavings.toFixed(2)}`,
                  accent: SUMMARY_COLORS[0],
                },
                {
                  label: 'Average per checkout',
                  value: `$${savings.averagePerCheckout.toFixed(2)}`,
                  accent: SUMMARY_COLORS[1],
                },
                {
                  label: 'Checkouts tracked',
                  value: `${timeSeries.length}`,
                  accent: SUMMARY_COLORS[2],
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border p-4 shadow-[0_12px_28px_rgba(8,47,73,0.4)]"
                  style={{
                    borderColor: metric.accent,
                    background: `linear-gradient(135deg, ${metric.accent}33, rgba(9, 13, 22, 0.9))`,
                  }}
                >
                  <p
                    className="text-xs uppercase tracking-wide"
                    style={{ color: metric.accent }}
                  >
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onBack}
          className="rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500 hover:text-slate-950"
        >
          Back to dashboard
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.12),transparent_60%)]`}>
        <h3 className="text-lg font-semibold text-white">Daily savings</h3>
        <p className="mt-2 text-sm text-slate-400">Recent savings captured each checkout (last {timeSeries.length} days).</p>
        <div className="mt-4 h-64">
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ left: 8, right: 8, top: 16, bottom: 0 }}>
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Savings']}
                />
                <Area type="monotone" dataKey="savings" stroke="#34d399" strokeWidth={2.5} fill="url(#savingsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
              No savings recorded yet.
            </div>
          )}
        </div>
      </section>

      <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_60%)]`}>
        <h3 className="text-lg font-semibold text-white">Savings by category</h3>
        <p className="mt-2 text-sm text-slate-400">Where you’ve earned the most in the last few checkouts.</p>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="flex items-center justify-center">
            <div className="h-64 w-64">
              {categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="percentage"
                      nameKey="category"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      labelLine={false}
                    >
                      {categories.map((entry, index) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgb(210, 211, 213)', border: '1px solidrgb(219, 220, 222)', borderRadius: 12, color: '#e2e8f0' }}
                      formatter={(value: number, _: string, payload) => [
                        `${(value as number * 100).toFixed(0)}%`,
                        payload.payload.category,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
                  No category breakdown available yet.
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {categories.map((item: SavingsCategory, index) => (
              <div key={`${item.category}-${index}`} className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{item.category}</p>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{(item.percentage * 100).toFixed(0)}%</span>
                </div>
                <p className="mt-1 text-slate-300">${item.amount.toFixed(2)}</p>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(4, item.percentage * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.12),transparent_60%)]`}>
        <h3 className="text-lg font-semibold text-white">Per-card savings</h3>
        <p className="mt-2 text-sm text-slate-400">Which cards have delivered the most value so far.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {cards.map((card: SavingsCard, index) => {
            const accent = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            return (
              <div
                key={card.card}
                className="rounded-2xl border bg-slate-950/70 p-4 text-sm shadow-[0_10px_30px_rgba(8,47,73,0.35)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(52,211,153,0.18)]"
                style={{ borderColor: accent, background: `linear-gradient(135deg, ${accent}22, #0b1120 70%)` }}
              >
                <p className="text-xs uppercase tracking-wide" style={{ color: accent }}>
                  {card.card}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">${card.amount.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-200">{card.checkouts} checkouts optimized</p>
              </div>
            )
          })}
          {cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-500">
              No per-card data yet.
            </div>
          )}
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_60%)]`}>
          <h3 className="text-lg font-semibold text-white">Smart suggestions</h3>
          <p className="mt-2 text-sm text-slate-400">Actionable tips to boost your next few checkouts.</p>
          <div className="mt-4 space-y-3 text-sm text-slate-200">
            {suggestions.map((tip: SavingsSuggestion, index) => (
              <div key={`${tip.message}-${index}`} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="font-semibold text-white">{tip.message}</p>
                {tip.category && (
                  <p className="mt-1 text-xs uppercase tracking-wide text-emerald-300">{tip.category}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default SavingsView
