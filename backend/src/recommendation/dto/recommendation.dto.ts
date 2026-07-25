import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class FeedbackDto {
  @IsString()
  @IsNotEmpty()
  recommendation_id: string;

  @IsString()
  @IsNotEmpty()
  career_code: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
