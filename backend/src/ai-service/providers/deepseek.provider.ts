import { Injectable } from '@nestjs/common';
import { AbstractLLMProvider, ProviderResponse } from './provider.interface';
import axios from 'axios';

@Injectable()
export class DeepSeekProvider implements AbstractLLMProvider {
  readonly name = 'deepseek';

  async call(
    model: string,
    apiKey: string,
    prompt: string,
    systemInstruction?: string,
    jsonSchema?: any
  ): Promise<ProviderResponse> {
    const url = 'https://api.deepseek.com/chat/completions';
    
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
        },
        timeout: parseInt(process.env.AI_SERVICE_DEFAULT_TIMEOUT_MS || '15000'),
      });

      const choice = response.data?.choices?.[0];
      const text = choice?.message?.content;

      if (!text) {
        throw new Error('Empty response from DeepSeek API');
      }

      let parsedData = text;
      if (jsonSchema || text.trim().startsWith('{') || text.trim().startsWith('[')) {
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
      };
    }
  }
}
