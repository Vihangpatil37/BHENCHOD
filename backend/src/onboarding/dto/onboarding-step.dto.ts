import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SavePersonalStepDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  dob: string;

  @IsNumber()
  @Min(5)
  @Max(100)
  age: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  board: string;
}

export class Class10SubjectsDto {
  @IsNumber() @Min(0) @Max(100) maths: number;
  @IsNumber() @Min(0) @Max(100) science: number;
  @IsNumber() @Min(0) @Max(100) english: number;
  @IsNumber() @Min(0) @Max(100) sst: number;
  @IsNumber() @Min(0) @Max(100) computer: number;
}

export class Class10DetailsDto {
  @IsString() @IsOptional() status?: string;
  @IsNumber() @IsOptional() @Min(0) @Max(100) percentage?: number;
  @ValidateNested()
  @IsOptional()
  @Type(() => Class10SubjectsDto)
  subjects?: Class10SubjectsDto;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  favorite_subjects?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() weak_subjects?: string[];
}

export class Class12DetailsDto {
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() stream?: string;
  @IsNumber() @IsOptional() @Min(0) @Max(100) percentage?: number;
  @IsObject() @IsOptional() subjects?: Record<string, number>;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  favorite_subjects?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() weak_subjects?: string[];
}

export class SaveAcademicStepDto {
  @ValidateNested()
  @IsOptional()
  @Type(() => Class10DetailsDto)
  class10?: Class10DetailsDto;
  @ValidateNested()
  @IsOptional()
  @Type(() => Class12DetailsDto)
  class12?: Class12DetailsDto;
}

export class SaveInterestsStepDto {
  @IsNumber() @Min(0) @Max(100) technology: number;
  @IsNumber() @Min(0) @Max(100) business: number;
  @IsNumber() @Min(0) @Max(100) helping_people: number;
  @IsNumber() @Min(0) @Max(100) teaching: number;
  @IsNumber() @Min(0) @Max(100) nature: number;
  @IsNumber() @Min(0) @Max(100) research: number;
  @IsNumber() @Min(0) @Max(100) sports: number;
  @IsNumber() @Min(0) @Max(100) design: number;
  @IsNumber() @Min(0) @Max(100) media: number;
  @IsNumber() @Min(0) @Max(100) government: number;
  @IsNumber() @Min(0) @Max(100) finance: number;
  @IsNumber() @Min(0) @Max(100) machines: number;
}

export class SaveSkillsStepDto {
  @IsNumber() @Min(1) @Max(5) communication: number;
  @IsNumber() @Min(1) @Max(5) leadership: number;
  @IsNumber() @Min(1) @Max(5) problem_solving: number;
  @IsNumber() @Min(1) @Max(5) creativity: number;
  @IsNumber() @Min(1) @Max(5) logical_thinking: number;
  @IsNumber() @Min(1) @Max(5) coding: number;
  @IsNumber() @Min(1) @Max(5) drawing: number;
  @IsNumber() @Min(1) @Max(5) math: number;
  @IsNumber() @Min(1) @Max(5) observation: number;
  @IsNumber() @Min(1) @Max(5) patience: number;
}

export class SaveGoalsStepDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  goals: string[];
}

export class SaveWorkPreferencesStepDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  work_preferences: string[];
}

export class SaveConstraintsStepDto {
  @IsString()
  @IsOptional()
  govt_vs_private?: string;

  @IsNumber()
  @Min(1)
  @Max(4)
  budget_tier: number;

  @IsNumber()
  @Min(1)
  study_duration_max: number;

  @IsBoolean()
  willing_to_relocate: boolean;

  @IsBoolean()
  abroad_ok: boolean;

  @IsString()
  @IsOptional()
  preferred_location?: string;
}

export class ScenarioResponseDto {
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @IsString()
  @IsNotEmpty()
  selected_option: string;

  @IsObject()
  @IsNotEmpty()
  trait_weights: Record<string, number>;
}

export class SaveScenariosStepDto {
  @ValidateNested({ each: true })
  @Type(() => ScenarioResponseDto)
  @IsArray()
  @IsNotEmpty()
  scenario_responses: ScenarioResponseDto[];
}
