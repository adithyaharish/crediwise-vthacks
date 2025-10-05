# Crediwise

**Crediwise** is an AI-powered Chrome extension and dashboard that acts as a smart credit card assistant.  

---

## 🔹 What it is
- A multi-surface tool that helps you pick the best card at checkout.  
- Combines a browser extension, a web dashboard, and a backend API.  

## 🔹 What it does
- **Auto-detects checkout pages** and recommends the best card to maximize rewards and cashback.  
- **Dashboard** to track savings, compare card performance, and view spending insights.  
- **Backend (Flask + Supabase)** manages data, AI logic, and scrapes public offers.  

---

## 🚀 Run It Locally

### Prerequisites
- Node.js ≥ 18  
- Python ≥ 3.11  
- Supabase project (or local credentials)  

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# create .env with SUPABASE_URL, SUPABASE_SERVICE_KEY, FRONTEND_ORIGIN
flask run --port 5000
```

### Frontend
```bash
cd frontend
npm install
# create .env.local with VITE_API_URL=http://localhost:5000
npm run dev
```

### Browser Extension
1. Update API URLs in `plugin/background.js` and `plugin/content.js` if needed.  
2. In Chrome:  
   - Go to `chrome://extensions`  
   - Enable **Developer mode**  
   - Click **Load unpacked**  
   - Select the `plugin/` folder  

## 📂 Folder Guide

| Path        | Description                                                                 |
|-------------|-----------------------------------------------------------------------------|
| `frontend/` | Vite + React SPA with Tailwind styling, views for login, dashboard, savings. |
| `backend/`  | Flask API backed by Supabase; handles auth, card data, checkout insights.    |
| `plugin/`   | Manifest V3 Chrome extension (content + background scripts, manifest).       |


## DevPost link:
https://devpost.com/software/crediwise-use-the-right-card-every-time 
