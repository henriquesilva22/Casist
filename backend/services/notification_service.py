from typing import Any, Dict
import os
try:
  from pywebpush import webpush, WebPushException
except Exception:
  webpush = None
  WebPushException = Exception

def send_web_push(subscription_info: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
  if webpush is None or not os.getenv('VAPID_PRIVATE_KEY'):
    return {'status': 'simulated', 'payload': payload}
  try:
    webpush(subscription_info=subscription_info, data=str(payload), vapid_private_key=os.getenv('VAPID_PRIVATE_KEY'), vapid_claims={'sub': os.getenv('VAPID_SUBJECT', 'mailto:admin@lifeos.local')})
    return {'status': 'sent', 'payload': payload}
  except WebPushException as exc:
    return {'status': 'error', 'detail': str(exc), 'payload': payload}
