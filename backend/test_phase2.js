const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { CareersService } = require('./dist/careers/careers.service');
const { AuthService } = require('./dist/auth/auth.service');

const runTest = async () => {
  console.log('Starting Phase 2 Integration Tests...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const careersService = app.get(CareersService);
  const authService = app.get(AuthService);

  // 1. Check Seeding is correct
  const allCareers = await careersService.findAll();
  console.log(`\nVerified catalog size: ${allCareers.length} careers (Target: ~40)`);
  if (allCareers.length !== 40) {
    throw new Error(`Seeded careers count mismatch: expected 40, got ${allCareers.length}`);
  }

  // Verify first career
  const sample = allCareers[0];
  console.log('\nSample career details:');
  console.log('Name:', sample.name);
  console.log('Code:', sample.career_code);
  console.log('Category:', sample.category_code);
  console.log('Trait Weights (analytical_thinking):', sample.trait_weights?.analytical_thinking);
  console.log('Eligibility (min_maths):', sample.eligibility?.min_maths);

  if (
    !sample.trait_weights ||
    sample.trait_weights.analytical_thinking < 0 ||
    sample.trait_weights.analytical_thinking > 100
  ) {
    throw new Error('Trait weights validation error: analytical_thinking must be between 0 and 100');
  }

  if (!sample.eligibility || sample.eligibility.min_maths < 0) {
    throw new Error('Eligibility validation error: min_maths must be non-negative');
  }

  // 2. Test Category extraction
  const categories = await careersService.findCategories();
  console.log('\nVerification categories found:', categories);
  if (!categories.includes('technology') || !categories.includes('healthcare')) {
    throw new Error('Categories retrieval failed or incomplete');
  }

  // 3. Test Search & Filter
  const techCareers = await careersService.findAll('technology');
  console.log(`\nFound ${techCareers.length} technology careers.`);
  const filtered = await careersService.findAll(undefined, 'Software');
  console.log(`Search for "Software" found:`, filtered.map((c) => c.name));
  if (filtered.length === 0 || filtered[0].career_code !== 'software_engineer') {
    throw new Error('Career search filtering failed');
  }

  // 4. Test User Save/Unsave operations
  // Register a dummy user
  const email = `career_user_${Date.now()}@example.com`;
  const registerDto = {
    email,
    password: 'password123',
    full_name: 'Test Career Student',
  };
  const registeredUser = await authService.register(registerDto);
  const userId = registeredUser.user_id;

  console.log(`\nCreated test user ID: ${userId}`);

  // Save Software Engineer
  await careersService.saveCareer(userId, 'software_engineer');
  let savedStatus = await careersService.getSavedStatus(userId, 'software_engineer');
  console.log('Saved Software Engineer? Status:', savedStatus.saved);
  if (!savedStatus.saved) {
    throw new Error('Saving career failed');
  }

  // Check saved list
  const savedList = await careersService.getSavedCareers(userId);
  console.log('Saved Careers list:', savedList.map(c => c.name));
  if (savedList.length !== 1 || savedList[0].career_code !== 'software_engineer') {
    throw new Error('Retrieving saved list failed');
  }

  // Unsave
  await careersService.unsaveCareer(userId, 'software_engineer');
  savedStatus = await careersService.getSavedStatus(userId, 'software_engineer');
  console.log('After unsave, is Software Engineer saved?', savedStatus.saved);
  if (savedStatus.saved) {
    throw new Error('Unsaving career failed');
  }

  // 5. Check LLM backfill router configuration
  const { RouterService } = require('./dist/ai-service/router.service');
  const routerService = app.get(RouterService);
  const route = routerService.getRoute('career_trait_backfill');
  console.log('\nAI router config for career_trait_backfill:', route);
  if (!route || route[0].provider !== 'glm') {
    throw new Error('career_trait_backfill routing is incorrect');
  }

  await app.close();
  console.log('\nPhase 2 Integration Tests Finished Successfully!');
};

runTest().catch((e) => {
  console.error('Test run error:', e);
  process.exit(1);
});
