from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, carinne, user, voice, postits, events, mirror, workouts, brain, wallet
from .services.scheduler import create_scheduler

app = FastAPI(title='LifeOS Assistant API')
scheduler = create_scheduler()

app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:3000'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

@app.on_event('startup')
def on_startup():
  Base.metadata.create_all(bind=engine)
  if not scheduler.running:
    scheduler.start()

@app.on_event('shutdown')
def on_shutdown():
  if scheduler.running:
    scheduler.shutdown(wait=False)

@app.get('/health')
def health():
  return {'status': 'online', 'ai_core': 'ready'}

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(carinne.router)
app.include_router(voice.router)
app.include_router(postits.router)
app.include_router(events.router)
app.include_router(mirror.router)
app.include_router(workouts.router)
app.include_router(brain.router)
app.include_router(wallet.router)
