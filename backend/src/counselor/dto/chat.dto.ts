import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  conversation_id?: string;
}

export class FeedbackDto {
  @IsString()
  @IsNotEmpty()
  conversation_id: string;

  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class RegenerateDto {
  @IsString()
  @IsNotEmpty()
  conversation_id: string;
}
