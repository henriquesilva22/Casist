from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class QuickIncomeCreate(BaseModel):
  amount: float = Field(..., gt=0)
  description: Optional[str] = None
  category: str = 'entrada'


class QuickExpenseCreate(BaseModel):
  amount: float = Field(..., gt=0)
  description: Optional[str] = None
  category: str = 'outros'


class BillCreate(BaseModel):
  title: str
  amount: float = Field(..., gt=0)
  due_date: datetime
  category: str = 'conta'


class GoalCreate(BaseModel):
  title: str
  target_amount: float = Field(..., gt=0)
  current_amount: float = Field(0, ge=0)
  monthly_contribution: float = Field(0, ge=0)


class GoalUpdate(BaseModel):
  current_amount: Optional[float] = Field(None, ge=0)
  monthly_contribution: Optional[float] = Field(None, ge=0)
  is_active: Optional[bool] = None


class MonthlyTargetUpdate(BaseModel):
  monthly_saving_target: float = Field(..., ge=0)


class CanBuyRequest(BaseModel):
  product: str
  amount: float = Field(..., gt=0)


class CanBuyResponse(BaseModel):
  recommended: bool
  message: str
  impact_saving_delta: float
  projected_end_month_balance: float


class WalletBillResponse(BaseModel):
  id: int
  title: str
  amount: float
  due_date: datetime
  category: str
  paid: bool


class SavingsGoalResponse(BaseModel):
  id: int
  title: str
  target_amount: float
  current_amount: float
  monthly_contribution: float
  eta_months: Optional[int] = None
  is_active: bool


class WalletSummaryResponse(BaseModel):
  current_balance: float
  next_payment_date: Optional[datetime] = None
  next_payment_amount: Optional[float] = None
  pending_bills_count: int
  pending_bills_total: float
  real_available: float
  monthly_saving_current: float
  monthly_saving_target: float
  month_end_forecast: float


class WalletTodayResponse(BaseModel):
  spent_today: float
  recommended_limit_today: float
  difference: float
  biggest_expense_today: float
  biggest_expense_category: Optional[str] = None
  categories_today: dict[str, float]


class WalletYesterdayResponse(BaseModel):
  spent_today: float
  spent_yesterday: float
  difference_vs_yesterday: float
  comparison_text: str


class CategoryBreakdownItem(BaseModel):
  category: str
  amount: float
  percentage: float


class WeeklySummaryResponse(BaseModel):
  entries: float
  exits: float
  savings: float
  biggest_expense: float
  dominant_category: Optional[str] = None
  carinne_summary: str


class FinancialInsight(BaseModel):
  text: str


class WalletDashboardResponse(BaseModel):
  summary: WalletSummaryResponse
  today: WalletTodayResponse
  yesterday: WalletYesterdayResponse
  upcoming_bills: list[WalletBillResponse]
  category_breakdown: list[CategoryBreakdownItem]
  goals: list[SavingsGoalResponse]
  weekly_summary: WeeklySummaryResponse
  insights: list[FinancialInsight]


class WalletIntentRequest(BaseModel):
  command: str
