import { useCallback, useMemo } from 'react'
import type { CardOption } from '../types'

const SURFACE = 'bg-slate-900/80'
const ACCENT = 'text-emerald-400'

const SUGGESTED_CARD_IDS = ['amex-blue-cash', 'chase-sapphire-preferred']

type CardSetupViewProps = {
  selectedCards: CardOption[]
  onToggleCard: (card: CardOption) => void
  onContinue: () => void
  availableCards?: CardOption[]
}

function CardSetupView({
  selectedCards,
  onToggleCard,
  onContinue,
  availableCards = [],
}: CardSetupViewProps) {
  const suggestedCards = useMemo(
    () => availableCards.filter((card) => SUGGESTED_CARD_IDS.includes(card.id)),
    [availableCards],
  )

  const handleToggle = useCallback(
    (card: CardOption) => () => {
      onToggleCard(card)
    },
    [onToggleCard],
  )

  return (
    <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
      <section className={`${SURFACE} relative overflow-hidden rounded-3xl border border-slate-800/60 p-8 shadow-xl before:pointer-events-none before:absolute before:inset-0 before:-z-0 before:bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.18),transparent_55%)]`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className={`${ACCENT} text-sm font-medium uppercase tracking-wide`}>Step 2</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Add your cards</h2>
          </div>
          <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-200">
            {selectedCards.length} saved
          </span>
        </div>

        <div className="mb-6">
          <label className="sr-only" htmlFor="card-search">
            Search cards
          </label>
          <input
            id="card-search"
            type="text"
            placeholder="Search for your card"
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
          />
        </div>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Top picks</span>
            <span>{availableCards.length} cards</span>
          </div>

          <div className="space-y-4">
            {availableCards.length === 0 && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-800/40"></div>
                ))}
              </div>
            )}

            {availableCards.map((card) => {
              const isSelected = selectedCards.some((item) => item.id === card.id)
              return (
                <article
                  key={card.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-950/60 px-4 py-3 shadow-[0_10px_30px_rgba(14,164,122,0.08)]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{card.name}</p>
                    <p className="text-xs text-slate-500">{card.issuer} • {card.network}</p>
                  </div>
                  <button
                    onClick={handleToggle(card)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-emerald-400 text-emerald-200 hover:bg-emerald-500/10'
                    }`}
                  >
                    {isSelected ? 'Added' : '+ Add'}
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onContinue}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            Go to dashboard
          </button>
        </div>
      </section>

      <aside className={`${SURFACE} hidden flex-col rounded-3xl border border-slate-800/60 p-6 shadow-xl md:flex`}>
        <p className="text-sm font-medium text-slate-300">Your wallet</p>
        <p className="mt-2 text-xs text-slate-500">Added cards appear here with category highlights.</p>

        <div className="mt-6 space-y-4">
          {selectedCards.length === 0 && availableCards.length > 0 && (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-xs text-slate-600">
              No cards yet
            </div>
          )}

          {selectedCards.map((card) => (
            <article key={card.id} className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4 text-sm">
              <h3 className="text-base font-semibold text-white">{card.name}</h3>
              <p className="text-xs text-slate-500">{card.issuer} • {card.network}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                {card.categoryHighlights.map((highlight) => (
                  <li key={highlight.label} className="flex justify-between">
                    <span>{highlight.label}</span>
                    <span className="text-emerald-300">{highlight.value}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested by Cardwise</p>
          <div className="mt-3 space-y-3">
            {suggestedCards.map((card) => (
              <button
                key={card.id}
                onClick={handleToggle(card)}
                className="w-full rounded-2xl border border-slate-800/60 bg-slate-950/60 px-4 py-3 text-left text-xs text-slate-300 transition hover:border-emerald-400 hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{card.name}</span>
                  <span className="text-emerald-300">Tap to add</span>
                </div>
                <p className="mt-1 text-[0.65rem] text-slate-500">Based on your saved rewards</p>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}

export default CardSetupView
