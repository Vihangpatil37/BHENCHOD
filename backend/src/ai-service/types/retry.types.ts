export type AIErrorCategory =
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'OVERLOADED'
  | 'AUTH_ERROR'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface RetryPolicy {
  retrySameKey: boolean;
  nextKey: boolean;
  nextProvider: boolean;
}

export interface AttemptPlanItem {
  provider: string;
  model: string;
  keyIndex: number;
  totalKeysForProvider: number;
  apiKey: string;
}

export interface AttemptRecord {
  provider: string;
  model: string;
  keyIndex: number;
  totalKeys: number;
  startedAt: number;
  durationMs: number;
  success: boolean;
  errorCategory?: AIErrorCategory;
  errorMessage?: string;
  statusCode?: number;
}

export interface RetryContext {
  traceId: string;
  task: string;
  attempt: number;
  maxAttempts: number;
  provider: string;
  model: string;
  keyIndex: number;
  totalKeys: number;
  startedAt: number;
  deadline: number;
  history: AttemptRecord[];
}

export interface RetryExecutionResult {
  provider: string;
  model: string;
  success: boolean;
  data: any;
  input_tokens: number;
  output_tokens: number;
  fallback_used: boolean;
  latency_ms: number;
}
