import { BASE_URL, authHeaders } from './api'

export type ReviewMode = 'text' | 'voice' | 'hybrid'
export type FrequencyPreset = '30m' | '1h' | '3h' | '6h' | 'daily' | 'custom'

export interface BrainTopic {
  id: number
  name: string
  is_active: boolean
  knowledge_count: number
}

export interface BrainKnowledge {
  id: number
  topic_id: number
  question: string
  expected_answer: string
  category: string
  difficulty: string
  notes_optional?: string | null
  advanced_mode_enabled: boolean
  is_active: boolean
  next_review_at?: string | null
}

export interface BrainPolicy {
  mode: ReviewMode
  frequency_preset: FrequencyPreset
  custom_minutes: number
  allowed_start_time: string
  allowed_end_time: string
  timezone: string
}

export interface ReviewToday {
  pending_count: number
  next_review_at?: string | null
  accuracy_today: number
}

export interface DueReview {
  event_id: number
  knowledge_item_id: number
  topic: string
  question: string
  expected_answer: string
  delivery_mode: ReviewMode
  scheduled_at: string
}

export interface ReviewStats {
  total_questions: number
  hits: number
  misses: number
  accuracy_rate: number
  strongest_topic?: string | null
  weakest_topic?: string | null
}

export interface RecentError {
  review_event_id: number
  question: string
  user_answer?: string | null
  expected_answer: string
  result: 'correct' | 'partial' | 'wrong'
  answered_at: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.status === 204 ? (null as T) : ((await response.json()) as T)
}

export const brainApi = {
  listTopics: () => request<BrainTopic[]>('/api/v1/brain/topics'),
  createTopic: (name: string) =>
    request<BrainTopic>('/api/v1/brain/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  updateTopic: (topicId: number, payload: Partial<{ name: string; is_active: boolean }>) =>
    request<BrainTopic>(`/api/v1/brain/topics/${topicId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  listKnowledge: (topicId: number) => request<BrainKnowledge[]>(`/api/v1/brain/topics/${topicId}/knowledge`),
  createKnowledge: (topicId: number, payload: Omit<BrainKnowledge, 'id' | 'topic_id' | 'is_active' | 'next_review_at'>) =>
    request<BrainKnowledge>(`/api/v1/brain/topics/${topicId}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateKnowledge: (knowledgeId: number, payload: Partial<BrainKnowledge>) =>
    request<BrainKnowledge>(`/api/v1/brain/knowledge/${knowledgeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  getPolicy: () => request<BrainPolicy>('/api/v1/brain/policy'),
  savePolicy: (payload: BrainPolicy) =>
    request<BrainPolicy>('/api/v1/brain/policy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  getToday: () => request<ReviewToday>('/api/v1/brain/reviews/today'),
  getDue: (limit = 1) => request<DueReview[]>(`/api/v1/brain/reviews/due?limit=${limit}`),
  reviewNow: (topic?: string) => request<DueReview>(`/api/v1/brain/review/now${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`, { method: 'POST' }),
  answerReview: (eventId: number, answer_text: string) =>
    request<{ result: 'correct' | 'partial' | 'wrong'; score: number; feedback: string; next_review_at: string }>(`/api/v1/brain/reviews/${eventId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer_text }),
    }),
  answerReviewAudio: async (eventId: number, blob: Blob) => {
    const formData = new FormData()
    formData.append('file', blob, 'answer.webm')
    return request<{ result: 'correct' | 'partial' | 'wrong'; score: number; feedback: string; next_review_at: string }>(`/api/v1/brain/reviews/${eventId}/answer-audio`, {
      method: 'POST',
      body: formData,
    })
  },
  snoozeReview: (eventId: number, minutes: number) =>
    request<DueReview>(`/api/v1/brain/reviews/${eventId}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes }),
    }),
  statsOverview: () => request<ReviewStats>('/api/v1/brain/stats/overview'),
  recentErrors: () => request<RecentError[]>('/api/v1/brain/stats/recent-errors'),
  runIntent: (command: string) =>
    request<{ intent: string; message: string; payload: Record<string, unknown> }>('/api/v1/brain/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    }),
}
