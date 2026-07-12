import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StartSessionDto {
  @IsString()
  @IsOptional()
  recommendation_id?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
