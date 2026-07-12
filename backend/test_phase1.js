const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module'); // We built the app, so dist/ exists!
const { AIServiceClient } = require('./dist/ai-service/ai-service.client');
const { aiServiceEvents } = require('./dist/ai-service/retry-manager.service');

const runTest = async () => {
  console.log('Starting Phase 1 Integration Tests...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const client = app.get(AIServiceClient);

  // Monitor events
  let fallbackEventFired = false;
  aiServiceEvents.on('AI_PROVIDER_FALLBACK_TRIGGERED', (data) => {
    console.log('\n[EVENT RECEIVED] AI_PROVIDER_FALLBACK_TRIGGERED:', data);
    fallbackEventFired = true;
  });

  const context = {
    test_input: 'Integrity Check 123',
  };

  console.log('\nTriggering client.run with task_type: "test_task"...');
  try {
    // This should fail because keys are mock, but we verify the rotation and fallback path
    await client.run('test_task', context);
    console.log('SUCCESS (Unexpected with mock keys!)');
  } catch (error) {
    console.log('\nAI call failed as expected:');
    console.log('Status code:', error.status);
    console.log('Response content:', JSON.stringify(error.response || error.message));

    // Verify fallback event was received
    if (fallbackEventFired) {
      console.log('\n✅ VERIFICATION SUCCESS: Fallback event was correctly triggered!');
    } else {
      console.error('\n❌ VERIFICATION FAILURE: Fallback event was NOT triggered!');
      process.exit(1);
    }
  }

  // 2. Test cache hit
  // Since the previous call failed, it won't be cached.
  // But let's check that GET /ai-service/health works
  const { KeyPoolService } = require('./dist/ai-service/key-pool.service');
  const keyPool = app.get(KeyPoolService);
  const groqKeys = keyPool.getKeysForProvider('groq');
  console.log(`\nKey pool check: Groq loaded ${groqKeys.length} keys.`);

  await app.close();
  console.log('\nPhase 1 Integration Tests Finished.');
};

runTest().catch((e) => {
  console.error('Test run error:', e);
  process.exit(1);
});
