import { useEffect, useState } from 'react'
import type { CardOption, ComparisonOffer } from '../types'
import { fetchComparisonOffers, type CheckoutPreview } from '../services/api'

const SURFACE = 'bg-slate-900/80'

const BEST_CARD_PLACEHOLDER_TEXT =
  'We’ll surface the top card and savings details once data is available.'

type DashboardViewProps = {
  selectedCards: CardOption[]
  onReset: () => void
  onOpenSavings: () => void
  checkoutPreview?: CheckoutPreview | null
  previewLoading?: boolean
  previewError?: string | null
}

function DashboardView({
  selectedCards,
  onReset,
  onOpenSavings,
  checkoutPreview,
  previewLoading = false,
  previewError = null,
}: DashboardViewProps) {
  const [comparison, setComparison] = useState<ComparisonOffer[]>([])

  useEffect(() => {
    if (checkoutPreview?.otherCards?.length) {
      const mapped = checkoutPreview.otherCards.map((card) => ({
        cardName: card.name,
        offer: card.ratePercent ? `${card.ratePercent} rewards` : 'Standard rewards',
        estimatedSavings: card.netBenefit ?? 0,
      }))
      setComparison(mapped)
      return
    }
    if (selectedCards.length > 1) {
      const mapped = selectedCards.slice(1, 4).map((card) => ({
        cardName: card.name,
        offer: card.rewards?.[0] ?? 'Standard rewards',
        estimatedSavings: 0,
      }))
      setComparison(mapped)
      return
    }
    fetchComparisonOffers().then(setComparison)
  }, [checkoutPreview, selectedCards])

  const isPreview = Boolean(checkoutPreview)
  const previewBest = checkoutPreview?.bestCard ?? null
  const headerMessage = checkoutPreview?.summaryText ??
    'See the best card to use right now and how other cards would compare.'
  const domainLabel = checkoutPreview?.website
  const purchaseAmount = checkoutPreview?.amount
  const fallbackCard = selectedCards[0] ?? null

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Checkout recommendation</h2>
          <p className="mt-2 text-sm text-slate-400">{headerMessage}</p>
          {domainLabel && (
            <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              {`Recommendation for ${domainLabel}`}
            </p>
          )}
          {purchaseAmount !== null && (
            <p className="mt-1 text-sm text-slate-300">
              Checkout total ~ ${purchaseAmount?.toFixed(2)}
            </p>
          )}
        </div>
        {!checkoutPreview && (
          <button
            onClick={onOpenSavings}
            className="rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500 hover:text-slate-950"
          >
            Savings summary
          </button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.15),transparent_55%)]`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Best card recommendation</h3>
              <p className="mt-2 text-sm text-slate-400">
                {previewBest?.name
                  ? `Use ${previewBest.name} for the highest projected savings.`
                  : BEST_CARD_PLACEHOLDER_TEXT}
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-200">
              {checkoutPreview ? 'Preview mode' : `${selectedCards.length} cards active`}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/10 bg-slate-950/60 p-6 shadow-[0_12px_32px_rgba(8,47,73,0.45)]">
            {previewLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-5 animate-pulse rounded bg-slate-800/60"></div>
                ))}
              </div>
            ) : previewError ? (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                Failed to load recommendation. {previewError}
              </div>
            ) : isPreview && previewBest ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-white">{previewBest.name}</p>
                  <p className="text-sm text-slate-300">
                    Checkout total ~ ${previewBest.checkoutTotal?.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2 text-base text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                    Rate Percentage : {previewBest.ratePercent ?? 'Rewards info pending'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                    Category : {previewBest.category}
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-4 text-base">
                  <p className="text-xs uppercase tracking-wide text-emerald-300">Net Benefit Approx.</p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {typeof previewBest.netBenefit === 'number'
                      ? `$${previewBest.netBenefit.toFixed(2)}`
                      : '—'}
                  </p>
                </div>
              </div>
            ) : fallbackCard ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">{fallbackCard.name}</p>
                  <p className="text-xs text-slate-400">
                    {fallbackCard.issuer} • {fallbackCard.network}
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {fallbackCard.rewards?.map((reward) => (
                    <li key={reward} className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span>{reward}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-emerald-300">Estimated yearly rewards</p>
                  <p className="mt-2 text-2xl font-semibold text-white">—</p>
                </div>
              </div>
            ) : (
              <div className="h-48 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60"></div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-6 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_60%)]`}>
            <h3 className="text-lg font-semibold text-white">Comparison</h3>
            <p className="mt-2 text-sm text-slate-400">Review how alternative cards would perform.</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {comparison.map((offer) => (
                <article key={offer.cardName} className="rounded-2xl border border-slate-800/60 bg-slate-950/60 px-4 py-3 shadow-[0_8px_24px_rgba(8,47,73,0.35)]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{offer.cardName}</span>
                    <span className="text-emerald-300">{offer.offer}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Estimated savings ${offer.estimatedSavings}</p>
                </article>
              ))}

              {comparison.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-3">
                  Waiting for card data
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {!checkoutPreview && (
        <div>
          <button
            onClick={onReset}
            className="mt-6 inline-flex items-center rounded-xl border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500 hover:text-slate-950"
          >
            Manage cards
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardView
