import type { CardOption, ComparisonOffer, SavingsMetric } from '../types'

export const TOP_CARDS: CardOption[] = [
  {
    id: 'amex-blue-cash',
    name: 'Blue Cash Everyday® Card',
    issuer: 'American Express',
    network: 'Amex',
    rewards: ['3% back on U.S. online retail', '3% back at U.S. supermarkets', '3% back at U.S. gas stations'],
    yearlyRewards: 589,
    categoryHighlights: [
      { label: 'Gas stations', value: '3% cashback' },
      { label: 'Online shopping', value: '3% cashback' },
      { label: 'Groceries', value: '3% cashback' },
    ],
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited®',
    issuer: 'Chase',
    network: 'Visa',
    rewards: ['5% on travel through Chase', '3% on dining and drugstores', '1.5% on everything else'],
    yearlyRewards: 470,
    categoryHighlights: [
      { label: 'Dining', value: '3% cashback' },
      { label: 'Travel', value: '5% through Chase' },
      { label: 'Everyday', value: '1.5% cashback' },
    ],
  },
  {
    id: 'citi-diamond-preferred',
    name: 'Citi Diamond Preferred® Card',
    issuer: 'Citi',
    network: 'Mastercard',
    rewards: ['0% intro APR for 21 months', 'Access to Citi Entertainment', 'Contactless tap-to-pay'],
    yearlyRewards: 180,
    categoryHighlights: [
      { label: 'Intro APR', value: '0% for 21 months' },
      { label: 'Entertainment', value: 'Exclusive access' },
      { label: 'Security', value: 'Mastercard ID theft' },
    ],
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred®',
    issuer: 'Chase',
    network: 'Visa',
    rewards: ['5x on travel through Chase', '3x on dining and streaming', '2x on all other travel'],
    yearlyRewards: 615,
    categoryHighlights: [
      { label: 'Dining', value: '3x points' },
      { label: 'Travel', value: '5x through Chase' },
      { label: 'Lyft rides', value: '10x points (2025)' },
    ],
  },
  {
    id: 'capitalone-venture',
    name: 'Capital One VentureOne Rewards',
    issuer: 'Capital One',
    network: 'Visa',
    rewards: ['5x miles on hotels and rental cars', '1.25x miles on everything else', 'No foreign transaction fees'],
    yearlyRewards: 420,
    categoryHighlights: [
      { label: 'Travel', value: '5x via Capital One Travel' },
      { label: 'Everyday', value: '1.25x miles' },
      { label: 'Fees', value: 'No foreign fees' },
    ],
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash® Card',
    issuer: 'Citi',
    network: 'Mastercard',
    rewards: ['1% when you buy + 1% when you pay', 'Automatic cash back', 'No category tracking'],
    yearlyRewards: 360,
    categoryHighlights: [
      { label: 'Every purchase', value: '2% cashback' },
      { label: 'Annual fee', value: '$0' },
      { label: 'Rewards', value: 'Simple cash back' },
    ],
  },
]

export const COMPARISON_OFFERS: ComparisonOffer[] = [
  { cardName: 'Chase Sapphire Preferred®', offer: 'Up to 5x points on travel', estimatedSavings: 52 },
  { cardName: 'Capital One VentureOne', offer: '1.25x miles everywhere', estimatedSavings: 34 },
  { cardName: 'Citi Double Cash®', offer: 'Flat 2% cash back', estimatedSavings: 28 },
]

export const SAVINGS_METRICS: SavingsMetric[] = [
  { label: 'This month', amount: '$72', helper: 'Across 8 purchases' },
  { label: 'Year to date', amount: '$486', helper: 'Projected vs standard cards' },
  { label: 'Lifetime', amount: '$1,820', helper: 'Since installing the plugin' },
]
