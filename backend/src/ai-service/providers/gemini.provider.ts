import { Injectable } from '@nestjs/common';
import { AbstractLLMProvider, ProviderResponse } from './provider.interface';
import { providerModels } from '../config/provider-models.config';
import axios from 'axios';

@Injectable()
export class GeminiProvider implements AbstractLLMProvider {
  readonly name = 'gemini';

  async call(
    model: string,
    apiKey: string,
    prompt: string,
    systemInstruction?: string,
    jsonSchema?: any
  ): Promise<ProviderResponse> {
    const apiVersion = providerModels.gemini.api_version ?? 'v1';
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
    
    const contents: any[] = [{ parts: [{ text: prompt }] }];
    const body: any = { contents };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    body.generation_config = {};
    if (jsonSchema) {
      body.generation_config.response_mime_type = 'application/json';
    }

    try {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: parseInt(process.env.AI_SERVICE_DEFAULT_TIMEOUT_MS || '15000'),
      });

      const candidate = response.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      // Try to parse JSON if expected
      let parsedData = text;
      if (jsonSchema || text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          parsedData = JSON.parse(text);
        } catch (e) {
          // Let downstream json-validator repair it if possible
          parsedData = text;
        }
      }

      const usage = response.data?.usageMetadata || {};

      return {
        success: true,
        data: parsedData,
        input_tokens: usage.promptTokenCount || 0,
        output_tokens: usage.candidatesTokenCount || 0,
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
