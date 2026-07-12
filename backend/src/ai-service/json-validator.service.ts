import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class JsonValidatorService {
  private readonly logger = new Logger(JsonValidatorService.name);

  validateAndRepair(rawText: string, expectedSchema?: any): any {
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

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
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

    // 3. Attempt JSON parse
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e: any) {
      this.logger.error(`JSON Parsing failed: ${e.message}. Raw text: ${rawText}`);
      throw new BadRequestException(`Invalid JSON response from AI provider: ${e.message}`);
    }

    // 4. Validate schema structure if expectedSchema is provided
    if (expectedSchema && typeof expectedSchema === 'object') {
      const isValid = this.checkSchema(parsed, expectedSchema);
      if (!isValid) {
        this.logger.error(`JSON Schema validation failed. Parsed: ${JSON.stringify(parsed)}`);
        throw new BadRequestException('AI provider response failed schema validation');
      }
    }

    return parsed;
  }

  private checkSchema(data: any, schema: any): boolean {
    // Simple schema structure check. For complex checks, Zod or ajv would be used.
    // Here we've kept it lightweight as requested by specification.
    if (typeof schema !== 'object' || schema === null) {
      return true;
    }

    for (const key in schema) {
      if (schema.hasOwnProperty(key)) {
        const expectedType = typeof schema[key];
        const actualValue = data[key];

        if (actualValue === undefined) {
          return false;
        }

        if (expectedType === 'object' && actualValue !== null) {
          if (Array.isArray(schema[key])) {
            if (!Array.isArray(actualValue)) {
              return false;
            }
            // Check array element types if defined
            if (schema[key].length > 0) {
              const arraySchema = schema[key][0];
              for (const item of actualValue) {
                if (!this.checkSchema(item, arraySchema)) {
                  return false;
                }
              }
            }
          } else {
            if (!this.checkSchema(actualValue, schema[key])) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }
}
