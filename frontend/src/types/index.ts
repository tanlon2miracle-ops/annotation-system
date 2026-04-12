export interface ItemData {
  id: number
  batch_id: number
  event_id: string
  uid: string
  mall_id: string | null
  chat_list: string | null
  text: string | null
  text_type: string
  reason: string | null
  result: string | null
  result_2: string | null
  vote_result: string | null
  extra_fields: string | null
  annotation: AnnotationData | null
}

export interface AnnotationData {
  id: number
  session_id: number
  item_id: number
  result: string | null
  reason: string | null
  notes: string | null
  is_skipped: boolean
  is_flagged: boolean
  created_at: string
  updated_at: string
}

export interface BatchData {
  id: number
  filename: string
  item_count: number
  imported_at: string
}

export interface SessionData {
  id: number
  name: string
  mode: AnnotationMode
  batch_id: number
  annotator_id: string
  created_at: string
}

export interface ProgressData {
  total: number
  annotated: number
  skipped: number
  flagged: number
  remaining: number
  percent: number
}

export interface ReasonData {
  id: number
  value: string
  label: string
  sort_order: number
  is_active: boolean
}

export interface PaginatedItems {
  items: ItemData[]
  total: number
  page: number
  page_size: number
}

export type AnnotationMode = 'review_correct' | 'independent' | 'arbitration'

export type ItemStatus = 'all' | 'pending' | 'annotated' | 'skipped' | 'flagged'
