export interface ProviderResponse {
  success: boolean;
  data: any; // Parsed or raw content
  input_tokens: number;
  output_tokens: number;
  error?: string;
}

export interface AbstractLLMProvider {
  name: string;
  call(
    model: string,
    apiKey: string,
    prompt: string,
    systemInstruction?: string,
    jsonSchema?: any
  ): Promise<ProviderResponse>;
}
