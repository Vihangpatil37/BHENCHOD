const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { OnboardingService } = require('./dist/onboarding/onboarding.service');
const { RecommendationService } = require('./dist/recommendation/recommendation.service');
const { CareersService } = require('./dist/careers/careers.service');
const { DashboardService } = require('./dist/dashboard/dashboard.service');
const { ReportsService } = require('./dist/reports/reports.service');
const { AnalyticsService } = require('./dist/analytics/analytics.service');
const { HistoryService } = require('./dist/history/history.service');
const { AIServiceClient } = require('./dist/ai-service/ai-service.client');
const { AuthService } = require('./dist/auth/auth.service');
const fs = require('fs');

const runTest = async () => {
  console.log('Starting Phase 6 Consumer Layer Integration Tests...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const onboardingService = app.get(OnboardingService);
  const recommendationService = app.get(RecommendationService);
  const careersService = app.get(CareersService);
  const dashboardService = app.get(DashboardService);
  const reportsService = app.get(ReportsService);
  const analyticsService = app.get(AnalyticsService);
  const historyService = app.get(HistoryService);
  const authService = app.get(AuthService);
  const aiClient = app.get(AIServiceClient);

  // 1. Stub AIServiceClient.run
  aiClient.run = async (taskType, context) => {
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
            explanation: 'Strong logical math skills.',
            roadmap: 'B.Tech CS',
            suggested_colleges: ['IIT'],
            suggested_certifications: ['AWS']
          }
        ]
      },
      usage: { input_tokens: 500, output_tokens: 200 },
      latency_ms: 100,
      fallback_used: false,
      cached: false
    };
  };

  // 2. Create a fresh test user
  const email = `consumer_user_${Date.now()}@example.com`;
  const user = await authService.register({
    email,
    password: 'password123',
    full_name: 'Consumer Test Student'
  });
  const userId = user.user_id;
  console.log(`Created test user: ${userId}`);

  // 3. Perform onboarding steps
  console.log('\nStarting onboarding questionnaire...');
  await onboardingService.startOnboarding(userId);
  await onboardingService.saveStep(userId, 'personal', {
    name: 'Consumer Test Student', dob: '2010-05-15', age: 16,
    gender: 'Male', city: 'Mumbai', state: 'Maharashtra', board: 'CBSE'
  });
  await onboardingService.saveStep(userId, 'academic', {
    status: 'pursuing', class10_percent: 85,
    subjects: { maths: 90, science: 85, english: 75, sst: 80, computer: 95 },
    favorite_subjects: ['maths', 'computer'], weak_subjects: ['sst'], stream_interest: 'science_maths'
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
  await onboardingService.saveStep(userId, 'goals', { goals: ['innovation'] });
  await onboardingService.saveStep(userId, 'work_preferences', { work_preferences: ['remote'] });
  await onboardingService.saveStep(userId, 'constraints', {
    govt_vs_private: 'any', budget_tier: 3, study_duration_max: 4,
    willing_to_relocate: true, abroad_ok: false, preferred_location: 'Mumbai'
  });
  await onboardingService.saveStep(userId, 'scenarios', {
    scenario_responses: [{ question_id: 'q1', selected_option: 'A', trait_weights: { risk_tolerance: 15 } }]
  });

  // Complete onboarding (auto-generates recommendation)
  await onboardingService.completeOnboarding(userId);

  // Wait 300ms for event hooks to process
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Save Software Engineer bookmark
  await careersService.saveCareer(userId, 'software_engineer');
  console.log('Bookmarked Software Engineer.');

  // 4. Verify Dashboard Aggregations
  console.log('\nQuerying Dashboard statistics...');
  const dashboard = await dashboardService.getDashboardData(userId);
  console.log('Journey State:', dashboard.journey.current_state);
  console.log('Onboarding Progress:', dashboard.journey.onboarding_percentage, '%');
  console.log('Recommendation Freshness:', dashboard.recommendation.stale ? 'Stale' : 'Fresh');
  console.log('Saved Careers Count:', dashboard.saved_careers.count);
  console.log('Next Action Suggested:', dashboard.next_action);
  console.log('AI Insight (Server-Side):', dashboard.ai_insight);

  if (dashboard.journey.current_state !== 'Career Explorer') {
    throw new Error(`Journey state should be Career Explorer, got: ${dashboard.journey.current_state}`);
  }
  if (dashboard.saved_careers.count !== 1) {
    throw new Error('Saved careers count mismatch');
  }

  // 5. Verify Report PDF Generation
  console.log('\nRequesting PDF report generation...');
  const report = await reportsService.startReportGeneration(userId);
  console.log(`Report generation queued with ID: ${report._id}, status: ${report.status}`);

  // Wait 1000ms for file write to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const reportStatus = await reportsService.getReportStatus(userId, String(report._id));
  console.log('After wait, report status:', reportStatus.status);
  if (reportStatus.status !== 'READY' || !reportStatus.file_ref) {
    throw new Error(`Report PDF was not generated successfully. Current Status: ${reportStatus.status}`);
  }

  // Check file exists on disk
  const fileExists = fs.existsSync(reportStatus.file_ref);
  console.log(`Verified file exists on disk: ${fileExists} (${reportStatus.file_ref})`);
  if (!fileExists) {
    throw new Error('Report PDF file reference is broken');
  }

  // Read download stream
  const downloadStream = await reportsService.getReportDownloadStream(userId, String(report._id));
  console.log('Download stream initialized. Status updated to:', (await reportsService.getReportStatus(userId, String(report._id))).status);

  // 6. Verify Analytics logging
  const events = await analyticsService.getUserEvents(userId);
  console.log(`\nVerified captured analytics events. Total events for user: ${events.length}`);
  const eventTypes = events.map((e) => e.event_type);
  console.log('Logged events:', eventTypes);

  if (!eventTypes.includes('ONBOARDING_STARTED') || !eventTypes.includes('ONBOARDING_COMPLETED')) {
    throw new Error('Onboarding events were not captured in analytics');
  }

  const platform = await analyticsService.getPlatformStats();
  console.log('Platform-wide event count summary:', platform);

  const careersStats = await analyticsService.getCareersStats();
  console.log('Saved Careers aggregated stats:', careersStats);

  const aiStats = await analyticsService.getAIStats();
  console.log('AI Performance Aggregated Stats:', aiStats);

  // 7. Verify Chronological History Feed
  const history = await historyService.getHistory(userId, 'all', 1, 10);
  console.log(`\nUnified history feed. Total count: ${history.total}`);
  console.log(history.items.map((i) => `[${i.type}] (${new Date(i.timestamp).toLocaleTimeString()}) ${i.title}`));

  if (history.items.length < 3) {
    throw new Error('History feed did not correctly merge onboarding, recommendations, and saved bookmarks');
  }

  await app.close();
  console.log('\nPhase 6 Integration Tests Finished Successfully!');
};

runTest().catch((e) => {
  console.error('Test run error:', e);
  process.exit(1);
});
