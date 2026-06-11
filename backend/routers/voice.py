import unicodedata
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..core.security import get_current_user
from ..database import get_db
from ..models.core import UserConfig
from ..services.ai_service import generate_carinne_reply
from ..services.audio_service import bytes_to_base64, generate_voice, transcribe_audio

router = APIRouter(prefix='/api/v1/voice', tags=['voice'], dependencies=[Depends(get_current_user)])


@router.post('/command')
async def command(file: UploadFile = File(...), db: Session = Depends(get_db)):
	transcript = await transcribe_audio(await file.read())
	reply = generate_carinne_reply(transcript, {'bateria_pessoal': 72.0, 'saldo_livre_diario': 35.0})
	audio = await generate_voice(reply)
	return {'transcript': transcript, 'reply': reply, 'audio_base64': bytes_to_base64(audio)}


@router.post('/train-wake-word')
async def train_wake_word(new_name: str = Form(...), files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
	if len(files) < 8:
		raise HTTPException(status_code=400, detail='Forneca 8 gravacoes de voz.')

	def normalize(s: str):
		s = s.lower()
		s = unicodedata.normalize('NFD', s)
		s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
		return ''.join(ch for ch in s if ch.isalnum() or ch.isspace()).strip()

	target = normalize(new_name)
	matches = 0
	transcripts = []
	for file in files[:8]:
		text = await transcribe_audio(await file.read())
		transcripts.append(text)
		if target in normalize(text):
			matches += 1

	if matches < 6:
		raise HTTPException(status_code=400, detail='Nao foi possivel reconhecer a palavra com clareza.')

	user = db.query(UserConfig).first() or UserConfig(mmr=1200, bateria_pessoal=100.0, saldo_livre_diario=0.0, custom_ai_name=new_name)
	user.custom_ai_name = new_name
	db.add(user)
	db.commit()
	return {'status': 'success', 'message': 'Voz calibrada com sucesso.', 'transcripts': transcripts, 'custom_ai_name': new_name}
