import { IsString, IsObject, IsOptional } from 'class-validator';

export class AIRunRequestDto {
  @IsString()
  task_type: string;

  @IsObject()
  context: Record<string, any>;

  @IsOptional()
  @IsObject()
  json_schema?: any;
}
