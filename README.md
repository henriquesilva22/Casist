# LifeOS Assistant

Frontend Next.js + Backend FastAPI para o LifeOS Assistant.

## Docker

```bash
docker compose up --build
```

Depois abra:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/health

## Frontend

```bash
npm install
npm run dev
```

## Backend

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```
