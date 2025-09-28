from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import Client, create_client

from recommendations import build_checkout_recommendation

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
  raise RuntimeError("Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "crediwise-one.vercel.app")], supports_credentials=True)


def response_error(resp: Any) -> Any:
  return getattr(resp, "error", None)


def response_data(resp: Any) -> List[Dict[str, Any]]:
  data = getattr(resp, "data", None)
  if data is None:
    return []
  if isinstance(data, list):
    return data
  return [data]


def map_user(row: Dict[str, Any]) -> Dict[str, Any]:
  return {
    "id": row.get("id"),
    "email": row.get("email"),
    "firstName": row.get("first_name"),
    "lastName": row.get("last_name"),
  }


def parse_highlights(value: Any) -> List[Dict[str, Any]]:
  if isinstance(value, list):
    return value
  if isinstance(value, str):
    try:
      parsed = json.loads(value)
      return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
      return []
  return []


def map_card(row: Dict[str, Any]) -> Dict[str, Any]:
  yearly_rewards = row.get("yearly_rewards")
  if yearly_rewards is not None:
    try:
      yearly_rewards = int(yearly_rewards)
    except (ValueError, TypeError):
      yearly_rewards = 0

  return {
    "id": row.get("id"),
    "name": row.get("name"),
    "issuer": row.get("issuer"),
    "network": row.get("network"),
    "rewards": row.get("rewards", []),
    "yearlyRewards": yearly_rewards,
    "categoryHighlights": parse_highlights(row.get("category_highlights")),
  }


def map_comparison_offer(row: Dict[str, Any]) -> Dict[str, Any]:
  estimated = row.get("estimated_savings")
  if estimated is not None:
    try:
      estimated = float(estimated)
    except (ValueError, TypeError):
      estimated = 0.0

  return {
    "cardName": row.get("card_name"),
    "offer": row.get("offer"),
    "estimatedSavings": estimated,
  }


def map_savings_metric(row: Dict[str, Any]) -> Dict[str, Any]:
  return {
    "label": row.get("label"),
    "amount": row.get("amount"),
    "helper": row.get("helper"),
  }


@app.get("/health")
def health() -> tuple[Dict[str, str], int]:
  return {"status": "ok"}, 200


@app.post("/checkout")
def checkout_insight():
  payload = request.get_json(force=True, silent=True) or {}
  domain = payload.get("domain")
  url = payload.get("url")
  amount = payload.get("amount")

  print(f"Domain: {domain}")

  recommendation = build_checkout_recommendation(domain, amount)
  best_card = recommendation.get('best_card')
  other_cards = recommendation.get('other_cards', [])

  generated_at = datetime.now(timezone.utc).isoformat()
  summary_message = recommendation.get('summary', {}).get('best_card_savings')
  summary_text = (
    f"{best_card['name']} looks best for {domain}."
    if best_card and domain
    else f"{best_card['name']} looks best for this checkout."
    if best_card
    else 'We detected a checkout page.'
  )

  summary = {
    'message': summary_text,
    'bestCard': best_card,
    'domain': domain,
    'generatedAt': generated_at,
  }

  payload_detail = {
    'domain': domain,
    'generatedAt': generated_at,
    'bestCard': best_card,
    'comparison': [
      {
        'cardName': card['name'],
        'offer': f"{card['rate_percent']} back",
        'estimatedSavings': card['net_benefit'],
      }
      for card in other_cards
    ],
    'raw': recommendation,
  }

  record = {
    "domain": domain,
    "url": url,
    "summary": summary,
    "payload": payload_detail,
  }

  insert_resp = supabase.table("checkout_recommendations").insert(record).execute()
  if response_error(insert_resp):
    app.logger.error("Failed to store checkout recommendation: %s", response_error(insert_resp))
    return {"message": "Failed to store recommendation"}, 500

  inserted_rows = response_data(insert_resp)
  token = inserted_rows[0].get("token") if inserted_rows else None
  if not token:
    fetch_resp = (
      supabase.table("checkout_recommendations")
      .select("token")
      .order("created_at", desc=True)
      .limit(1)
      .execute()
    )
    if response_error(fetch_resp) or not response_data(fetch_resp):
      app.logger.error("Failed to retrieve token after insert: %s", response_error(fetch_resp))
      return {"message": "Failed to store recommendation"}, 500
    token = response_data(fetch_resp)[0].get("token")

  summary_response = {
    "token": str(token) if token is not None else None,
    "summary": summary,
  }

  return jsonify(summary_response)


@app.get("/checkout/<token>")
def get_checkout_detail(token: str):
  lookup = supabase.table("checkout_recommendations").select("*").eq("token", token).limit(1).execute()
  if response_error(lookup):
    app.logger.error("Failed to fetch checkout recommendation: %s", response_error(lookup))
    return {"message": "Failed to fetch recommendation"}, 500

  rows = response_data(lookup)
  if not rows:
    return {"message": "Recommendation not found"}, 404

  row = rows[0]
  return jsonify(
    {
      "token": row.get("token"),
      "domain": row.get("domain"),
      "url": row.get("url"),
      "summary": row.get("summary"),
      "payload": row.get("payload"),
    }
  )


@app.post("/login")
def login():
  payload = request.get_json(force=True, silent=True) or {}
  email = (payload.get("email") or "").strip().lower()
  first_name = (payload.get("firstName") or "").strip()
  last_name = (payload.get("lastName") or "").strip()

  if not email or not first_name or not last_name:
    return {"message": "Missing required fields"}, 400

  existing = supabase.table("users").select("id,email,first_name,last_name").eq("email", email).execute()
  if response_error(existing):
    app.logger.error("Failed to fetch user: %s", response_error(existing))
    return {"message": "Failed to fetch user"}, 500

  data = response_data(existing)
  if data:
    return jsonify(map_user(data[0]))

  created = supabase.table("users").insert({"email": email, "first_name": first_name, "last_name": last_name}).execute()
  if response_error(created):
    app.logger.error("Failed to create user: %s", response_error(created))
    return {"message": "Failed to create user"}, 500

  created_rows = response_data(created)
  if created_rows:
    return jsonify(map_user(created_rows[0]))

  fetched = supabase.table("users").select("id,email,first_name,last_name").eq("email", email).execute()
  if response_error(fetched) or not response_data(fetched):
    app.logger.error("Failed to fetch inserted user: %s", response_error(fetched))
    return {"message": "Failed to create user"}, 500

  return jsonify(map_user(response_data(fetched)[0]))


@app.post("/logout")
def logout():
  return {"message": "Logged out"}, 200


@app.get("/cards")
def get_cards():
  response = supabase.table("cards").select("*").order("name").execute()
  if response_error(response):
    app.logger.error("Failed to fetch cards: %s", response_error(response))
    return {"message": "Failed to fetch cards"}, 500

  cards = [map_card(row) for row in response_data(response)]
  return jsonify({"cards": cards})


@app.get("/cards/comparison")
def get_comparison():
  response = supabase.table("comparison_offers").select("*").execute()
  if response_error(response):
    app.logger.error("Failed to fetch comparison offers: %s", response_error(response))
    return {"message": "Failed to fetch comparison offers"}, 500

  offers = [map_comparison_offer(row) for row in response_data(response)]
  return jsonify({"offers": offers})


@app.get("/savings")
def get_savings():
  user_id = request.args.get('user_id')

  if user_id:
    record = (
      supabase
      .table('user_savings')
      .select('*')
      .eq('user_id', user_id)
      .limit(1)
      .execute()
    )

    if response_error(record):
      app.logger.error('Failed to fetch user savings: %s', response_error(record))
    else:
      rows = response_data(record)
      if rows:
        row = rows[0]
        return jsonify({
          'totalSavings': float(row.get('total_savings', 0)),
          'averagePerCheckout': float(row.get('average_per_checkout', 0)),
          'savingsOverTime': row.get('savings_over_time', []),
          'categoryBreakdown': row.get('category_breakdown', []),
          'cardBreakdown': row.get('card_breakdown', []),
          'smartSuggestions': row.get('smart_suggestions', []),
        })

  # Fallback to legacy aggregate if user-specific data not available
  response = supabase.table('savings_metrics').select('*').execute()
  if response_error(response):
    app.logger.error('Failed to fetch savings metrics: %s', response_error(response))
    return {
      'totalSavings': 0,
      'averagePerCheckout': 0,
      'savingsOverTime': [],
      'categoryBreakdown': [],
      'cardBreakdown': [],
      'smartSuggestions': [],
    }

  legacy = [map_savings_metric(row) for row in response_data(response)]
  total = sum(metric.get('amount', 0) for metric in legacy if isinstance(metric.get('amount'), str) is False)
  return jsonify({
    'totalSavings': total,
    'averagePerCheckout': 0,
    'savingsOverTime': [],
    'categoryBreakdown': legacy,
    'cardBreakdown': [],
    'smartSuggestions': [],
  })


def user_exists(user_id: str) -> bool:
  response = supabase.table("users").select("id").eq("id", user_id).execute()
  if response_error(response):
    app.logger.error("Failed to verify user: %s", response_error(response))
    return False
  return bool(response_data(response))


@app.get("/users/<user_id>/cards")
def get_user_cards(user_id: str):
  response = supabase.table("user_cards").select("card_id").eq("user_id", user_id).execute()
  if response_error(response):
    app.logger.error("Failed to fetch user cards: %s", response_error(response))
    return {"message": "Failed to fetch cards"}, 500

  card_ids = [row["card_id"] for row in response_data(response)]
  return jsonify({"cardIds": card_ids})


@app.post("/users/<user_id>/cards")
def save_user_cards(user_id: str):
  if not user_exists(user_id):
    return {"message": "User not found"}, 404

  payload = request.get_json(force=True, silent=True) or {}
  card_ids = payload.get("cardIds")
  if not isinstance(card_ids, list):
    return {"message": "cardIds must be a list"}, 400

  delete_response = supabase.table("user_cards").delete().eq("user_id", user_id).execute()
  if response_error(delete_response):
    app.logger.error("Failed to clear previous selections: %s", response_error(delete_response))
    return {"message": "Failed to update cards"}, 500

  if card_ids:
    rows = [{"user_id": user_id, "card_id": card_id} for card_id in card_ids]
    insert_response = supabase.table("user_cards").insert(rows).execute()
    if response_error(insert_response):
      app.logger.error("Failed to save card selections: %s", response_error(insert_response))
      return {"message": "Failed to update cards"}, 500

  return jsonify({"cardIds": card_ids})


if __name__ == "__main__":
  app.run(debug=True)
