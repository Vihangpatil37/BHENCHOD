import { EligibilityEngineService } from './eligibility-engine.service';
import { StudentProfile } from '../onboarding/schemas/student-profile.schema';

const execMock = jest.fn();

const mockModel = () => ({
  find: jest.fn(() => ({ exec: execMock })),
});

const makeProfile = (overrides: any = {}): StudentProfile => ({
  user_id: 'test-uuid',
  academic: {
    class10: {
      subjects: { maths: 80, science: 70, english: 75, sst: 65, computer: 90 },
    },
  },
  constraints: {
    budget_tier: 3,
    study_duration_max: 4,
  },
  ...overrides,
} as any);

describe('EligibilityEngineService', () => {
  let service: EligibilityEngineService;
  let careerModel: any;

  beforeEach(() => {
    execMock.mockReset();
    careerModel = mockModel();
    service = new EligibilityEngineService(careerModel);
  });

  it('builds query with student scores and constraints', async () => {
    execMock.mockResolvedValue(['career1', 'career2']);
    const profile = makeProfile();
    await service.getEligibleCareers(profile);

    expect(careerModel.find).toHaveBeenCalledWith({
      'eligibility.min_maths': { $lte: 80 },
      'eligibility.min_science': { $lte: 70 },
      'eligibility.max_budget_tier': { $gte: 3 },
      'eligibility.min_study_duration_years': { $lte: 4 },
    });
  });

  it('uses zero for missing subject scores', async () => {
    execMock.mockResolvedValue([]);
    const profile = makeProfile({
      academic: { class10: { subjects: {} } },
    });
    await service.getEligibleCareers(profile);

    expect(careerModel.find).toHaveBeenCalledWith({
      'eligibility.min_maths': { $lte: 0 },
      'eligibility.min_science': { $lte: 0 },
      'eligibility.max_budget_tier': { $gte: 3 },
      'eligibility.min_study_duration_years': { $lte: 4 },
    });
  });

  it('defaults budget_tier to 4 and study_duration_max to 5 when constraints missing', async () => {
    execMock.mockResolvedValue([]);
    const profile = makeProfile({ constraints: undefined });
    await service.getEligibleCareers(profile);

    expect(careerModel.find).toHaveBeenCalledWith({
      'eligibility.min_maths': { $lte: 80 },
      'eligibility.min_science': { $lte: 70 },
      'eligibility.max_budget_tier': { $gte: 4 },
      'eligibility.min_study_duration_years': { $lte: 5 },
    });
  });

  it('returns empty array when no careers match', async () => {
    execMock.mockResolvedValue([]);
    const result = await service.getEligibleCareers(makeProfile());
    expect(result).toEqual([]);
  });
});
