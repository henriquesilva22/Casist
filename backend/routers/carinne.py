from typing import Dict
import unicodedata
import re
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from ..core.security import get_current_user
from ..database import get_db
from ..models.core import ChatMemory, Transaction, TransactionType, UserConfig, WorkoutSession
from ..services.ai_service import generate_carinne_reply, generate_carinne_suggestion
from ..services.audio_service import bytes_to_base64, generate_voice, transcribe_audio
from ..services.life_engine import calculate_battery_impact

router = APIRouter(prefix='/api/v1/carinne', tags=['carinne'], dependencies=[Depends(get_current_user)])

@router.post('/chat')
def chat(payload: Dict, db: Session = Depends(get_db)):
  text = payload.get('message', '')
  user_id = payload.get('user_id')
  user_name = (payload.get('user_name') or 'usuario').strip() or 'usuario'
  user = db.query(UserConfig).first()
  recent_memories = db.query(ChatMemory).filter(ChatMemory.user_name == user_name).order_by(ChatMemory.created_at.desc()).limit(8).all()
  memory_questions = [m.question for m in reversed(recent_memories)]
  m = re.search(r'gastei\s+(\d+[\,\.]?\d*)', text, re.IGNORECASE)
  if m:
    amount = float(m.group(1).replace(',', '.'))
    db.add(Transaction(amount=amount, type=TransactionType.expense, category='chat', description=text, user_id=user.id if user else user_id))
    db.commit()
    return {'reply': f'Computado. Registrei R$ {amount:.2f} como gasto geral e deduzi do seu saldo seguro de hoje.'}
  context = {
    'bateria_pessoal': user.bateria_pessoal if user else 72.0,
    'saldo_livre_diario': user.saldo_livre_diario if user else 35.0,
    'user_name': user_name,
    'memory_questions': memory_questions,
  }
  reply = generate_carinne_reply(text, context)
  db.add(ChatMemory(user_name=user_name, question=text, reply=reply))
  db.commit()
  return {'reply': reply}

@router.get('/suggest')
def suggest(db: Session = Depends(get_db)):
  user = db.query(UserConfig).first()
  last_workout = db.query(WorkoutSession).filter(WorkoutSession.user_id == user.id).order_by(WorkoutSession.date.desc()).first() if user else None
  effort = last_workout.effort_level.value if last_workout else 'Leve'
  battery = (user.bateria_pessoal if user else 72.0) * calculate_battery_impact(effort, 'Baixa')
  return {'suggestion': generate_carinne_suggestion({'bateria_pessoal': battery, 'saldo_livre_diario': user.saldo_livre_diario if user else 35.0})}

@router.post('/train-wake-word')
async def train_wake_word(new_name: str = Form(...), files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
  if len(files) < 8:
    raise HTTPException(status_code=400, detail='Forneça 8 gravações de voz.')
  def normalize(s: str):
    s = s.lower(); s = unicodedata.normalize('NFD', s); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn'); return ''.join(ch for ch in s if ch.isalnum() or ch.isspace()).strip()
  target = normalize(new_name)
  matches = 0
  transcripts = []
  for file in files[:8]:
    text = await transcribe_audio(await file.read())
    transcripts.append(text)
    if target in normalize(text):
      matches += 1
  if matches >= 6:
    user = db.query(UserConfig).first() or UserConfig(mmr=1200, bateria_pessoal=100.0, saldo_livre_diario=0.0, custom_ai_name=new_name)
    user.custom_ai_name = new_name
    db.add(user)
    db.commit()
    return {'status': 'success', 'message': 'Voz calibrada com sucesso.', 'transcripts': transcripts, 'custom_ai_name': new_name}
  raise HTTPException(status_code=400, detail='Não conseguimos reconhecer a palavra com clareza. Por favor, tente gravar em um ambiente mais silencioso.')

@router.post('/command')
async def command(file: UploadFile = File(...), db: Session = Depends(get_db)):
  transcript = await transcribe_audio(await file.read())
  reply = generate_carinne_reply(transcript, {'bateria_pessoal': 72.0, 'saldo_livre_diario': 35.0})
  audio = await generate_voice(reply)
  return {'transcript': transcript, 'reply': reply, 'audio_base64': bytes_to_base64(audio)}
