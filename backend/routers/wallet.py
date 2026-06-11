from datetime import datetime, timedelta
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.security import get_current_user
from ..database import get_db
from ..deps import get_or_create_user
from ..models.core import SavingsGoal, Transaction, TransactionType, WalletBill, WalletProfile
from ..schemas.wallet import (
  BillCreate,
  CanBuyRequest,
  CanBuyResponse,
  CategoryBreakdownItem,
  FinancialInsight,
  GoalCreate,
  GoalUpdate,
  MonthlyTargetUpdate,
  QuickExpenseCreate,
  QuickIncomeCreate,
  SavingsGoalResponse,
  WalletBillResponse,
  WalletDashboardResponse,
  WalletIntentRequest,
  WalletSummaryResponse,
  WalletTodayResponse,
  WalletYesterdayResponse,
  WeeklySummaryResponse,
)

router = APIRouter(prefix='/api/v1/wallet', tags=['wallet'], dependencies=[Depends(get_current_user)])


def _get_or_create_profile(db: Session, user_id: int) -> WalletProfile:
  profile = db.query(WalletProfile).filter(WalletProfile.user_id == user_id).first()
  if profile:
    return profile
  profile = WalletProfile(user_id=user_id, monthly_saving_target=0.0)
  db.add(profile)
  db.commit()
  db.refresh(profile)
  return profile


def _month_range(now: datetime):
  start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
  if now.month == 12:
    next_month = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
  else:
    next_month = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
  return start, next_month


def _remaining_days(now: datetime) -> int:
  _, next_month = _month_range(now)
  return max(1, (next_month.date() - now.date()).days)


def _balance(db: Session, user_id: int) -> float:
  income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.income).scalar() or 0.0
  expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.expense).scalar() or 0.0
  return float(income - expense)


def _pending_bills(db: Session, user_id: int):
  return db.query(WalletBill).filter(WalletBill.user_id == user_id, WalletBill.paid == False).order_by(WalletBill.due_date.asc()).all()


def _summary(db: Session, user_id: int) -> WalletSummaryResponse:
  now = datetime.utcnow()
  profile = _get_or_create_profile(db, user_id)
  balance = _balance(db, user_id)

  pending = _pending_bills(db, user_id)
  pending_total = float(sum(b.amount for b in pending))
  next_payment = pending[0] if pending else None

  month_start, month_end = _month_range(now)
  income_month = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.income, Transaction.date >= month_start, Transaction.date < month_end).scalar() or 0.0
  expense_month = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.expense, Transaction.date >= month_start, Transaction.date < month_end).scalar() or 0.0
  monthly_saving_current = float(income_month - expense_month)

  last_14_start = now - timedelta(days=14)
  income_14 = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.income,
    Transaction.date >= last_14_start,
  ).scalar() or 0.0
  expense_14 = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= last_14_start,
  ).scalar() or 0.0
  net_last_14 = float(income_14 - expense_14)
  avg_daily_net = float(net_last_14) / 14

  real_available = float(balance - pending_total - profile.monthly_saving_target)
  forecast = float(balance + (avg_daily_net * _remaining_days(now)) - pending_total - profile.monthly_saving_target)

  return WalletSummaryResponse(
    current_balance=float(balance),
    next_payment_date=next_payment.due_date if next_payment else None,
    next_payment_amount=float(next_payment.amount) if next_payment else None,
    pending_bills_count=len(pending),
    pending_bills_total=pending_total,
    real_available=real_available,
    monthly_saving_current=monthly_saving_current,
    monthly_saving_target=float(profile.monthly_saving_target),
    month_end_forecast=forecast,
  )


def _today(db: Session, user_id: int) -> WalletTodayResponse:
  now = datetime.utcnow()
  start = now.replace(hour=0, minute=0, second=0, microsecond=0)
  end = start + timedelta(days=1)

  today_expenses = db.query(Transaction).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= start,
    Transaction.date < end,
  ).all()

  spent_today = float(sum(t.amount for t in today_expenses))
  categories: dict[str, float] = {}
  for t in today_expenses:
    key = (t.category or 'outros').lower()
    categories[key] = float(categories.get(key, 0.0) + t.amount)

  biggest = max(today_expenses, key=lambda t: t.amount) if today_expenses else None

  summary = _summary(db, user_id)
  recommended = float(max(0.0, summary.real_available / _remaining_days(now)))

  return WalletTodayResponse(
    spent_today=spent_today,
    recommended_limit_today=recommended,
    difference=float(recommended - spent_today),
    biggest_expense_today=float(biggest.amount) if biggest else 0.0,
    biggest_expense_category=(biggest.category if biggest else None),
    categories_today=categories,
  )


def _yesterday(db: Session, user_id: int) -> WalletYesterdayResponse:
  now = datetime.utcnow()
  today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
  yesterday_start = today_start - timedelta(days=1)

  spent_today = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= today_start,
  ).scalar() or 0.0

  spent_yesterday = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= yesterday_start,
    Transaction.date < today_start,
  ).scalar() or 0.0

  diff = float(spent_today - spent_yesterday)
  if diff < 0:
    comparison = f'Voce gastou R$ {abs(diff):.2f} a menos que ontem.'
  elif diff > 0:
    comparison = f'Voce gastou R$ {diff:.2f} a mais que ontem.'
  else:
    comparison = 'Seu gasto foi igual ao de ontem.'

  return WalletYesterdayResponse(
    spent_today=float(spent_today),
    spent_yesterday=float(spent_yesterday),
    difference_vs_yesterday=diff,
    comparison_text=comparison,
  )


def _category_breakdown(db: Session, user_id: int) -> list[CategoryBreakdownItem]:
  now = datetime.utcnow()
  month_start, month_end = _month_range(now)

  rows = db.query(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0.0).label('amount')).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= month_start,
    Transaction.date < month_end,
  ).group_by(Transaction.category).all()

  total = float(sum(float(r.amount or 0.0) for r in rows))
  result: list[CategoryBreakdownItem] = []
  for r in rows:
    amount = float(r.amount or 0.0)
    pct = (amount / total * 100.0) if total > 0 else 0.0
    result.append(CategoryBreakdownItem(category=(r.category or 'outros'), amount=amount, percentage=round(pct, 2)))

  return sorted(result, key=lambda x: x.amount, reverse=True)


def _goals(db: Session, user_id: int) -> list[SavingsGoalResponse]:
  summary = _summary(db, user_id)
  monthly_progress = max(1.0, summary.monthly_saving_current if summary.monthly_saving_current > 0 else 1.0)
  goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).order_by(SavingsGoal.created_at.desc()).all()
  out = []
  for g in goals:
    remaining = max(0.0, g.target_amount - g.current_amount)
    monthly_rate = g.monthly_contribution if g.monthly_contribution > 0 else monthly_progress
    eta = int((remaining / monthly_rate) + 0.999) if remaining > 0 else 0
    out.append(SavingsGoalResponse(
      id=g.id,
      title=g.title,
      target_amount=float(g.target_amount),
      current_amount=float(g.current_amount),
      monthly_contribution=float(g.monthly_contribution),
      eta_months=eta,
      is_active=g.is_active,
    ))
  return out


def _weekly_summary(db: Session, user_id: int) -> WeeklySummaryResponse:
  now = datetime.utcnow()
  start = now - timedelta(days=7)
  entries = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.income, Transaction.date >= start).scalar() or 0.0
  exits = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.expense, Transaction.date >= start).scalar() or 0.0

  biggest_expense = db.query(func.coalesce(func.max(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.expense, Transaction.date >= start).scalar() or 0.0

  dom_row = db.query(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0.0).label('amount')).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= start,
  ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).first()

  dominant = (dom_row.category if dom_row else None)
  summary = f'Nesta semana voce gastou mais com {dominant or "outros"} e seu saldo esta dentro do planejado.'

  return WeeklySummaryResponse(
    entries=float(entries),
    exits=float(exits),
    savings=float(entries - exits),
    biggest_expense=float(biggest_expense),
    dominant_category=dominant,
    carinne_summary=summary,
  )


def _insights(db: Session, user_id: int) -> list[FinancialInsight]:
  now = datetime.utcnow()
  month_start, month_end = _month_range(now)
  last_month_end = month_start
  if month_start.month == 1:
    last_month_start = month_start.replace(year=month_start.year - 1, month=12)
  else:
    last_month_start = month_start.replace(month=month_start.month - 1)

  delivery = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= month_start,
    Transaction.date < month_end,
    Transaction.category.ilike('%delivery%'),
  ).scalar() or 0.0

  saturday = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    func.extract('dow', Transaction.date) == 6,
    Transaction.date >= month_start,
    Transaction.date < month_end,
  ).scalar() or 0.0

  dom_row = db.query(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0.0).label('amount')).filter(
    Transaction.user_id == user_id,
    Transaction.type == TransactionType.expense,
    Transaction.date >= month_start,
    Transaction.date < month_end,
  ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).first()

  save_this = (db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.income, Transaction.date >= month_start, Transaction.date < month_end).scalar() or 0.0) - (
    db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.expense, Transaction.date >= month_start, Transaction.date < month_end).scalar() or 0.0
  )
  save_last = (db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.income, Transaction.date >= last_month_start, Transaction.date < last_month_end).scalar() or 0.0) - (
    db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.user_id == user_id, Transaction.type == TransactionType.expense, Transaction.date >= last_month_start, Transaction.date < last_month_end).scalar() or 0.0
  )

  growth = 0.0
  if save_last > 0:
    growth = ((save_this - save_last) / save_last) * 100.0

  items = [
    FinancialInsight(text=f'Voce gastou R$ {float(delivery):.2f} em delivery este mes.'),
    FinancialInsight(text=f'Nos sabados seus gastos somam R$ {float(saturday):.2f} no mes atual.'),
    FinancialInsight(text=f'Seu maior gasto recorrente no mes e {dom_row.category if dom_row else "outros"}.'),
  ]
  if save_last > 0:
    signal = 'mais' if growth >= 0 else 'menos'
    items.append(FinancialInsight(text=f'Voce economizou {abs(growth):.2f}% {signal} que no mes passado.'))

  return items


@router.get('/dashboard', response_model=WalletDashboardResponse)
def wallet_dashboard(db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  summary = _summary(db, user.id)
  today = _today(db, user.id)
  yesterday = _yesterday(db, user.id)
  upcoming = _pending_bills(db, user.id)[:8]

  return WalletDashboardResponse(
    summary=summary,
    today=today,
    yesterday=yesterday,
    upcoming_bills=[
      WalletBillResponse(id=b.id, title=b.title, amount=float(b.amount), due_date=b.due_date, category=b.category, paid=b.paid) for b in upcoming
    ],
    category_breakdown=_category_breakdown(db, user.id),
    goals=_goals(db, user.id),
    weekly_summary=_weekly_summary(db, user.id),
    insights=_insights(db, user.id),
  )


@router.post('/quick-income', status_code=201)
def quick_income(payload: QuickIncomeCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  db.add(Transaction(amount=payload.amount, type=TransactionType.income, category=payload.category, description=payload.description, user_id=user.id))
  db.commit()
  return {'status': 'ok'}


@router.post('/quick-expense', status_code=201)
def quick_expense(payload: QuickExpenseCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  db.add(Transaction(amount=payload.amount, type=TransactionType.expense, category=payload.category, description=payload.description, user_id=user.id))
  db.commit()
  return {'status': 'ok'}


@router.post('/bills', response_model=WalletBillResponse, status_code=201)
def create_bill(payload: BillCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  bill = WalletBill(user_id=user.id, title=payload.title, amount=payload.amount, due_date=payload.due_date, category=payload.category, paid=False)
  db.add(bill)
  db.commit()
  db.refresh(bill)
  return WalletBillResponse(id=bill.id, title=bill.title, amount=float(bill.amount), due_date=bill.due_date, category=bill.category, paid=bill.paid)


@router.post('/bills/{bill_id}/pay', status_code=200)
def pay_bill(bill_id: int, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  bill = db.query(WalletBill).filter(WalletBill.id == bill_id, WalletBill.user_id == user.id).first()
  if not bill:
    raise HTTPException(status_code=404, detail='Conta nao encontrada')
  if bill.paid:
    return {'status': 'already_paid'}

  bill.paid = True
  bill.paid_at = datetime.utcnow()
  db.add(Transaction(amount=bill.amount, type=TransactionType.expense, category=bill.category, description=f'Pagamento: {bill.title}', user_id=user.id))
  db.commit()
  return {'status': 'ok'}


@router.post('/goals', response_model=SavingsGoalResponse, status_code=201)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  goal = SavingsGoal(
    user_id=user.id,
    title=payload.title,
    target_amount=payload.target_amount,
    current_amount=payload.current_amount,
    monthly_contribution=payload.monthly_contribution,
    is_active=True,
  )
  db.add(goal)
  db.commit()
  db.refresh(goal)
  eta = int(((max(0.0, goal.target_amount - goal.current_amount)) / max(1.0, goal.monthly_contribution or 1.0)) + 0.999)
  return SavingsGoalResponse(
    id=goal.id,
    title=goal.title,
    target_amount=float(goal.target_amount),
    current_amount=float(goal.current_amount),
    monthly_contribution=float(goal.monthly_contribution),
    eta_months=eta,
    is_active=goal.is_active,
  )


@router.patch('/goals/{goal_id}', response_model=SavingsGoalResponse)
def update_goal(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  goal = db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id).first()
  if not goal:
    raise HTTPException(status_code=404, detail='Meta nao encontrada')

  if payload.current_amount is not None:
    goal.current_amount = payload.current_amount
  if payload.monthly_contribution is not None:
    goal.monthly_contribution = payload.monthly_contribution
  if payload.is_active is not None:
    goal.is_active = payload.is_active
  db.commit()

  progress = _summary(db, user.id).monthly_saving_current
  monthly_rate = goal.monthly_contribution if goal.monthly_contribution > 0 else max(1.0, progress)
  eta = int((max(0.0, goal.target_amount - goal.current_amount) / max(1.0, monthly_rate)) + 0.999)
  return SavingsGoalResponse(
    id=goal.id,
    title=goal.title,
    target_amount=float(goal.target_amount),
    current_amount=float(goal.current_amount),
    monthly_contribution=float(goal.monthly_contribution),
    eta_months=eta,
    is_active=goal.is_active,
  )


@router.put('/monthly-target', status_code=200)
def update_monthly_target(payload: MonthlyTargetUpdate, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  profile = _get_or_create_profile(db, user.id)
  profile.monthly_saving_target = payload.monthly_saving_target
  db.commit()
  return {'status': 'ok'}


@router.post('/can-buy', response_model=CanBuyResponse)
def can_buy(payload: CanBuyRequest, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  summary = _summary(db, user.id)

  projected = summary.month_end_forecast - payload.amount
  impact = min(payload.amount, summary.monthly_saving_target)

  upcoming_important = [b for b in _pending_bills(db, user.id) if b.due_date <= datetime.utcnow() + timedelta(days=7)]
  has_important_bills = len(upcoming_important) > 0

  if summary.real_available >= payload.amount and projected >= 0 and not has_important_bills:
    return CanBuyResponse(
      recommended=True,
      message='Voce pode comprar. O impacto esta dentro do seu contexto financeiro atual.',
      impact_saving_delta=float(impact),
      projected_end_month_balance=float(projected),
    )

  return CanBuyResponse(
    recommended=False,
    message='Nao recomendado. Existem contas importantes e risco no saldo projetado dos proximos dias.',
    impact_saving_delta=float(impact),
    projected_end_month_balance=float(projected),
  )


@router.post('/intent')
def wallet_intent(payload: WalletIntentRequest, db: Session = Depends(get_db)):
  user = get_or_create_user(db)
  cmd = (payload.command or '').lower().strip()

  m_spent = re.search(r'gastei\s+(\d+[\,\.]?\d*)', cmd)
  if m_spent:
    amount = float(m_spent.group(1).replace(',', '.'))
    category = 'outros'
    if 'padaria' in cmd:
      category = 'alimentacao'
    db.add(Transaction(amount=amount, type=TransactionType.expense, category=category, description=payload.command, user_id=user.id))
    db.commit()
    return {'intent': 'REGISTRAR_GASTO', 'message': f'Registrei gasto de R$ {amount:.2f} em {category}.'}

  m_income = re.search(r'recebi\s+(\d+[\,\.]?\d*)', cmd)
  if m_income:
    amount = float(m_income.group(1).replace(',', '.'))
    db.add(Transaction(amount=amount, type=TransactionType.income, category='entrada', description=payload.command, user_id=user.id))
    db.commit()
    return {'intent': 'REGISTRAR_ENTRADA', 'message': f'Registrei entrada de R$ {amount:.2f}.'}

  if 'paguei a internet' in cmd:
    bill = db.query(WalletBill).filter(WalletBill.user_id == user.id, WalletBill.paid == False, WalletBill.title.ilike('%internet%')).order_by(WalletBill.due_date.asc()).first()
    if not bill:
      return {'intent': 'PAGAR_CONTA', 'message': 'Nao encontrei conta pendente de internet.'}
    bill.paid = True
    bill.paid_at = datetime.utcnow()
    db.add(Transaction(amount=bill.amount, type=TransactionType.expense, category=bill.category, description=f'Pagamento: {bill.title}', user_id=user.id))
    db.commit()
    return {'intent': 'PAGAR_CONTA', 'message': f'Conta {bill.title} registrada como paga.'}

  m_buy = re.search(r'posso\s+comprar.*?r\$?\s*(\d+[\,\.]?\d*)', cmd)
  if m_buy:
    amount = float(m_buy.group(1).replace(',', '.'))
    result = can_buy(CanBuyRequest(product='produto informado por voz', amount=amount), db)
    return {
      'intent': 'POSSO_COMPRAR',
      'message': result.message,
      'recommended': result.recommended,
      'impact_saving_delta': result.impact_saving_delta,
      'projected_end_month_balance': result.projected_end_month_balance,
    }

  return {'intent': 'UNKNOWN', 'message': 'Comando financeiro nao reconhecido.'}
