import { Injectable } from '@nestjs/common';
import { AbstractLLMProvider, ProviderResponse } from './provider.interface';
import axios from 'axios';

@Injectable()
export class OpenRouterProvider implements AbstractLLMProvider {
  readonly name = 'openrouter';

  async call(
    model: string,
    apiKey: string,
    prompt: string,
    systemInstruction?: string,
    jsonSchema?: any,
    timeoutMs?: number,
  ): Promise<ProviderResponse> {
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const body: any = {
      model,
      messages,
    };

    if (jsonSchema) {
      body.response_format = { type: 'json_object' };
    }

    try {
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'SCPR AI Counselor',
        },
        timeout: timeoutMs || parseInt(process.env.AI_SERVICE_DEFAULT_TIMEOUT_MS || '15000'),
      });

      const choice = response.data?.choices?.[0];
      const text = choice?.message?.content;

      if (!text) {
        throw new Error('Empty response from OpenRouter API');
      }

      let parsedData = text;
      if (
        jsonSchema ||
        text.trim().startsWith('{') ||
        text.trim().startsWith('[')
      ) {
        try {
          parsedData = JSON.parse(text);
        } catch (e) {
          parsedData = text;
        }
      }

      const usage = response.data?.usage || {};

      return {
        success: true,
        data: parsedData,
        input_tokens: usage.prompt_tokens || 0,
        output_tokens: usage.completion_tokens || 0,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        input_tokens: 0,
        output_tokens: 0,
        error: error.response?.data?.error?.message || error.message,
        statusCode: error.response?.status,
        rawError: error,
      };
    }
  }
}
