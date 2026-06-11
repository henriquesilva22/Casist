import base64, asyncio, io, os
import openai

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if OPENAI_API_KEY:
  openai.api_key = OPENAI_API_KEY

async def transcribe_audio(file_bytes: bytes) -> str:
  loop = asyncio.get_running_loop()
  def _inner():
    if not OPENAI_API_KEY: return ''
    return openai.Audio.transcribe('whisper-1', io.BytesIO(file_bytes)).get('text', '')
  return await loop.run_in_executor(None, _inner)

async def generate_voice(text: str) -> bytes:
  loop = asyncio.get_running_loop()
  def _inner():
    if not OPENAI_API_KEY: return b''
    resp = openai.audio.speech.create(model=os.getenv('OPENAI_TTS_MODEL', 'tts-1'), voice=os.getenv('OPENAI_TTS_VOICE', 'nova'), input=text)
    return resp if isinstance(resp, (bytes, bytearray)) else b''
  return await loop.run_in_executor(None, _inner)

def bytes_to_base64(b: bytes) -> str: return base64.b64encode(b).decode('utf-8') if b else ''
