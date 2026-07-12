import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import {
  User,
  BookOpen,
  Sliders,
  Star,
  Target,
  Briefcase,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

const STEPS = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'academic', label: 'Academic', icon: BookOpen },
  { key: 'interests', label: 'Interests', icon: Sliders },
  { key: 'skills', label: 'Skills', icon: Star },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'work_preferences', label: 'Preferences', icon: Briefcase },
  { key: 'constraints', label: 'Constraints', icon: AlertTriangle },
  { key: 'scenarios', label: 'Scenarios', icon: HelpCircle },
];

const GOAL_OPTIONS = [
  { value: 'academic_prestige', label: 'Academic Prestige' },
  { value: 'high_salary', label: 'High Salary' },
  { value: 'work_life_balance', label: 'Work Life Balance' },
  { value: 'social_impact', label: 'Social Impact' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'job_security', label: 'Job Security' },
];

const PREFERENCE_OPTIONS = [
  { value: 'remote', label: 'Remote / Work from home' },
  { value: 'hybrid', label: 'Hybrid work model' },
  { value: 'office', label: 'Traditional office' },
  { value: 'field_work', label: 'Field work / Outdoors' },
  { value: 'travel', label: 'Frequent travel' },
];

const INTEREST_FIELDS = [
  'technology', 'business', 'helping_people', 'teaching', 'nature',
  'research', 'sports', 'design', 'media', 'government', 'finance', 'machines'
];

const SKILL_FIELDS = [
  'communication', 'leadership', 'problem_solving', 'creativity',
  'logical_thinking', 'coding', 'drawing', 'math', 'observation', 'patience'
];

const SCENARIO_QUESTIONS = [
  {
    id: 'q1',
    question: 'A critical software bug is discovered right before product launch. What is your immediate reaction?',
    options: [
      { key: 'A', text: 'Dive deep into the codebase immediately to find and patch the root cause.', traits: { logical_thinking: 10, technical_curiosity: 5 } },
      { key: 'B', text: 'Gather the development team for an emergency brainstorming session.', traits: { communication: 10, leadership: 5 } },
      { key: 'C', text: 'Formulate a mitigation plan to present to management and request a short launch extension.', traits: { business_acumen: 10, patience: 5 } },
      { key: 'D', text: 'Support the team by handling external customer alerts and communications.', traits: { empathy: 10, patience: 5 } },
    ]
  },
  {
    id: 'q2',
    question: 'You are selected to lead a new group project. Which style of execution do you prefer?',
    options: [
      { key: 'A', text: 'Define the roadmap, assign precise deliverables to members, and coordinate tasks.', traits: { leadership: 12, business_acumen: 4 } },
      { key: 'B', text: 'Conduct an open-floor discussion to collaboratively define ideas and responsibilities.', traits: { communication: 10, empathy: 6 } },
      { key: 'C', text: 'Take on the most challenging research parts myself while checking in periodically.', traits: { research: 12, technical_curiosity: 4 } },
      { key: 'D', text: 'Ensure every team member feels comfortable and supported, checking on workload stress.', traits: { empathy: 12, patience: 6 } },
    ]
  },
  {
    id: 'q3',
    question: 'You are offered a choice between a high-risk innovative startup or a highly stable government role. Which do you pick?',
    options: [
      { key: 'A', text: 'The startup, because it offers rapid learning, equity upside, and zero constraints.', traits: { risk_tolerance: 15, business_acumen: 5 } },
      { key: 'B', text: 'The government role, because it ensures predictable hours, social impact, and job security.', traits: { risk_tolerance: -10, patience: 8 } },
      { key: 'C', text: 'A research role in a major lab or university that blends stability with active discovery.', traits: { research: 12, logical_thinking: 5 } },
      { key: 'D', text: 'Neither; I prefer direct consulting or freelancing across multiple industries.', traits: { creativity: 12, risk_tolerance: 8 } },
    ]
  },
  {
    id: 'q4',
    question: 'A teammate presents an idea that is highly creative but extremely difficult to implement. You...',
    options: [
      { key: 'A', text: 'Embrace it fully, and brainstorm alternative simplified methods to build it.', traits: { creativity: 12, problem_solving: 5 } },
      { key: 'B', text: 'Draft a cost-benefit analysis evaluating resource constraints and timeline risks.', traits: { business_acumen: 12, logical_thinking: 5 } },
      { key: 'C', text: 'Politely direct focus back to simpler, reliable approaches that meet the current goals.', traits: { patience: 10, risk_tolerance: -5 } },
      { key: 'D', text: 'Propose a quick hack to build a small prototype and see if it is viable.', traits: { technical_curiosity: 12, creativity: 5 } },
    ]
  }
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Step state forms
  const [personal, setPersonal] = useState({
    name: '', dob: '', age: 17, gender: 'Male', city: '', state: '', board: 'CBSE'
  });
  const [academic, setAcademic] = useState({
    status: 'pursuing',
    class10_percent: 80,
    class12_percent: 80,
    subjects: { maths: 75, science: 75, english: 75, sst: 75, computer: 75 },
    favorite_subjects: [] as string[],
    weak_subjects: [] as string[],
    stream_interest: 'science_maths',
  });
  const [interests, setInterests] = useState<Record<string, number>>(
    INTEREST_FIELDS.reduce((acc, f) => ({ ...acc, [f]: 50 }), {})
  );
  const [skills, setSkills] = useState<Record<string, number>>(
    SKILL_FIELDS.reduce((acc, f) => ({ ...acc, [f]: 3 }), {})
  );
  const [goals, setGoals] = useState<string[]>([]);
  const [workPreferences, setWorkPreferences] = useState<string[]>([]);
  const [constraints, setConstraints] = useState({
    govt_vs_private: 'any',
    budget_tier: 3,
    study_duration_max: 4,
    willing_to_relocate: true,
    abroad_ok: false,
    preferred_location: '',
  });
  const [scenarioResponses, setScenarioResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    resumeOnboarding();
  }, []);

  const resumeOnboarding = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res: any = await client.get('/onboarding/resume');
      setProfile(res);
      
      // Populate fields from resume response
      if (res.personal) setPersonal({ ...personal, ...res.personal });
      if (res.academic) {
        setAcademic({
          ...academic,
          ...res.academic,
          subjects: { ...academic.subjects, ...res.academic.subjects }
        });
      }
      if (res.interests) {
        setInterests({ ...interests, ...res.interests });
      }
      if (res.skills) {
        setSkills({ ...skills, ...res.skills });
      }
      if (res.goals) setGoals(res.goals);
      if (res.work_preferences) setWorkPreferences(res.work_preferences);
      if (res.constraints) setConstraints({ ...constraints, ...res.constraints });
      if (res.scenarios?.scenario_responses) {
        const responses: Record<string, string> = {};
        res.scenarios.scenario_responses.forEach((sr: any) => {
          responses[sr.question_id] = sr.selected_option;
        });
        setScenarioResponses(responses);
      }

      // Set the active step index based on current step
      const stepKeys = STEPS.map(s => s.key);
      const stepIdx = stepKeys.indexOf(res.current_step || 'personal');
      if (stepIdx !== -1) {
        setCurrentStepIndex(stepIdx);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth();
        navigate('/login');
      } else {
        setErrorMessage(err.message || 'Failed to resume onboarding session.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepData = (stepKey: string) => {
    switch (stepKey) {
      case 'personal': return personal;
      case 'academic': return academic;
      case 'interests': return interests;
      case 'skills': return skills;
      case 'goals': return { goals };
      case 'work_preferences': return { work_preferences: workPreferences };
      case 'constraints': return constraints;
      case 'scenarios':
        return {
          scenario_responses: Object.entries(scenarioResponses).map(([qId, opt]) => {
            const q = SCENARIO_QUESTIONS.find((sq) => sq.id === qId);
            const selectedOpt = q?.options.find((o) => o.key === opt);
            return {
              question_id: qId,
              selected_option: opt,
              trait_weights: selectedOpt?.traits || {}
            };
          })
        };
      default: return {};
    }
  };

  const saveCurrentStep = async (moveNext = true) => {
    const stepKey = STEPS[currentStepIndex].key;
    const data = getStepData(stepKey);
    setSaving(true);
    setErrorMessage('');

    try {
      await client.put(`/onboarding/step/${stepKey}`, data);
      
      if (moveNext) {
        if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          // Last step saved, complete onboarding
          await completeOnboarding();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to save ${stepKey} step.`);
    } finally {
      setSaving(false);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    setErrorMessage('');
    try {
      await client.post('/onboarding/complete');
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete onboarding. Please verify all questions.');
    } finally {
      setSaving(false);
    }
  };

  const handleStepClick = (idx: number) => {
    // Enable jump to any step once onboarding is complete or if user is reviewing
    if (profile?.completed) {
      setCurrentStepIndex(idx);
    } else {
      // Allow moving back to previous steps, but restrict forward steps that haven't been completed yet
      if (idx <= currentStepIndex) {
        setCurrentStepIndex(idx);
      }
    }
  };

  const toggleGoal = (val: string) => {
    if (goals.includes(val)) {
      setGoals(goals.filter(g => g !== val));
    } else {
      setGoals([...goals, val]);
    }
  };

  const togglePreference = (val: string) => {
    if (workPreferences.includes(val)) {
      setWorkPreferences(workPreferences.filter(p => p !== val));
    } else {
      setWorkPreferences([...workPreferences, val]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <span className="text-text-muted font-medium">Loading questionnaire progress...</span>
      </div>
    );
  }

  const currentStep = STEPS[currentStepIndex];

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="p-6 md:p-12">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          
          {/* Header & Steps Indicator */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-black text-white">Student Onboarding</h1>
              <p className="text-text-muted text-sm mt-1">Complete your questionnaire to analyze your career preferences and traits.</p>
            </div>

            {/* Stepper bar */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = idx === currentStepIndex;
                const isCompleted = profile?.completed || idx < currentStepIndex;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleStepClick(idx)}
                    disabled={!profile?.completed && idx > currentStepIndex}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isActive
                        ? 'bg-accent/10 border-accent text-accent'
                        : isCompleted
                        ? 'bg-white/[0.05] border-white/10 text-text/80 hover:bg-white/10'
                        : 'bg-transparent border-transparent text-text-muted/40 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Box */}
          <div className="bg-white/[0.03] border border-white/10/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-6">
            
            {errorMessage && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-semibold">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Step Renderings */}
            {currentStep.key === 'personal' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <User className="h-5 w-5 text-accent" />
                  <span>Personal Details</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Full Name</label>
                    <input
                      type="text"
                      value={personal.name}
                      onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Date of Birth</label>
                    <input
                      type="date"
                      value={personal.dob ? personal.dob.split('T')[0] : ''}
                      onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Age</label>
                    <input
                      type="number"
                      value={personal.age}
                      onChange={(e) => setPersonal({ ...personal, age: parseInt(e.target.value, 10) || 16 })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Gender</label>
                    <select
                      value={personal.gender}
                      onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">City</label>
                    <input
                      type="text"
                      value={personal.city}
                      onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                      placeholder="e.g. Pune"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">State</label>
                    <input
                      type="text"
                      value={personal.state}
                      onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Education Board</label>
                    <input
                      type="text"
                      value={personal.board}
                      onChange={(e) => setPersonal({ ...personal, board: e.target.value })}
                      placeholder="e.g. CBSE / ICSE"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep.key === 'academic' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <span>Academic Standing</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-text-muted">Status</label>
                    <div className="flex gap-4">
                      {['pursuing', 'completed'].map((statusOption) => (
                        <label key={statusOption} className="flex items-center space-x-2 text-sm text-text/80 cursor-pointer">
                          <input
                            type="radio"
                            name="academicStatus"
                            value={statusOption}
                            checked={academic.status === statusOption}
                            onChange={(e) => setAcademic({ ...academic, status: e.target.value })}
                            className="text-accent focus:ring-0"
                          />
                          <span className="capitalize">{statusOption} Class 12</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Class 10 Score (%)</label>
                    <input
                      type="number"
                      value={academic.class10_percent}
                      onChange={(e) => setAcademic({ ...academic, class10_percent: parseFloat(e.target.value) || 80 })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Class 12 Score (%)</label>
                    <input
                      type="number"
                      value={academic.class12_percent}
                      onChange={(e) => setAcademic({ ...academic, class12_percent: parseFloat(e.target.value) || 80 })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Subjects Grid */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-text-muted block border-b border-white/10/60 pb-2">Subject Performance (0 - 100)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(academic.subjects).map(([subj, score]) => (
                      <div key={subj} className="bg-bg border border-white/10/80 p-3 rounded-2xl flex flex-col space-y-1 items-center">
                        <span className="text-xs font-bold text-text-muted uppercase">{subj}</span>
                        <input
                          type="number"
                          value={score}
                          onChange={(e) => {
                            const newScores = { ...academic.subjects, [subj]: parseInt(e.target.value, 10) || 75 };
                            setAcademic({ ...academic, subjects: newScores });
                          }}
                          className="w-full bg-transparent text-center text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-accent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional multi selects */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Academic Stream of Interest</label>
                    <select
                      value={academic.stream_interest}
                      onChange={(e) => setAcademic({ ...academic, stream_interest: e.target.value })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    >
                      <option value="science_maths">Science (PCM)</option>
                      <option value="science_biology">Science (PCB)</option>
                      <option value="commerce">Commerce</option>
                      <option value="humanities">Humanities / Arts</option>
                      <option value="vocational">Vocational / Applied</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted">Favorite Subjects (comma separated)</label>
                      <input
                        type="text"
                        value={academic.favorite_subjects.join(', ')}
                        onChange={(e) => setAcademic({
                          ...academic,
                          favorite_subjects: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
                        })}
                        placeholder="e.g. maths, computer"
                        className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted">Weak Subjects (comma separated)</label>
                      <input
                        type="text"
                        value={academic.weak_subjects.join(', ')}
                        onChange={(e) => setAcademic({
                          ...academic,
                          weak_subjects: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
                        })}
                        placeholder="e.g. sst, english"
                        className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep.key === 'interests' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Sliders className="h-5 w-5 text-accent" />
                    <span>Interest Dimensions</span>
                  </h2>
                  <span className="text-xs text-accent font-semibold bg-accent/10 px-3 py-1 rounded-full">Slide 0 - 100</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {INTEREST_FIELDS.map((f) => (
                    <div key={f} className="space-y-2 bg-bg/60 border border-white/10/80 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold capitalize text-text/80">{f.replace('_', ' ')}</span>
                        <span className="text-sm font-bold text-accent">{interests[f]}/100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={interests[f]}
                        onChange={(e) => setInterests({ ...interests, [f]: parseInt(e.target.value, 10) })}
                        className="w-full accent-accent h-1.5 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.key === 'skills' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Star className="h-5 w-5 text-accent" />
                    <span>Skill Ratings</span>
                  </h2>
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full">Rate 1 - 5 Stars</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {SKILL_FIELDS.map((f) => (
                    <div key={f} className="bg-bg/60 border border-white/10/80 p-4 rounded-2xl flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize text-text/80">{f.replace('_', ' ')}</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setSkills({ ...skills, [f]: star })}
                            className="p-1 hover:scale-110 transition-transform focus:outline-none"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= (skills[f] || 3) ? 'fill-amber-400 text-amber-400' : 'text-text-muted/40'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep.key === 'goals' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Target className="h-5 w-5 text-accent" />
                  <span>Key Priorities & Goals</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {GOAL_OPTIONS.map((g) => {
                    const isSelected = goals.includes(g.value);
                    return (
                      <button
                        key={g.value}
                        onClick={() => toggleGoal(g.value)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-accent/10 border-accent text-accent/80 shadow-md shadow-accent/5'
                            : 'bg-bg/60 border-white/10 text-text-muted hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{g.label}</span>
                          {isSelected && <CheckCircle className="h-5 w-5 text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep.key === 'work_preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-accent" />
                  <span>Work Preferences</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PREFERENCE_OPTIONS.map((p) => {
                    const isSelected = workPreferences.includes(p.value);
                    return (
                      <button
                        key={p.value}
                        onClick={() => togglePreference(p.value)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-accent/10 border-accent text-accent/80 shadow-md shadow-accent/5'
                            : 'bg-bg/60 border-white/10 text-text-muted hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{p.label}</span>
                          {isSelected && <CheckCircle className="h-5 w-5 text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep.key === 'constraints' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <span>Study Constraints & Budgets</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Sector Preference</label>
                    <select
                      value={constraints.govt_vs_private}
                      onChange={(e) => setConstraints({ ...constraints, govt_vs_private: e.target.value })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="any">Flexible / Any Sector</option>
                      <option value="government">Government Sector / PSU</option>
                      <option value="private">Private Sector / Startups</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Budget Tier (Annual College Fees)</label>
                    <select
                      value={constraints.budget_tier}
                      onChange={(e) => setConstraints({ ...constraints, budget_tier: parseInt(e.target.value, 10) || 3 })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="1">Tier 1: Under ₹50,000 / year (Low cost)</option>
                      <option value="2">Tier 2: ₹50,000 - ₹2,00,000 / year</option>
                      <option value="3">Tier 3: ₹2,00,000 - ₹5,00,000 / year</option>
                      <option value="4">Tier 4: Above ₹5,00,000 / year (No budget limit)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Max Study Duration (Years)</label>
                    <input
                      type="number"
                      value={constraints.study_duration_max}
                      onChange={(e) => setConstraints({ ...constraints, study_duration_max: parseInt(e.target.value, 10) || 4 })}
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">Preferred State/City</label>
                    <input
                      type="text"
                      value={constraints.preferred_location}
                      onChange={(e) => setConstraints({ ...constraints, preferred_location: e.target.value })}
                      placeholder="e.g. Pune, Mumbai, Bangalore"
                      className="w-full bg-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-4 col-span-2 grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer bg-bg p-4 rounded-2xl border border-white/10 hover:border-white/20">
                      <input
                        type="checkbox"
                        checked={constraints.willing_to_relocate}
                        onChange={(e) => setConstraints({ ...constraints, willing_to_relocate: e.target.checked })}
                        className="rounded text-accent focus:ring-0"
                      />
                      <span className="text-sm text-text/80 font-semibold">Willing to relocate?</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer bg-bg p-4 rounded-2xl border border-white/10 hover:border-white/20">
                      <input
                        type="checkbox"
                        checked={constraints.abroad_ok}
                        onChange={(e) => setConstraints({ ...constraints, abroad_ok: e.target.checked })}
                        className="rounded text-accent focus:ring-0"
                      />
                      <span className="text-sm text-text/80 font-semibold">Open to study abroad?</span>
                    </label>
                  </div>

                </div>
              </div>
            )}

            {currentStep.key === 'scenarios' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-accent" />
                  <span>Real-world Scenarios</span>
                </h2>
                
                <div className="space-y-8">
                  {SCENARIO_QUESTIONS.map((sq, sIdx) => {
                    const selected = scenarioResponses[sq.id];
                    return (
                      <div key={sq.id} className="space-y-3 border-b border-white/10/60 pb-6 last:border-b-0 last:pb-0">
                        <span className="text-xs font-bold text-accent">Scenario {sIdx + 1} of {SCENARIO_QUESTIONS.length}</span>
                        <p className="text-sm font-semibold text-text/80">{sq.question}</p>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {sq.options.map((opt) => {
                            const isChosen = selected === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => setScenarioResponses({ ...scenarioResponses, [sq.id]: opt.key })}
                                className={`p-4 rounded-xl border text-left transition-all text-xs font-medium ${
                                  isChosen
                                    ? 'bg-accent/10 border-accent text-accent/80'
                                    : 'bg-bg/60 border-white/10 text-text-muted hover:border-white/20'
                                }`}
                              >
                                <span className="font-bold mr-2 text-accent">{opt.key}.</span> {opt.text}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pagination Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => {
                  if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1);
                }}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-2 px-5 py-2.5 bg-bg hover:bg-white/10 text-text/80 font-semibold rounded-xl text-sm transition-all border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                onClick={() => saveCurrentStep(true)}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-accent to-accent-2 hover:brightness-110 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>{currentStepIndex === STEPS.length - 1 ? 'Complete Onboarding' : 'Next Step'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
    </motion.div>
  );
};
