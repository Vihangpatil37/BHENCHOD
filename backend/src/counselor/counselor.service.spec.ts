import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { CounselorService } from './counselor.service';
import { ContextBuilderService } from './context-builder.service';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { StudentProfile } from '../onboarding/schemas/student-profile.schema';
import { Recommendation } from '../recommendation/schemas/recommendation.schema';
import { Career } from '../careers/schemas/career.schema';

const makeModel = () => {
  const exec = jest.fn();
  const fn: any = function (this: any, data: any) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(undefined);
  };
  const query = { exec, sort: () => query, limit: () => query };
  fn.findOne = jest.fn(() => query);
  fn.findById = jest.fn(() => query);
  fn.find = jest.fn(() => query);
  return fn;
};

// --- Pure-logic: classifyIntent ---

describe('classifyIntent', () => {
  let classify: (text: string) => string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CounselorService,
        { provide: getModelToken('Conversation'), useValue: makeModel() },
        { provide: getModelToken('ConversationMessage'), useValue: makeModel() },
        { provide: getModelToken(StudentProfile.name), useValue: makeModel() },
        { provide: getModelToken(Recommendation.name), useValue: makeModel() },
        { provide: getModelToken(Career.name), useValue: makeModel() },
        { provide: ContextBuilderService, useValue: { buildContext: jest.fn() } },
        { provide: AIServiceClient, useValue: { run: jest.fn() } },
      ],
    }).compile();
    classify = (t: string) => (module.get(CounselorService) as any).classifyIntent(t);
  });

  it('roadmap_question from "roadmap"', () => expect(classify('What is the roadmap?')).toBe('roadmap_question'));
  it('roadmap_question from "step"', () => expect(classify('What steps?')).toBe('roadmap_question'));
  it('roadmap_question from "path"', () => expect(classify('Career path?')).toBe('roadmap_question'));
  it('roadmap_question from "how to"', () => expect(classify('How to become?')).toBe('roadmap_question'));
  it('career_question from "career"', () => expect(classify('Tell me about this career')).toBe('career_question'));
  it('career_question from "salary"', () => expect(classify('Salary range?')).toBe('career_question'));
  it('career_question from "job"', () => expect(classify('What jobs?')).toBe('career_question'));
  it('career_question from "work"', () => expect(classify('What kind of work?')).toBe('career_question'));
  it('general_chat for ordinary', () => expect(classify('Hello!')).toBe('general_chat'));
  it('case-insensitive', () => expect(classify('ROADMAP')).toBe('roadmap_question'));
});

// --- Pure-logic: applySafetyFilter ---

describe('applySafetyFilter', () => {
  let filter: (text: string) => string;
  let logWarn: jest.SpyInstance;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CounselorService,
        { provide: getModelToken('Conversation'), useValue: makeModel() },
        { provide: getModelToken('ConversationMessage'), useValue: makeModel() },
        { provide: getModelToken(StudentProfile.name), useValue: makeModel() },
        { provide: getModelToken(Recommendation.name), useValue: makeModel() },
        { provide: getModelToken(Career.name), useValue: makeModel() },
        { provide: ContextBuilderService, useValue: { buildContext: jest.fn() } },
        { provide: AIServiceClient, useValue: { run: jest.fn() } },
      ],
    }).compile();
    const srv = module.get(CounselorService);
    filter = (t: string) => (srv as any).applySafetyFilter(t);
    logWarn = jest.spyOn((srv as any).logger, 'warn').mockImplementation(() => {});
  });

  afterAll(() => logWarn.mockRestore());

  it('replaces "hack"', () => expect(filter('hack the system')).toBe('*** the system'));
  it('replaces "kill"', () => expect(filter('this will kill')).toBe('this will ***'));
  it('replaces "suicide"', () => expect(filter('suicide is not')).toBe('*** is not'));
  it('replaces "bomb"', () => expect(filter('make a bomb')).toBe('make a ***'));
  it('case-insensitive', () => expect(filter('HACK')).toBe('***'));
  it('passes clean text', () => expect(filter('What careers?')).toBe('What careers?'));
  it('logs warning on blocklist hit', () => { filter('hack'); expect(logWarn).toHaveBeenCalled(); });
});

// --- sendMessage ---

describe('sendMessage', () => {
  let service: CounselorService;

  beforeEach(async () => {
    const convModel = makeModel();
    const msgModel = makeModel();
    const profModel = makeModel();
    const recModel = makeModel();
    const careModel = makeModel();

    // extract exec fns for wiring — they're the same ref used by each model's query chain
    const execs = {
      conv: convModel.findById()!.exec,
      msg: msgModel.find()!.exec,
      prof: profModel.findOne()!.exec,
      rec: recModel.findOne()!.exec,
      care: careModel.find()!.exec,
    };

    // trace: findById -> exec finds conversation
    execs.conv.mockResolvedValue({ user_id: 'user-1', set: jest.fn(), save: jest.fn() });
    // trace: findOne -> exec finds profile
    execs.prof.mockResolvedValue({ user_id: 'user-1', interests: {}, skills: {}, goals: [], work_preferences: [], personal: {}, constraints: {}, academic: {} });
    // trace: findOne -> sort -> exec finds rec (null = fallback to top seeding)
    execs.rec.mockResolvedValue(null);
    // trace: find -> limit -> exec for top seeding
    execs.care.mockResolvedValue([]);
    // trace: find -> sort -> exec for messages
    execs.msg.mockResolvedValue([]);

    const module = await Test.createTestingModule({
      providers: [
        CounselorService,
        { provide: getModelToken('Conversation'), useValue: convModel },
        { provide: getModelToken('ConversationMessage'), useValue: msgModel },
        { provide: getModelToken(StudentProfile.name), useValue: profModel },
        { provide: getModelToken(Recommendation.name), useValue: recModel },
        { provide: getModelToken(Career.name), useValue: careModel },
        { provide: ContextBuilderService, useValue: { buildContext: jest.fn().mockResolvedValue({}) } },
        { provide: AIServiceClient, useValue: { run: jest.fn().mockResolvedValue({ success: true, data: { reply: 'Hello there' } }) } },
      ],
    }).compile();
    service = module.get(CounselorService);
  });

  it('rejects unauthorized session', async () => {
    await expect(service.sendMessage('other', 'sid', 'Hi')).rejects.toThrow(NotFoundException);
  });

  it('returns counselor reply', async () => {
    const result = await service.sendMessage('user-1', 'sid', 'Hi');
    expect(result.role).toBe('counselor');
    expect(result.content).toBe('Hello there');
  });
});
