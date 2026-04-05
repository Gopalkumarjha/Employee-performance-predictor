# Employee Performance Prediction System

## Overview

A full-stack Employee Performance Prediction System using Machine Learning and Data Analytics. HR managers can enter employee data and get real-time ML-powered performance predictions, insights, and analytics dashboards.

## Architecture

```
/
├── artifacts/
│   ├── emp-performance/        # React + Vite frontend (port assigned by system, previewPath: /)
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── predict.tsx     # Employee input form + prediction result
│   │       │   └── analytics.tsx   # Analytics dashboard with charts
│   │       └── components/
│   │           └── layout.tsx      # Shared sidebar navigation
│   ├── api-server/             # Express 5 + TypeScript API server (port 8080, /api)
│   │   ├── src/routes/
│   │   │   ├── prediction.ts   # Proxies /predict, /analytics/* to Python ML service
│   │   │   └── health.ts       # /healthz endpoint
│   │   └── python_ml/          # Python Flask ML service (port 5001)
│   │       ├── app.py          # Flask REST API with /ml/* endpoints
│   │       ├── train_model.py  # Random Forest model training script
│   │       ├── model.joblib    # Trained Random Forest model (R²=0.87)
│   │       ├── scaler.joblib   # StandardScaler for feature normalization
│   │       └── feature_importances.joblib
│   └── mockup-sandbox/         # Canvas design sandbox
└── lib/
    ├── api-spec/openapi.yaml   # OpenAPI 3.1 specification (source of truth)
    ├── api-client-react/       # Generated React Query hooks
    └── api-zod/                # Generated Zod validation schemas
```

## ML Model

- **Algorithm**: Random Forest Regressor (200 trees, max_depth=10)
- **Training data**: 2000 synthetic employee records with realistic distributions
- **Features**: Age, Years at Company, Training Hours, Projects Handled, Work Hours, Overtime Hours, Satisfaction Score, Salary
- **Performance**: R² = 0.87
- **Output**: Performance Score (0-100), Category (High/Medium/Low), Confidence, Insights, Top Factors

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui + Recharts
- **API server**: Express 5 + TypeScript + Drizzle ORM
- **ML service**: Python 3.11 + Flask + scikit-learn + pandas + numpy
- **Monorepo**: pnpm workspaces
- **API contract**: OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run --filter @workspace/api-spec codegen` — regenerate API hooks from OpenAPI spec
- `python3 artifacts/api-server/python_ml/train_model.py` — retrain the ML model
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Workflows

- **ML Service**: `ML_PORT=5001 python3 artifacts/api-server/python_ml/app.py`
- **API Server**: Express backend serving `/api/*`
- **emp-performance web**: React + Vite frontend at `/`

## API Endpoints

- `GET /api/healthz` — health check
- `POST /api/predict` — employee performance prediction
- `GET /api/analytics` — performance distribution data
- `GET /api/analytics/history` — past prediction history
- `GET /api/analytics/insights` — workforce insights summary
