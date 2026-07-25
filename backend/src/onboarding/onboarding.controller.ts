import {
  Controller,
  Post,
  Put,
  Get,
  Param,
  Body,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import {
  SavePersonalStepDto,
  SaveAcademicStepDto,
  SaveInterestsStepDto,
  SaveSkillsStepDto,
  SaveGoalsStepDto,
  SaveWorkPreferencesStepDto,
  SaveConstraintsStepDto,
  SaveScenariosStepDto,
} from './dto/onboarding-step.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('start')
  async start(@Request() req: any) {
    return this.onboardingService.startOnboarding(req.user.user_id);
  }

  @Get('resume')
  async resume(@Request() req: any) {
    return this.onboardingService.resumeOnboarding(req.user.user_id);
  }

  @Put('step/:stepKey')
  async saveStep(
    @Request() req: any,
    @Param('stepKey') stepKey: string,
    @Body() body: any,
  ) {
    const userId = req.user.user_id;
    const normalizedStep = stepKey.toLowerCase();

    // Select the appropriate DTO class based on step key
    let dtoClass: any;
    switch (normalizedStep) {
      case 'personal':
        dtoClass = SavePersonalStepDto;
        break;
      case 'academic':
        dtoClass = SaveAcademicStepDto;
        break;
      case 'interests':
        dtoClass = SaveInterestsStepDto;
        break;
      case 'skills':
        dtoClass = SaveSkillsStepDto;
        break;
      case 'goals':
        dtoClass = SaveGoalsStepDto;
        break;
      case 'work_preferences':
        dtoClass = SaveWorkPreferencesStepDto;
        break;
      case 'constraints':
        dtoClass = SaveConstraintsStepDto;
        break;
      case 'scenarios':
        dtoClass = SaveScenariosStepDto;
        break;
      default:
        throw new BadRequestException(`Invalid onboarding step: ${stepKey}`);
    }

    // Perform dynamic class validation
    const dtoInstance = plainToInstance(dtoClass, body);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      // Format validation errors to match validation filter format
      const errorMessages = errors.flatMap((err) =>
        Object.values(err.constraints || {}),
      );
      throw new BadRequestException(errorMessages);
    }

    return this.onboardingService.saveStep(userId, normalizedStep, dtoInstance);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Request() req: any) {
    return this.onboardingService.completeOnboarding(req.user.user_id);
  }

  @Get('scenarios')
  async getScenarios(@Request() req: any) {
    return this.onboardingService.generateScenarios(req.user.user_id);
  }

  @Get('student-dna')
  async getStudentDNA(@Request() req: any) {
    return this.onboardingService.getDNA(req.user.user_id);
  }
}
