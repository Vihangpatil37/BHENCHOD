import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class CreateCareerDto {
  @IsString()
  @IsNotEmpty()
  career_code: string;

  @IsString()
  @IsNotEmpty()
  category_code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  required_skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technical_skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  soft_skills?: string[];

  @IsString()
  @IsOptional()
  market_demand?: string;

  @IsString()
  @IsOptional()
  future_scope?: string;

  @IsString()
  @IsOptional()
  career_progression?: string;
}

export class UpdateCareerDto {
  @IsString()
  @IsOptional()
  category_code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  required_skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technical_skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  soft_skills?: string[];

  @IsString()
  @IsOptional()
  market_demand?: string;

  @IsString()
  @IsOptional()
  future_scope?: string;

  @IsString()
  @IsOptional()
  career_progression?: string;
}

export class ReviewPromoteDto {
  @IsBoolean()
  approve: boolean; // if false, discards the drafts; if true, copies draft to live
}
