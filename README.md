# LoyaltyLens — SaaS Customer Churn Prediction & Retention Intelligence Platform

![LoyaltyLens Platform](https://img.shields.io/badge/Platform-Production--Ready%20SaaS-emerald)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLAlchemy-336791)
![ML Engine](https://img.shields.io/badge/ML%20Engine-Logistic%20Regression%20%2B%20Random%20Forest-FF6F00)
![AI Layer](https://img.shields.io/badge/AI%20Layer-Google%20Gemini-4285F4)

**LoyaltyLens** is a modern, modular, production-grade Customer Churn Prediction and Retention Intelligence SaaS platform designed to help enterprise brands identify churn risk, analyze root cause churn reasons across 118 Indian cities, run interactive retention simulations, and deploy automated win-back campaigns.

---

## 1. Target Architecture

```
                    ┌────────────────────────┐
                    │    Next.js Frontend    │
                    │ (TypeScript, Tailwind) │
                    └───────────┬────────────┘
                                │ REST API
                                ▼
                    ┌────────────────────────┐
                    │    FastAPI Backend     │
                    │   (Pydantic v2, JWT)   │
                    └───────────┬────────────┘
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐      ┌───────────────────┐    ┌─────────────────┐
│  PostgreSQL  │      │    ML Service     │    │  Google Gemini  │
│ (SQLAlchemy) │      │ (Scikit-Learn/    │    │   AI Service    │
└──────────────┘      │  Model Pipelines) │    └─────────────────┘
                      └─────────┬─────────┘
                                ▼
                      ┌───────────────────┐
                      │  Risk & Reason    │
                      │     Engines       │
                      └─────────┬─────────┘
                                ▼
                      ┌───────────────────┐
                      │ Retention Action  │
                      │    Simulator      │
                      └───────────────────┘
```

---

## 2. Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide React, Recharts, Leaflet / React-Leaflet (Indian Cities Geo-Map).
- **Backend API**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Argon2 password hashing, JWT authentication.
- **Database**: PostgreSQL (Production/Docker) / SQLite (Local Quickstart).
- **Machine Learning**: Scikit-Learn, Pandas, NumPy (Logistic Regression baseline + Random Forest model comparison pipeline).
- **AI Intelligence**: Google Gemini AI (`google-generativeai`) with automatic fallback to deterministic rule templates.
- **Containerization & Dev Tools**: Docker, Docker Compose, Pytest, Playwright.

---

## 3. Directory Structure

```
LoyaltyLens/
├── backend/                  # FastAPI Backend Service
│   ├── api/                  # API routers & versioning
│   │   ├── deps.py           # Dependency injection (Auth, DB)
│   │   └── v1/               # API V1 Endpoints
│   │       ├── admin.py      # Model metrics & DB seed trigger
│   │       ├── ai_insights.py# AI Weekly Action Briefing
│   │       ├── analytics.py  # Overview & Geo Churn analytics
│   │       ├── auth.py       # JWT Login & Registration
│   │       ├── campaigns.py  # Campaign CRUD & Simulator
│   │       ├── customers.py  # Customer 360 & Dataset import
│   │       ├── predictions.py# Single & Batch ML predictions
│   │       └── retention.py  # Retention playbook rules
│   ├── core/                 # Config & Security modules
│   ├── db/                   # Database session & models
│   ├── models/               # SQLAlchemy ORM Data Models (12 tables)
│   ├── repositories/         # Repository Data Access Layer
│   ├── schemas/              # Pydantic Input/Output Schemas
│   ├── scripts/              # Seed database scripts
│   └── services/             # Business Logic & Risk Engines
├── frontend/                 # Next.js SaaS Web Application
│   ├── src/
│   │   ├── components/       # Layout, Headers, Sidebar, Leaflet Map
│   │   ├── context/          # React Auth Context & App State
│   │   ├── lib/              # Axios API client
│   │   └── pages/            # 12 SaaS Application Routes
│   ├── package.json
│   └── tsconfig.json
├── ml/                       # Separated Machine Learning Engine
│   ├── evaluation/           # Metrics calculation (Accuracy, F1, ROC-AUC, PR-AUC, CM)
│   ├── inference/            # Prediction service (`ChurnPredictor`)
│   ├── models/               # Model pickles (`churn_model.pkl`) & metrics.json
│   ├── preprocessing/        # Data encoding & feature extraction
│   └── training/             # Model training pipelines (`train.py`)
├── tests/                    # Pytest & E2E Test Suites
├── docker-compose.yml        # Docker Multi-Container Config
├── Dockerfile.backend        # Backend Container Spec
├── .env.example              # Environment Variable Template
└── README.md                 # Project Documentation
```

---

## 4. Environment Variables (`.env.example`)

Copy `.env.example` to `.env` in the root directory:

```env
PROJECT_NAME="LoyaltyLens Customer Retention Intelligence Platform"
VERSION="2.0.0"
ENV="development"
DEBUG=true

# Database Connection URL
DATABASE_URL=sqlite:///./loyaltylens.db

# Authentication Security Secrets
JWT_SECRET=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google Gemini AI Integration Key (Optional — Fallback logic is used if missing)
GEMINI_API_KEY=

# Redis Cache & Background Queue
REDIS_URL=redis://localhost:6379/0

# CORS Allowed Origins
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:8000"]
```

---

## 5. Running Locally

### Step 1: Install & Run Backend

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Seed the database and train the baseline ML model
python -m backend.scripts.seed_db

# Start the FastAPI server
uvicorn backend.main:app --reload --port 8000
```
- API Documentation (Swagger/OpenAPI): `http://localhost:8000/api/v1/docs`

### Step 2: Install & Run Frontend

```bash
# Navigate to frontend folder
cd frontend

# Install Node.js packages
npm install

# Start Next.js development server
npm run dev
```
- SaaS Web Dashboard: `http://localhost:3000`

---

## 6. Docker Setup

To run the full stack (Next.js, FastAPI, PostgreSQL, Redis) with Docker Compose:

```bash
docker-compose up --build
```

---

## 7. Sample Login Credentials (Demo Environment)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@loyaltylens.com` | `admin` |
| **Analyst** | `analyst@loyaltylens.com` | `analyst123` |

---

## 8. Machine Learning Pipeline & Metrics

- **Pipeline**: Raw Data &rarr; Schema Validation &rarr; Categorical Encoding &rarr; Feature Extraction &rarr; Fitting &rarr; Performance Evaluation &rarr; Model Persistence.
- **Baseline Model**: Logistic Regression (`v1.0-logistic`).
- **Evaluation Metrics**:
  - Accuracy: `90.50%`
  - Precision / Recall / F1-Score
  - ROC-AUC: `0.8834`
  - PR-AUC
  - Confusion Matrix (`True Negatives`, `False Positives`, `False Negatives`, `True Positives`)

---

## 9. Google Gemini AI Integration

Google Gemini AI synthesizes customer data, ML predictions, and risk factors to generate:
- **Weekly Action Briefings**: Executive Summary, Root Cause Churn Drivers, Vulnerable Segments, Strategic Recommended Actions, and Suggested Campaigns.
- **Customer 360 Narratives**: Human-readable explanations for individual customer risk profiles.
- **Deterministic Fallback**: If `GEMINI_API_KEY` is not configured, the system uses rule-based templates so functionality is never disrupted.

---

## 10. Automated Testing

Run backend REST API and ML unit tests using `pytest`:

```bash
python -m pytest
```

---

## 11. SaaS Application Pages (12 Routes)

1. `/login`: User Authentication & Role Selection.
2. `/dashboard`: Key Performance Indicators, Churn Breakdown, Risk Distribution.
3. `/customers`: Paginated Customer Directory with Multi-Filter Search.
4. `/customers/[id]`: Customer 360 Profile with Risk Score Gauge, Structured Reasons & Recommendations.
5. `/analytics`: Interactive Leaflet Geo-Map across 118 Indian cities and Recharts visualizations.
6. `/retention`: Automated Retention Playbook strategies.
7. `/campaigns`: Retention Campaign Management Roster.
8. `/campaigns/[id]`: Campaign Detail Page & Audience Reach.
9. `/simulator`: Interactive Retention Action Simulator (Discount, Free Delivery, Support, etc.).
10. `/upload`: Dataset CSV/XLSX Upload, Schema Validation & Import.
11. `/ai-insights`: AI Weekly Action Briefing powered by Gemini AI.
12. `/settings`: Platform settings, ML configuration, and database re-seeding controls.
