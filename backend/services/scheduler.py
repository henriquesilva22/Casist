from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from ..database import SessionLocal
from ..models.core import Event
from .notification_service import send_web_push

def daily_event_scan():
  db = SessionLocal()
  try:
    now = datetime.utcnow()
    for event in db.query(Event).all():
      reminder_start = event.event_date - timedelta(days=event.reminder_days)
      if reminder_start <= now <= event.event_date:
        send_web_push({'endpoint': 'https://example.invalid/push', 'keys': {'p256dh': '', 'auth': ''}}, {'title': f'Evento próximo: {event.title}', 'body': f'{event.title} acontece em breve.', 'sound': event.notification_sound})
  finally:
    db.close()

def create_scheduler() -> BackgroundScheduler:
  scheduler = BackgroundScheduler(timezone='UTC')
  scheduler.add_job(daily_event_scan, CronTrigger(hour=8, minute=0), id='daily_event_scan', replace_existing=True, max_instances=1, coalesce=True)
  return scheduler
