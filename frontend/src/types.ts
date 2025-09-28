export type AppView = 'login' | 'card-setup' | 'dashboard' | 'savings'

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
}

export type CardOption = {
  id: string
  name: string
  issuer: string
  network: string
  rewards: string[]
  yearlyRewards: number
  categoryHighlights: { label: string; value: string }[]
}

export type ComparisonOffer = {
  cardName: string
  offer: string
  estimatedSavings: number
}

export type SavingsMetric = {
  label: string
  amount: string
  helper: string
}
