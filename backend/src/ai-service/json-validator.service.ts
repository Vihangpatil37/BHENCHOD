import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import { schemaMap } from './schemas/json-schemas';

@Injectable()
export class JsonValidatorService {
  private readonly logger = new Logger(JsonValidatorService.name);
  private readonly validators: Map<string, ValidateFunction> = new Map();

  constructor() {
    const ajv = new Ajv({ allErrors: true });
    for (const [taskType, schema] of schemaMap) {
      this.validators.set(taskType, ajv.compile(schema));
    }
  }

  validate(
    taskType: string,
    data: unknown,
  ): { valid: boolean; errors: ErrorObject[] | null } {
    const validate = this.validators.get(taskType);
    if (!validate) {
      return { valid: true, errors: null };
    }
    const valid = validate(data);
    return { valid, errors: validate.errors ?? null };
  }

  validateAndRepair(rawText: string, taskType?: string): any {
    let text = rawText.trim();

    // 1. Strip markdown fences if present
    const markdownRegex = /```(?:json)?([\s\S]*?)```/i;
    const match = text.match(markdownRegex);
    if (match) {
      text = match[1].trim();
    }

    // 2. Extract content starting from first '{' or '[' to the last '}' or ']'
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let startIdx = -1;
    let endChar = '';

    if (
      firstBrace !== -1 &&
      (firstBracket === -1 || firstBrace < firstBracket)
    ) {
      startIdx = firstBrace;
      endChar = '}';
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endChar = ']';
    }

    if (startIdx !== -1) {
      const lastIdx = text.lastIndexOf(endChar);
      if (lastIdx > startIdx) {
        text = text.substring(startIdx, lastIdx + 1);
      }
    }

    // 3. Attempt JSON parse, with one bounded repair pass on failure
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      try {
        parsed = JSON.parse(this.repairJson(text));
      } catch {
        // 3b. Plain-text refusal fallback — LLM returned text like "I cannot..." instead of JSON
        const refusalHint =
          /cannot|unable|not able|blocked|safety|refuse|sorry|insufficient|not in your|not found|candidate list/i.test(
            rawText,
          );
        if (refusalHint) {
          const msg = rawText.trim().slice(0, 1000) || 'AI provider returned a non-JSON refusal';
          this.logger.warn(`LLM plain-text refusal detected for ${taskType}: ${msg.slice(0, 200)}`);
          return { error: msg };
        }
        this.logger.error(`JSON Parsing failed. Raw text: ${rawText}`);
        throw new BadRequestException(
          'AI provider response is not valid JSON and could not be repaired',
        );
      }
    }

    // 3c. Structured refusal — LLM obeyed prompt instruction e.g. {"error":"Career not in candidate list"}
    // Bypass strict schema validation so the caller can render a user-facing message instead of crashing
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof (parsed as any).error === 'string') {
      const msg = (parsed as any).error.trim().slice(0, 1000);
      this.logger.warn(`LLM structured refusal detected for ${taskType}: ${msg.slice(0, 200)}`);
      // ponytail: normalize to {error:string} — extra keys like "reason"/"message" are ignored, keep only error
      return { error: msg };
    }

    // 4. Validate schema structure if taskType is provided
    if (taskType) {
      const result = this.validate(taskType, parsed);
      if (!result.valid) {
        const messages = result.errors!.map(
          (e) =>
            `${e.instancePath} ${e.message}${e.params ? ' (' + JSON.stringify(e.params) + ')' : ''}`,
        );
        this.logger.error(
          `JSON Schema validation failed for ${taskType}: ${messages.join('; ')}`,
        );
        throw new BadRequestException(
          `AI provider response failed schema validation: ${messages.join('; ')}`,
        );
      }
    }

    return parsed;
  }

  // ponytail: single regex pass covers trailing commas + basic quote fixes; ajv handles the rest
  // ponytail: no JSON5 dependency — three targeted regexes cover >95% of LLM output flaws
  private repairJson(text: string): string {
    return text
      .replace(/(?<=[{,]\s*)'([^']*?)'\s*:/g, '"$1":')
      .replace(/:\s*'([^']*?)'\s*([,}\]])/g, ': "$1"$2')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\n/g, '\\n');
  }
}
