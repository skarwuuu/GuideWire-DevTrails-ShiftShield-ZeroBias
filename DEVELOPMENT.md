# Local Development Setup

## Prerequisites

- Python 3.10
- Node.js + pnpm (`npm install -g pnpm`)
- MongoDB Atlas account (free tier works)
- OpenWeatherMap API key (free at openweathermap.org)

---

## Backend (FastAPI)

### 1. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/
OPENWEATHER_API_KEY=your_key_here
CORS_ORIGIN=http://localhost:3000
MODEL_PATH=app/engine/scoring_model.joblib
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the server

```bash
uvicorn app.main:app --port 4000 --reload
```

Backend runs at `http://localhost:4000`  
Health check: `http://localhost:4000/health`  
API docs: `http://localhost:4000/docs`

---

## Frontend (Next.js)

### 1. Configure environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2. Install dependencies

```bash
cd frontend
pnpm install
```

### 3. Start the dev server

```bash
pnpm dev
```

Frontend runs at `http://localhost:3000`

---

## Project Structure

```
GuideWire-DevTrails/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings (env vars)
│   │   ├── database.py       # MongoDB connection
│   │   ├── schemas.py        # Pydantic models
│   │   ├── engine/           # ML scoring + decision engine
│   │   │   ├── scoring.py
│   │   │   ├── decision.py
│   │   │   └── *.joblib      # Trained models
│   │   ├── models/           # M1–M5 signal models
│   │   ├── routes/           # API routes
│   │   │   ├── rider.py      # POST /rider/register, GET /rider/:id
│   │   │   ├── shift.py      # POST /shift/start, /shift/end, GET /shift/:id/active
│   │   │   ├── claim.py      # POST /claim/evaluate, GET /claim/:id/status
│   │   │   ├── policy.py
│   │   │   └── premium.py    # POST /premium/quote
│   │   └── payout/
│   │       └── payout.py     # Payout engine
│   ├── scripts/              # Model training scripts
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Landing page
│       │   └── app/              # Rider app (/app/*)
│       │       ├── page.tsx      # Dashboard
│       │       ├── shift/        # Shift management
│       │       ├── claim/        # Claim evaluation
│       │       └── quote/        # Premium quote
│       ├── components/
│       │   ├── layout/           # Navbar, Footer
│       │   └── app/              # AppNav, RiderProvider
│       └── lib/
│           └── api.ts            # Typed API client
├── render.yaml                   # Render deployment config
└── DEVELOPMENT.md                # This file
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rider/register` | Register a new rider |
| GET | `/rider/:id` | Get rider profile |
| POST | `/shift/start` | Start a shift (activates coverage) |
| POST | `/shift/end` | End a shift |
| GET | `/shift/:id/active` | Get active shift for a rider |
| POST | `/claim/evaluate` | Run full ML scoring + payout pipeline |
| GET | `/claim/:id/status` | Get claim status |
| POST | `/premium/quote` | Get a premium quote |

---

## Rider App Flow

1. Go to `http://localhost:3000/app`
2. Register as a new rider or enter an existing Rider ID
3. Start a shift — enter your pincode to activate coverage
4. End the shift — then evaluate a claim to check payout eligibility
5. Use the Quote page to see your premium for 1 / 3 / 7 day coverage
