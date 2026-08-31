export class SearchResultDto {
  title: string;
  url: string;
  snippet: string;
}

export class ChatResponseDto {
  response?: string;
  model_used?: string;
  cached?: boolean;
  latency_ms?: number;
  conversation_id?: string;
  jobId?: string;
  message?: string;
}
