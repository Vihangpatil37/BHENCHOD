const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { OnboardingService } = require('./dist/onboarding/onboarding.service');
const { RecommendationService } = require('./dist/recommendation/recommendation.service');
const { AIServiceClient } = require('./dist/ai-service/ai-service.client');
const { AuthService } = require('./dist/auth/auth.service');

const runTest = async () => {
  console.log('Starting Phase 4 Recommendation Integration Tests...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const onboardingService = app.get(OnboardingService);
  const recommendationService = app.get(RecommendationService);
  const authService = app.get(AuthService);
  const aiClient = app.get(AIServiceClient);

  // 1. Stub the AIServiceClient.run method to bypass external APIs
  aiClient.run = async (taskType, context) => {
    console.log(`[MOCK AI SERVICE] Intercepted call to run task: ${taskType}`);
    return {
      provider: 'gemini',
      model: 'gemini-2.5-pro',
      task: taskType,
      success: true,
      data: {
        final_recommendations: [
          {
            career_code: 'software_engineer',
            rank: 1,
            ai_score: 96,
            explanation: 'Perfect match for your high coding and maths scores.',
            roadmap: 'Get a B.Tech in CS -> Intern -> Junior Software Engineer.',
            suggested_colleges: ['IIT Bombay', 'BITS Pilani'],
            suggested_certifications: ['AWS Certified Developer']
          },
          {
            career_code: 'ai_engineer',
            rank: 2,
            ai_score: 94,
            explanation: 'High coding score matches your interest in technology.',
            roadmap: 'Get a B.Tech -> Learn PyTorch -> Junior AI Engineer.',
            suggested_colleges: ['IIIT Hyderabad', 'IIT Delhi'],
            suggested_certifications: ['TensorFlow Developer']
          }
        ]
      },
      usage: { input_tokens: 1200, output_tokens: 450 },
      latency_ms: 500,
      fallback_used: false,
      cached: false
    };
  };

  // 2. Create a fresh test user
  const email = `recommend_user_${Date.now()}@example.com`;
  const user = await authService.register({
    email,
    password: 'password123',
    full_name: 'Recommend Test Student'
  });
  const userId = user.user_id;
  console.log(`Created test user: ${userId}`);

  // 3. Complete onboarding for this user
  await onboardingService.startOnboarding(userId);
  await onboardingService.saveStep(userId, 'personal', {
    name: 'Recommend Test Student',
    dob: '2010-05-15',
    age: 16,
    gender: 'Male',
    city: 'Mumbai',
    state: 'Maharashtra',
    board: 'CBSE'
  });
  await onboardingService.saveStep(userId, 'academic', {
    status: 'pursuing',
    class10_percent: 85,
    subjects: { maths: 90, science: 85, english: 75, sst: 80, computer: 95 },
    favorite_subjects: ['maths', 'computer'],
    weak_subjects: ['sst'],
    stream_interest: 'science_maths'
  });
  await onboardingService.saveStep(userId, 'interests', {
    technology: 90, business: 40, helping_people: 75, teaching: 50,
    nature: 60, research: 80, sports: 30, design: 70, media: 50,
    government: 40, finance: 40, machines: 65
  });
  await onboardingService.saveStep(userId, 'skills', {
    communication: 4, leadership: 3, problem_solving: 5, creativity: 4,
    logical_thinking: 5, coding: 4, drawing: 2, math: 5, observation: 4, patience: 4
  });
  await onboardingService.saveStep(userId, 'goals', { goals: ['innovation', 'helping_society'] });
  await onboardingService.saveStep(userId, 'work_preferences', { work_preferences: ['remote'] });
  await onboardingService.saveStep(userId, 'constraints', {
    govt_vs_private: 'any', budget_tier: 3, study_duration_max: 4,
    willing_to_relocate: true, abroad_ok: false, preferred_location: 'Mumbai'
  });
  await onboardingService.saveStep(userId, 'scenarios', {
    scenario_responses: [
      { question_id: 'q1', selected_option: 'A', trait_weights: { risk_tolerance: 15 } }
    ]
  });

  // Complete onboarding (should trigger auto-recommendation via event emitter!)
  console.log('\nCompleting onboarding...');
  await onboardingService.completeOnboarding(userId);

  // Wait 500ms for event handling and async recommendation generation
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 4. Retrieve recommendation
  const rec = await recommendationService.getLatestRecommendation(userId);
  console.log('\nVerification of auto-generated recommendation:');
  console.log('ID:', rec._id);
  console.log('Eligible Count after filters:', rec.eligible_count);
  console.log('Shortlist (Top 5 matches in shortlist):', rec.shortlist.slice(0, 5));
  console.log('Final recommendations length:', rec.final_recommendations.length);
  console.log('Top recommendation code:', rec.final_recommendations[0].career_code);
  console.log('Is stale:', rec.stale);

  if (rec.eligible_count === 0 || rec.shortlist.length === 0) {
    throw new Error('Eligibility or Matching engine failed to output candidates');
  }

  if (rec.final_recommendations.length !== 2 || rec.stale !== false) {
    throw new Error('AI Personalization or staleness check failed');
  }

  // 5. Submit feedback
  const feedback = await recommendationService.submitFeedback(userId, {
    recommendation_id: String(rec._id),
    career_code: 'software_engineer',
    rating: 5,
    comment: 'Great analysis!'
  });
  console.log(`\nSubmitted Feedback. Rating: ${feedback.rating}, Comment: ${feedback.comment}`);

  // 6. Test staleness hook: update profile and check if recommendation is set to stale
  console.log('\nModifying profile (updating skills step)...');
  await onboardingService.saveStep(userId, 'skills', {
    communication: 5, leadership: 4, problem_solving: 5, creativity: 5,
    logical_thinking: 5, coding: 5, drawing: 3, math: 5, observation: 5, patience: 5
  });

  // Wait 100ms for event handler to finish marking stale in database
  await new Promise((resolve) => setTimeout(resolve, 100));

  const updatedRec = await recommendationService.getLatestRecommendation(userId);
  console.log('After profile change, is recommendation stale:', updatedRec.stale);
  if (!updatedRec.stale) {
    throw new Error('Staleness hook was not triggered by profile change');
  }

  // 7. Regenerate recommendation
  console.log('\nRegenerating recommendations...');
  const freshRec = await recommendationService.regenerate(userId);
  console.log('After regeneration, is recommendation stale:', freshRec.stale);
  if (freshRec.stale !== false) {
    throw new Error('Regeneration did not clear stale flag');
  }

  await app.close();
  console.log('\nPhase 4 Integration Tests Finished Successfully!');
};

runTest().catch((e) => {
  console.error('Test run error:', e);
  process.exit(1);
});
