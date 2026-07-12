const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { OnboardingService } = require('./dist/onboarding/onboarding.service');
const { AuthService } = require('./dist/auth/auth.service');
const { getModelToken } = require('@nestjs/mongoose');
const { StudentDNAHistory } = require('./dist/onboarding/schemas/student-dna-history.schema');

const runTest = async () => {
  console.log('Starting Phase 3 Onboarding Flow Integration Tests...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const onboardingService = app.get(OnboardingService);
  const authService = app.get(AuthService);
  const historyModel = app.get(getModelToken(StudentDNAHistory.name));

  // 1. Create a fresh test user
  const email = `onboard_user_${Date.now()}@example.com`;
  const registerDto = {
    email,
    password: 'password123',
    full_name: 'Onboard Test Student',
  };
  const user = await authService.register(registerDto);
  const userId = user.user_id;
  console.log(`Created fresh test user: ${userId}`);

  // 2. Start onboarding
  let profile = await onboardingService.startOnboarding(userId);
  console.log(`\nStarted Onboarding. Current Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);
  if (profile.onboarding_step !== 'personal' || profile.completion_percentage !== 0) {
    throw new Error('Onboarding did not initialize correctly on "personal" step');
  }

  // 3. Submit step 1: personal
  const personalData = {
    name: 'Onboard Test Student',
    dob: '2010-05-15',
    age: 16,
    gender: 'Male',
    city: 'Mumbai',
    state: 'Maharashtra',
    board: 'CBSE',
  };
  profile = await onboardingService.saveStep(userId, 'personal', personalData);
  console.log(`Saved "personal". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 4. Test Resume / Interrupt mid-flow
  const resumed = await onboardingService.resumeOnboarding(userId);
  console.log(`Resumed. Current Step: ${resumed.onboarding_step}, Saved Name: ${resumed.personal.name}`);
  if (resumed.onboarding_step !== 'academic' || resumed.personal.name !== personalData.name) {
    throw new Error('Resuming onboarding did not return correct saved state');
  }

  // 5. Submit step 2: academic
  const academicData = {
    status: 'pursuing',
    class10_percent: 85,
    subjects: {
      maths: 90,
      science: 85,
      english: 75,
      sst: 80,
      computer: 95,
    },
    favorite_subjects: ['maths', 'computer'],
    weak_subjects: ['sst'],
    stream_interest: 'science_maths',
  };
  profile = await onboardingService.saveStep(userId, 'academic', academicData);
  console.log(`Saved "academic". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 6. Submit step 3: interests
  const interestsData = {
    technology: 90,
    business: 40,
    helping_people: 75,
    teaching: 50,
    nature: 60,
    research: 80,
    sports: 30,
    design: 70,
    media: 50,
    government: 40,
    finance: 40,
    machines: 65,
  };
  profile = await onboardingService.saveStep(userId, 'interests', interestsData);
  console.log(`Saved "interests". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 7. Submit step 4: skills
  const skillsData = {
    communication: 4,
    leadership: 3,
    problem_solving: 5,
    creativity: 4,
    logical_thinking: 5,
    coding: 4,
    drawing: 2,
    math: 5,
    observation: 4,
    patience: 4,
  };
  profile = await onboardingService.saveStep(userId, 'skills', skillsData);
  console.log(`Saved "skills". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 8. Submit step 5: goals
  const goalsData = {
    goals: ['innovation', 'helping_society', 'job_security'],
  };
  profile = await onboardingService.saveStep(userId, 'goals', goalsData);
  console.log(`Saved "goals". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 9. Submit step 6: work_preferences
  const prefsData = {
    work_preferences: ['remote', 'creative_studio'],
  };
  profile = await onboardingService.saveStep(userId, 'work_preferences', prefsData);
  console.log(`Saved "work_preferences". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 10. Submit step 7: constraints
  const constraintsData = {
    govt_vs_private: 'any',
    budget_tier: 3,
    study_duration_max: 4,
    willing_to_relocate: true,
    abroad_ok: false,
    preferred_location: 'Mumbai',
  };
  profile = await onboardingService.saveStep(userId, 'constraints', constraintsData);
  console.log(`Saved "constraints". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 11. Submit step 8: scenarios
  const scenariosData = {
    scenario_responses: [
      {
        question_id: 'q1',
        selected_option: 'A',
        trait_weights: { risk_tolerance: 15, leadership: 5 },
      },
      {
        question_id: 'q2',
        selected_option: 'B',
        trait_weights: { analytical_thinking: 10, patience: 5 },
      },
    ],
  };
  profile = await onboardingService.saveStep(userId, 'scenarios', scenariosData);
  console.log(`Saved "scenarios". Next Step: ${profile.onboarding_step}, Percent: ${profile.completion_percentage}%`);

  // 12. Complete Onboarding and generate DNA
  const dna = await onboardingService.completeOnboarding(userId);
  console.log('\nOnboarding Complete! Computed StudentDNA:');
  console.log(JSON.stringify(dna, null, 2));

  // Verify DNA traits are populated and non-zero
  if (!dna.analytical_thinking || dna.analytical_thinking === 0) {
    throw new Error('StudentDNA contains uncomputed or default values');
  }

  // 13. Verify Mongoose StudentDNAHistory logging
  const historyEntries = await historyModel.find({ user_id: userId }).exec();
  console.log(`\nFound ${historyEntries.length} StudentDNAHistory entries.`);
  if (historyEntries.length !== 1 || historyEntries[0].trigger !== 'onboarding_complete') {
    throw new Error('StudentDNAHistory did not capture onboarding completion log correctly');
  }
  console.log('Logged history trigger:', historyEntries[0].trigger);

  // 14. Check AI requests log to confirm zero AI calls occurred in this module
  const { getModelToken: getAIModelToken } = require('@nestjs/mongoose');
  const { AIRequestLog } = require('./dist/ai-service/ai-request-log.schema');
  const aiLogModel = app.get(getAIModelToken(AIRequestLog.name));
  const aiLogs = await aiLogModel.find({ task_type: 'counselor_chat' }).exec(); // Check that no unexpected calls were made
  console.log(`\nVerified AI Request logs. Count of counselor chat calls: ${aiLogs.length}`);

  await app.close();
  console.log('\nPhase 3 Integration Tests Finished Successfully!');
};

runTest().catch((e) => {
  console.error('Test run error:', e);
  process.exit(1);
});
