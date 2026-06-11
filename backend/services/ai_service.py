import os
from typing import Dict
import openai

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if OPENAI_API_KEY:
  openai.api_key = OPENAI_API_KEY

SYSTEM_PROMPT = 'Você é Carinne, uma assistente pessoal do LifeOS. Responda com foco prático, contexto do usuário e próximo passo claro. Nunca responda só com uma confirmação vaga.'

def _extract_memory_focus(memory_questions: list[str]) -> str:
  if not memory_questions:
    return ''
  text = ' '.join(memory_questions).lower()
  score = {
    'estudos': sum(1 for w in ['estud', 'prova', 'revis', 'flashcard', 'matéria', 'materia'] if w in text),
    'finanças': sum(1 for w in ['gasto', 'compr', 'saldo', 'dinheiro', 'carteira'] if w in text),
    'academia': sum(1 for w in ['treino', 'academia', 'muscul', 'exerc'] if w in text),
    'agenda': sum(1 for w in ['evento', 'agenda', 'data', 'prazo'] if w in text),
  }
  focus, points = max(score.items(), key=lambda item: item[1])
  return focus if points > 0 else ''

def generate_carinne_suggestion(context: Dict) -> str:
  message = str(context.get('message', '')).lower()
  battery = context.get('bateria_pessoal', 100)
  saldo = context.get('saldo_livre_diario', 0)
  try:
    if not OPENAI_API_KEY:
      if any(word in message for word in ['estud', 'revis', 'prova', 'matéria', 'materia']):
        return 'Sugestão: revise o tópico mais importante por 20 minutos e finalize com 3 questões.'
      if any(word in message for word in ['treino', 'academia', 'exerc', 'muscul']):
        return 'Sugestão: faça um treino curto e objetivo; preserve energia se a bateria estiver baixa.'
      if any(word in message for word in ['gasto', 'compr', 'dinheiro', 'saldo']):
        return f'Saldo livre atual: R$ {saldo:.2f}. Se for gastar hoje, mantenha um teto baixo.'
      if battery < 40:
        return 'Sua bateria está baixa. Recomendo descanso ou tarefas leves.'
      return 'Sugestão: priorize a tarefa mais importante de hoje e execute o próximo passo agora.'
    resp = openai.ChatCompletion.create(model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'), messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, {'role': 'user', 'content': str(context)}], max_tokens=120, temperature=0.4)
    return resp.choices[0].message.content.strip()
  except Exception as exc:
    return f'Não consegui gerar a sugestão agora. {exc}'

def generate_carinne_reply(message: str, context: Dict) -> str:
  enriched_context = {**context, 'message': message}
  message_lower = message.lower().strip()
  memory_focus = _extract_memory_focus(context.get('memory_questions', []))
  if not message_lower:
    return 'Me diga o que você quer fazer hoje.'
  if any(word in message_lower for word in ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite']):
    if memory_focus:
      return f'Oi. Nas últimas conversas você focou em {memory_focus}. Quer continuar por aí ou mudar a prioridade de hoje?'
    return 'Oi. Me diga sua prioridade de hoje que eu monto o próximo passo.'
  if 'gastei' in message_lower or 'gasto' in message_lower:
    return generate_carinne_suggestion(enriched_context)
  suggestion = generate_carinne_suggestion(enriched_context)
  if memory_focus and memory_focus not in message_lower:
    return f'{suggestion} Também notei padrão recente em {memory_focus}; posso conectar isso com sua pergunta atual.'
  return suggestion
