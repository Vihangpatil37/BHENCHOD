import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);
  private readonly promptsDir = path.join(__dirname, 'prompts');

  async build(
    taskType: string,
    context: Record<string, any>,
  ): Promise<{ prompt: string; systemInstruction?: string }> {
    // Standardize filename
    const filename = `${taskType.replace(/_/g, '-')}.md`;
    const filePath = path.join(this.promptsDir, filename);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Separate system instruction if present in the markdown file
      // Standard convention: Frontmatter or a block like "System Instruction:" / "=== SYSTEM ==="
      let systemInstruction: string | undefined = undefined;
      let promptBody = content;

      if (content.startsWith('---')) {
        // Parse simple markdown block metadata / frontmatter
        const sections = content.split('---');
        if (sections.length >= 3) {
          const frontmatter = sections[1];
          promptBody = sections.slice(2).join('---').trim();

          const systemMatch = frontmatter.match(
            /system_instruction:\s*([\s\S]*?)(?:\n\w+:|$)/,
          );
          if (systemMatch) {
            systemInstruction = this.interpolate(
              systemMatch[1].trim(),
              context,
            );
          }
        }
      }

      // Interpolate prompt body
      const finalPrompt = this.interpolate(promptBody, context);

      return {
        prompt: finalPrompt,
        systemInstruction,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to load prompt template for task ${taskType}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Prompt template not found or invalid: ${filename}`,
      );
    }
  }

  private interpolate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
      // Handle nested keys like user.name
      const keys = key.split('.');
      let val: any = context;

      for (const k of keys) {
        if (val === null || val === undefined || typeof val !== 'object') {
          return '';
        }
        val = val[k];
      }

      if (val === undefined || val === null) {
        return '';
      }

      if (typeof val === 'object') {
        return JSON.stringify(val, null, 2);
      }

      return String(val);
    });
  }
}
