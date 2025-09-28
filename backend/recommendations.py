from __future__ import annotations

from typing import Optional

_DOMAIN_CONFIGS = [
  {
    'domains': ['amazon.com', 'www.amazon.com'],
    'website': 'Amazon',
    'category': 'Online Retail',
    'default_amount': 269.99,
    'best_index': 0,
    'cards': [
      {'name': 'Blue Cash Everyday®', 'rate': 0.03},
      {'name': 'Citi Double Cash®', 'rate': 0.02},
      {'name': 'Chase Freedom Unlimited®', 'rate': 0.015},
    ],
  },
  {
    'domains': ['dominos.com', 'order.dominos.com', 'www.dominos.com'],
    'website': "Domino's",
    'category': 'Dining & Takeout',
    'default_amount': 8.99,
    'best_index': 1,
    'cards': [
      {'name': 'Blue Cash Everyday®', 'rate': 0.02},
      {'name': 'Chase Freedom Unlimited®', 'rate': 0.03},
      {'name': 'Citi Double Cash®', 'rate': 0.02},
    ],
  },
  {
    'domains': ['wayfair.com', 'www.wayfair.com'],
    'website': 'Wayfair',
    'category': 'Home Goods & Furniture',
    'default_amount': 24.99,
    'best_index': 2,
    'cards': [
      {'name': 'Blue Cash Everyday®', 'rate': 0.01},
      {'name': 'Chase Freedom Unlimited®', 'rate': 0.015},
      {'name': 'Citi Double Cash®', 'rate': 0.02},
    ],
  },
]

_DOMAIN_MAP: dict[str, dict] = {}
for config in _DOMAIN_CONFIGS:
  for domain in config['domains']:
    _DOMAIN_MAP[domain] = config

_DEFAULT_CONFIG = _DOMAIN_CONFIGS[0]


def _rate_to_percent(rate: float) -> str:
  return f"{rate * 100:.1f}%"


def build_checkout_recommendation(domain: Optional[str], amount: Optional[float]) -> dict:
  normalized_domain = (domain or 'amazon.com').strip().lower()
  config = _DOMAIN_MAP.get(normalized_domain, _DEFAULT_CONFIG)

  purchase_amount = float(amount) if amount is not None else config['default_amount']

  computed = []
  for card in config['cards']:
    rewards_value = round(purchase_amount * card['rate'], 2)
    net_benefit = rewards_value
    computed.append({
      'name': card['name'],
      'rewards_value': rewards_value,
      'net_benefit': net_benefit,
      'rate_percent': _rate_to_percent(card['rate']),
    })

  best_index = config['best_index']
  best_card_raw = computed[best_index]
  best_card = {
    'name': best_card_raw['name'],
    'rewards': best_card_raw['rewards_value'],
    'net_benefit': best_card_raw['net_benefit'],
    'rate_percent': best_card_raw['rate_percent'],
    'checkout_total': purchase_amount,
    'category': config['category'],
  }

  other_cards = []
  rank = 1
  for idx, card in enumerate(computed):
    if idx == best_index:
      continue
    loss_vs_best = round(best_card_raw['net_benefit'] - card['net_benefit'], 2)
    other_cards.append({
      'rank': rank,
      'name': card['name'],
      'rewards': card['rewards_value'],
      'net_benefit': card['net_benefit'],
      'rate_percent': card['rate_percent'],
      'loss_vs_best': loss_vs_best,
    })
    rank += 1

  worst_net = min((card['net_benefit'] for card in other_cards), default=best_card['net_benefit'])

  summary = {
    'best_card_savings': best_card['net_benefit'],
    'difference_best_worst': round(best_card['net_benefit'] - worst_net, 2),
  }

  return {
    'website': config['website'],
    'amount': purchase_amount,
    'category': config['category'],
    'best_card': best_card,
    'other_cards': other_cards,
    'summary': summary,
  }
