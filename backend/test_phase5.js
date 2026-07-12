const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { OnboardingService } = require('./dist/onboarding/onboarding.service');
const { CounselorService } = require('./dist/counselor/counselor.service');
const { AIServiceClient } = require('./dist/ai-service/ai-service.client');
const { AuthService } = require('./dist/auth/auth.service');
const { getModelToken } = require('@nestjs/mongoose');
const { AIRequestLog } = require('./dist/ai-service/ai-request-log.schema');

const runTest = async () => {
  console.log('Starting Phase 5 Counselor Integration Tests...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const onboardingService = app.get(OnboardingService);
  const counselorService = app.get(CounselorService);
  const authService = app.get(AuthService);
  const aiClient = app.get(AIServiceClient);
  const aiRequestLogModel = app.get(getModelToken(AIRequestLog.name));

  // 1. Stub the AIServiceClient.run method
  aiClient.run = async (taskType, context) => {
    console.log(`[MOCK AI SERVICE] Intercepted call to run task: ${taskType}`);
    
    // Log synthetic token entry to AIRequestLog collection to match real behavior
    const log = new aiRequestLogModel({
      task_type: taskType,
      provider: taskType === 'counselor_chat' ? 'groq' : 'mistral',
      model: taskType === 'counselor_chat' ? 'llama-3.3-70b-versatile' : 'mistral-large-latest',
      input_tokens: 100,
      output_tokens: 50,
      latency_ms: 100,
      success: true,
      fallback_used: false,
      cached: false
    });
    await log.save();

    if (taskType === 'report_summary') {
      return {
        provider: 'mistral',
        model: 'mistral-large-latest',
        task: taskType,
        success: true,
        data: {
          summary: 'Student is asking about engineering options. Counselor suggested CS pathways.'
        },
        usage: { input_tokens: 200, output_tokens: 50 },
        latency_ms: 100,
        fallback_used: false,
        cached: false
      };
    }

    if (taskType === 'career_recommendation') {
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
              explanation: 'Strong programming skills.',
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
    }

    return {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      task: taskType,
      success: true,
      data: {
        reply: `This is a helpful counselor response addressing: ${context.message}`,
        recommended_links: ['https://example.com/cs-guide'],
        suggested_questions: ['What tools should I learn?', 'Which college is best?']
      },
      usage: { input_tokens: 400, output_tokens: 150 },
      latency_ms: 150,
      fallback_used: false,
      cached: false
    };
  };

  // 2. Create a fresh test user
  const email = `counsel_user_${Date.now()}@example.com`;
  const user = await authService.register({
    email,
    password: 'password123',
    full_name: 'Counselor Test Student'
  });
  const userId = user.user_id;
  console.log(`Created test user: ${userId}`);

  // 3. Complete onboarding
  await onboardingService.startOnboarding(userId);
  await onboardingService.saveStep(userId, 'personal', {
    name: 'Counselor Test Student', dob: '2010-05-15', age: 16,
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

  console.log('\nCompleting onboarding to generate recommendations...');
  await onboardingService.completeOnboarding(userId);

  // Wait 500ms for event handling and async recommendation generation
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 4. Start chat session
  const session = await counselorService.startSession(userId, {});
  const sessionId = String(session._id);
  console.log(`\nCreated conversation session ID: ${sessionId}`);

  // Fetch history to confirm greeting message
  let history = await counselorService.getSessionHistory(userId, sessionId);
  console.log(`Initial history count: ${history.length}. First sender: ${history[0].role}. Content: ${history[0].content}`);
  if (history.length !== 1 || history[0].role !== 'counselor') {
    throw new Error('Greeting message not seeded in new conversation session');
  }

  // 5. Send message
  console.log('\nSending first message: "I want to be a software engineer..."');
  let response = await counselorService.sendMessage(userId, sessionId, 'I want to be a software engineer. What skills are needed?');
  console.log('AI Response:', response.content);

  history = await counselorService.getSessionHistory(userId, sessionId);
  console.log(`Updated history count: ${history.length}`);
  if (history.length !== 3) {
    throw new Error('Chat history was not updated with user query and counselor reply');
  }

  // 6. Test rolling history compression: send 10 more messages to trigger compression (> 10 messages)
  console.log('\nSending 10 consecutive messages to trigger rolling history summary compression...');
  for (let i = 1; i <= 10; i++) {
    await counselorService.sendMessage(userId, sessionId, `Follow up question number ${i}`);
  }

  // Fetch conversation document to check summary status
  const finalConversations = await counselorService.getSessions(userId);
  const targetConv = finalConversations.find(c => String(c._id) === sessionId);
  console.log('\nCompression check:');
  console.log('Summary:', targetConv.summary);
  if (!targetConv.summary || targetConv.summary === '') {
    throw new Error('Rolling history summary compression failed to trigger');
  }

  // Check that AIRequestLog shows entries with counselor_chat
  const chatLogs = await aiRequestLogModel.find({ task_type: 'counselor_chat' }).exec();
  console.log(`\nAIRequestLog count for counselor_chat: ${chatLogs.length}`);
  if (chatLogs.length === 0) {
    throw new Error('Counseling chat calls were not logged in AIRequestLog collection');
  }

  await app.close();
  console.log('\nPhase 5 Integration Tests Finished Successfully!');
};

runTest().catch((e) => {
  console.error('Test run error:', e);
  process.exit(1);
});
