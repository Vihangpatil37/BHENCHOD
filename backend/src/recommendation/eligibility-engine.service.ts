import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Career, CareerDocument } from '../careers/schemas/career.schema';
import { StudentProfile } from '../onboarding/schemas/student-profile.schema';

@Injectable()
export class EligibilityEngineService {
  private readonly logger = new Logger(EligibilityEngineService.name);

  constructor(
    @InjectModel(Career.name) private readonly careerModel: Model<CareerDocument>,
  ) {}

  async getEligibleCareers(student: StudentProfile): Promise<CareerDocument[]> {
    this.logger.log(`Running Eligibility Engine for student: ${student.user_id}`);

    const mathsScore = student.academic?.subjects?.maths ?? 0;
    const scienceScore = student.academic?.subjects?.science ?? 0;
    const budgetTier = student.constraints?.budget_tier ?? 4;
    const studyDurationMax = student.constraints?.study_duration_max ?? 5;
    
    // Extra fields to check from eligibility schema
    const biologyScore = student.academic?.subjects?.computer ?? 0; // fallback or biological check if needed
    const englishScore = student.academic?.subjects?.english ?? 0;

    // Rule-based filtering pushed into MongoDB query directly for maximum scalability
    const query = {
      'eligibility.min_maths': { $lte: mathsScore },
      'eligibility.min_science': { $lte: scienceScore },
      'eligibility.max_budget_tier': { $gte: budgetTier },
      'eligibility.min_study_duration_years': { $lte: studyDurationMax },
    };

    const eligible = await this.careerModel.find(query).exec();
    this.logger.log(`Eligibility check: found ${eligible.length} careers matching hard gates`);
    
    return eligible;
  }
}
