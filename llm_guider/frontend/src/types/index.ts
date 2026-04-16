export interface ModelData {
  id: number
  model_id: string
  name: string
  modality: string
  tags: string[]
  description: string
  status: string
  qps: number
  latency_ms: number
  owner: string
  input_schema: Record<string, unknown>
  output_schema: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PaginatedModels {
  items: ModelData[]
  total: number
  page: number
  page_size: number
}

export interface ModelCreate {
  model_id: string
  name: string
  modality: string
  tags: string[]
  description: string
  status: string
  qps: number
  latency_ms: number
  owner: string
  input_schema: Record<string, unknown>
  output_schema: Record<string, unknown>
}

export interface ModelUpdate {
  name?: string
  modality?: string
  tags?: string[]
  description?: string
  status?: string
  qps?: number
  latency_ms?: number
  owner?: string
  input_schema?: Record<string, unknown>
  output_schema?: Record<string, unknown>
}

export interface RoutingMatch {
  model: ModelData
  score: number
  match_reasons: string[]
}

export interface RoutingResponse {
  matches: RoutingMatch[]
  log_id: number
}

export interface RuleRoutingRequest {
  modality?: string
  tags: string[]
  max_latency_ms?: number
  min_qps?: number
  status: string
}

export interface RoutingLogData {
  id: number
  query_type: string
  query_text: string
  matched_model_ids: string[]
  selected_model_id: string | null
  created_at: string
}

export interface PaginatedLogs {
  items: RoutingLogData[]
  total: number
  page: number
  page_size: number
}

export interface PlaygroundResponse {
  output: Record<string, unknown>
  latency_ms: number
  status_code: number
  model_id: string
}

// ---------- Smart Routing ----------

export interface SelectedModel {
  model_id: string
  model_name: string
  reason: string
}

export interface SmartInvocationResult {
  model_id: string
  output: Record<string, unknown>
  latency_ms: number
  success: boolean
  error_message?: string | null
}

export type SmartRoutingStatus = 'idle' | 'routing' | 'invoking' | 'completed' | 'error'

export interface SSEEvent {
  event: string
  data: Record<string, unknown>
}
