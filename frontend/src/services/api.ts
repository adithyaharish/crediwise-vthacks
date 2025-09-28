import type {
  AuthUser,
  CardOption,
  ComparisonOffer,
  SavingsMetric,
} from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'https://crediwise-backend.onrender.com'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (typeof data?.message === 'string') {
        message = data.message
      }
    } catch (error) {
      // ignore parse errors, fallback to default message
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function loginUser(
  email: string,
  firstName: string,
  lastName: string,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, firstName, lastName }),
  })

  return handleResponse<AuthUser>(response)
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function fetchCards(): Promise<CardOption[]> {
  const response = await fetch(`${API_BASE_URL}/cards`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await handleResponse<{ cards: CardOption[] }>(response)
  return data.cards
}

export async function fetchComparisonOffers(): Promise<ComparisonOffer[]> {
  const response = await fetch(`${API_BASE_URL}/cards/comparison`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await handleResponse<{ offers: ComparisonOffer[] }>(response)
  return data.offers
}

export async function fetchSavingsSummary(): Promise<SavingsMetric[]> {
  const response = await fetch(`${API_BASE_URL}/savings`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await handleResponse<{ summary: SavingsMetric[] }>(response)
  return data.summary
}

export async function fetchCardSelections(userId: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/cards`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await handleResponse<{ cardIds: string[] }>(response)
  return data.cardIds
}

export async function saveCardSelection(userId: string, cardIds: string[]): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ cardIds }),
  })

  const data = await handleResponse<{ cardIds: string[] }>(response)
  return data.cardIds
}

export type CheckoutCardInsight = {
  name: string
  rewards: number | null
  netBenefit: number | null
  ratePercent: string | null
  checkoutTotal: number | null
  category: string | null
  lossVsBest?: number | null
  rank?: number | null
}

export type CheckoutPreview = {
  token: string
  website: string | null
  amount: number | null
  category: string | null
  summaryText: string
  generatedAt: string
  bestCard: CheckoutCardInsight | null
  otherCards: CheckoutCardInsight[]
}

type CheckoutRecommendationServer = {
  token: string
  domain: string | null
  url: string | null
  summary?: {
    message?: string
    bestCard?: unknown
    domain?: string | null
    generatedAt?: string
  }
  payload?: {
    domain?: string | null
    generatedAt?: string
    bestCard?: unknown
    comparison?: unknown
    url?: string | null
    raw?: unknown
  }
}

type RawRecommendationPayload = {
  website?: string
  amount?: number
  category?: string
  best_card?: Record<string, unknown>
  other_cards?: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}

const toCardInsight = (value: Record<string, unknown> | undefined): CheckoutCardInsight | null => {
  if (!value) return null
  const base = {
    name: typeof value.name === 'string' ? value.name : 'Recommended card',
    rewards: typeof value.rewards === 'number' ? value.rewards : null,
    netBenefit: typeof value.net_benefit === 'number' ? value.net_benefit : null,
    ratePercent: typeof value.rate_percent === 'string' ? value.rate_percent : null,
    checkoutTotal: typeof value.checkout_total === 'number' ? value.checkout_total : null,
    category: typeof value.category === 'string' ? value.category : null,
    lossVsBest: typeof value.loss_vs_best === 'number' ? value.loss_vs_best : null,
    rank: typeof value.rank === 'number' ? value.rank : null,
  }
  return base
}

export async function fetchCheckoutRecommendation(token: string): Promise<CheckoutPreview> {
  const response = await fetch(`${API_BASE_URL}/checkout/${token}`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await handleResponse<CheckoutRecommendationServer>(response)

  const raw = (data.payload?.raw ?? {}) as RawRecommendationPayload
  const bestCard = toCardInsight(raw.best_card)
  const otherCardsRaw = Array.isArray(raw.other_cards) ? raw.other_cards : []
  const otherCards = otherCardsRaw
    .map((item) => toCardInsight(item))
    .filter((card): card is CheckoutCardInsight => Boolean(card))

  const summaryText =
    (typeof data.summary?.message === 'string' && data.summary?.message) ||
    (typeof raw.summary?.best_card_savings === 'number'
      ? `Best card saves ${raw.summary.best_card_savings.toFixed(2)}`
      : 'We detected a checkout page.')

  const generatedAt = data.summary?.generatedAt ?? new Date().toISOString()

  return {
    token: data.token,
    website: raw.website ?? data.domain ?? null,
    amount: typeof raw.amount === 'number' ? raw.amount : null,
    category: raw.category ?? null,
    summaryText,
    generatedAt,
    bestCard,
    otherCards,
  }
}

export type SavingsTimePoint = {
  period: string
  savings: number
}

export type SavingsCategory = {
  category: string
  percentage: number
  amount: number
}

export type SavingsCard = {
  card: string
  amount: number
  checkouts: number
}

export type SavingsSuggestion = {
  message: string
  category?: string
}

export type UserSavingsResponse = {
  totalSavings: number
  averagePerCheckout: number
  savingsOverTime: SavingsTimePoint[]
  categoryBreakdown: SavingsCategory[]
  cardBreakdown: SavingsCard[]
  smartSuggestions: SavingsSuggestion[]
}

export async function fetchUserSavings(userId: string): Promise<UserSavingsResponse> {
  const response = await fetch(`${API_BASE_URL}/savings?user_id=${encodeURIComponent(userId)}`, {
    method: 'GET',
    credentials: 'include',
  })

  return handleResponse<UserSavingsResponse>(response)
}
