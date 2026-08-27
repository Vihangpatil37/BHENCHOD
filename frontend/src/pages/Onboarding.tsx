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
  Brain,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import confetti from 'canvas-confetti';
import { INDIA_STATES_CITIES } from '../lib/indiaStatesCities';
import { NATIONAL_BOARDS, STATE_BOARDS, ALL_BOARDS } from '../lib/indiaSchoolBoards';

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

const OPTION_SCORES: Record<string, number> = { A: 15, B: 5, C: -5, D: -10 };

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOtherCity, setIsOtherCity] = useState(false);

  // AI Reacting Transition States
  const [isAiReacting, setIsAiReacting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  // Step state forms
  const [personal, setPersonal] = useState({
    name: '', dob: '', age: 17, gender: 'Male', city: '', state: '', board: 'CBSE'
  });
  const STREAM_SUBJECTS: Record<string, string[]> = {
    pcm: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Computer/Optional'],
    pcb: ['Physics', 'Chemistry', 'Biology', 'English', 'Optional'],
    commerce: ['Accountancy', 'Business Studies', 'Economics', 'English', 'Mathematics/IP'],
    arts: ['History', 'Geography', 'Political Science', 'English', 'Optional'],
  };
  const SUBJECT_KEY: Record<string, string> = {
    'Physics': 'physics', 'Chemistry': 'chemistry', 'Mathematics': 'mathematics',
    'English': 'english', 'Computer/Optional': 'computer_optional', 'Optional': 'optional',
    'Biology': 'biology', 'Accountancy': 'accountancy', 'Business Studies': 'business_studies',
    'Economics': 'economics', 'Mathematics/IP': 'mathematics_ip', 'History': 'history',
    'Geography': 'geography', 'Political Science': 'political_science',
  };

  const [academic, setAcademic] = useState({
    postClass10Path: 'none',
    class10: {
      status: 'pursuing',
      percentage: 80,
      subjects: { maths: 75, science: 75, english: 75, sst: 75, computer: 75 },
      favorite_subjects: [] as string[],
      weak_subjects: [] as string[],
    },
    class12: {
      status: '',
      stream: '',
      percentage: 80,
      subjects: {} as Record<string, number>,
      favorite_subjects: [] as string[],
      weak_subjects: [] as string[],
    },
    diploma: {
      status: '',
      course: '',
      percentage: 80,
      subjects: {} as Record<string, number>,
      favorite_subjects: [] as string[],
      weak_subjects: [] as string[],
    },
  });
  const [interests, setInterests] = useState<Record<string, number>>(
    INTEREST_FIELDS.reduce((acc, f) => ({ ...acc, [f]: 0 }), {})
  );
  const [skills, setSkills] = useState<Record<string, number>>(
    SKILL_FIELDS.reduce((acc, f) => ({ ...acc, [f]: 0 }), {})
  );
  const [goals, setGoals] = useState<string[]>([]);
  const [workPreferences, setWorkPreferences] = useState<string[]>([]);
  const [constraints, setConstraints] = useState({
    govt_vs_private: 'any',
    study_duration_max: 4,
    willing_to_relocate: true,
    abroad_ok: false,
    preferred_state: '',
    preferred_city: '',
  });
  const [scenarioResponses, setScenarioResponses] = useState<Record<string, string>>({});
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);

  useEffect(() => {
    resumeOnboarding();
  }, []);

  useEffect(() => {
    if (STEPS[currentStepIndex]?.key === 'scenarios' && scenarios.length === 0 && !scenariosLoading) {
      loadScenarios();
    }
  }, [currentStepIndex]);

  const resumeOnboarding = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res: any = await client.get('/onboarding/resume');
      setProfile(res);
      
      if (res.personal) {
        setPersonal({ ...personal, ...res.personal });
        if (res.personal.state && res.personal.city) {
          const stateCities = INDIA_STATES_CITIES[res.personal.state];
          if (stateCities && !stateCities.includes(res.personal.city)) {
            setIsOtherCity(true);
          }
        }
      }
      if (res.academic) {
        const hasNew = res.academic.class10 || res.academic.class12;
        if (hasNew) {
          setAcademic({
            class10: res.academic.class10 ? { ...academic.class10, ...res.academic.class10 } : academic.class10,
            class12: res.academic.class12 ? { ...academic.class12, ...res.academic.class12 } : academic.class12,
          });
        }
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
      if (res.scenario_responses) {
        const initialResponses: Record<string, string> = {};
        res.scenario_responses.forEach((sr: any) => {
          initialResponses[String(sr.question_id)] = sr.selected_option;
        });
        setScenarioResponses(initialResponses);
      }
      
      const stepIdx = STEPS.findIndex(s => s.key === res.current_step);
      if (stepIdx !== -1) {
        setCurrentStepIndex(stepIdx);
      }
    } catch (err: any) {
      if (err.status === 401) {
        clearAuth();
        navigate('/login');
      } else {
        setErrorMessage('Failed to load your questionnaire progress.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    setScenariosLoading(true);
    setErrorMessage('');
    try {
      const res: any = await client.get('/onboarding/scenarios');
      setScenarios(res.scenarios || []);
    } catch (err: any) {
      if (err.status === 401) {
        clearAuth();
        navigate('/login');
      } else {
        setErrorMessage(err.status === 503 ? 'AI service is unavailable right now.' : (err.message || 'Failed to generate scenarios.'));
      }
    } finally {
      setScenariosLoading(false);
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
      case 'constraints': {
        const { preferred_state, preferred_city, ...rest } = constraints as any;
        const location = preferred_city ? `${preferred_city}, ${preferred_state}` : preferred_state;
        return {
          ...rest,
          preferred_location: location
        };
      }
      case 'scenarios':
        return {
          scenario_responses: Object.entries(scenarioResponses).map(([qId, opt]) => {
            const q = scenarios.find((s: any) => String(s.id) === qId);
            const sTrait = (q?.trait || '').toLowerCase().replace(/\s+/g, '_');
            return {
              question_id: qId,
              selected_option: opt,
              trait_weights: sTrait ? { [sTrait]: OPTION_SCORES[opt] || 0 } : {},
            };
          })
        };
      default: return {};
    }
  };

  const getAiFeedback = (stepKey: string) => {
    const name = personal.name || 'Student';
    switch (stepKey) {
      case 'personal':
        return `Hello ${name}! I have configured your profile base. Let's details your academics.`;
      case 'academic':
        return `Understood. Adapting recommendations to stream suitability... Let's analyze your interest dimensions.`;
      case 'interests':
        return `Interest vectors mapped successfully. Next, let's rate your core skills.`;
      case 'skills':
        return `Skills analyzed. Now, let's understand your primary goals and work priorities.`;
      case 'goals':
        return `Goals registered. Let's record your daily work preferences.`;
      case 'work_preferences':
        return `Preferences logged. Let's establish your budget and relocating constraints.`;
      case 'constraints':
        return `Noted! Finally, let's explore some scenario problems to test your decision making style.`;
      case 'scenarios':
        return `Splendid! I have synthesized all stream suitability metrics, interest maps, and scenario answers. Compiling final recommendations...`;
      default:
        return `Logging your data...`;
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
        // Set AI Feedback Overlay
        const feedback = getAiFeedback(stepKey);
        setAiFeedback(feedback);
        setIsAiReacting(true);

        // Pause for the AI reaction animation (2.2s)
        await new Promise(resolve => setTimeout(resolve, 2200));
        setIsAiReacting(false);

        if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          // Last step, proceed to complete
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
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.4, x: 0.2 } });
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.4, x: 0.8 } });
      setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.3 } }), 200);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete onboarding. Please verify all questions.');
    } finally {
      setSaving(false);
    }
  };

  const handleStepClick = (idx: number) => {
    if (profile?.completed) {
      setCurrentStepIndex(idx);
    } else {
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
      <div className="min-h-screen bg-[#05070D] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border border-solid border-brand/20 bg-brand/5 flex items-center justify-center animate-pulse">
          <Brain className="h-6 w-6 text-brand" />
        </div>
        <span className="text-text-secondary font-medium text-sm">Synchronizing Questionnaire...</span>
      </div>
    );
  }

  if (isAiReacting) {
    return (
      <div className="min-h-screen bg-[#05070D] flex flex-col items-center justify-center p-6 relative">
        <GlassCard elevation={4} className="max-w-md w-full p-8 text-center space-y-6 border border-solid border-white/[0.08] rounded-[28px] relative overflow-hidden">
          {/* Pulsing glow ring around icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-white/[0.05] border border-solid border-[#70E1FF]/25 flex items-center justify-center animate-pulse">
            <Sparkles className="h-7 w-7 text-ai-cyan" />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-ai-cyan font-semibold uppercase tracking-wider block">Career Mentor AI</span>
            <p className="text-text-primary text-base font-medium leading-relaxed">
              {aiFeedback}
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const currentStep = STEPS[currentStepIndex];

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        
        {/* Header & Steps Indicator */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-black text-text-primary">Student Onboarding</h1>
            <p className="text-text-secondary text-sm mt-1">Complete your questionnaire to analyze your career preferences and traits.</p>
          </div>

          <OnboardingProgress
            steps={STEPS}
            currentStepIndex={currentStepIndex}
            completed={profile?.completed}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Form Container (GlassCard Elevation 2) */}
        <GlassCard elevation={2} className="p-6 md:p-8 border border-solid border-white/[0.08] rounded-[24px] space-y-6">
          
          {errorMessage && (
            <div className="p-4 bg-error/10 border border-solid border-error/20 text-error rounded-[18px] text-sm font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Step Renderings */}
          {currentStep.key === 'personal' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                <User className="h-5 w-5 text-brand" />
                <span>Personal Details</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Full Name</label>
                  <input
                    type="text"
                    value={personal.name}
                    onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Date of Birth</label>
                  <input
                    type="date"
                    value={personal.dob ? personal.dob.split('T')[0] : ''}
                    onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                    onClick={(e) => {
                      try { e.currentTarget.showPicker(); } catch (err) {}
                    }}
                    onKeyDown={(e) => e.preventDefault()}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Age</label>
                  <select
                    value={personal.age}
                    onChange={(e) => setPersonal({ ...personal, age: parseInt(e.target.value, 10) || 16 })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  >
                    {Array.from({ length: 26 }, (_, i) => i + 15).map(age => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Gender</label>
                  <select
                    value={personal.gender}
                    onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">State</label>
                  <select
                    value={personal.state}
                    onChange={(e) => {
                      const selectedState = e.target.value;
                      const newBoard = STATE_BOARDS[selectedState] || personal.board;
                      setPersonal({ ...personal, state: selectedState, city: '', board: newBoard });
                      setIsOtherCity(false);
                    }}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select State</option>
                    {Object.keys(INDIA_STATES_CITIES).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">City</label>
                  <select
                    value={isOtherCity ? 'Other' : personal.city}
                    onChange={(e) => {
                      if (e.target.value === 'Other') {
                        setIsOtherCity(true);
                        setPersonal({ ...personal, city: '' });
                      } else {
                        setIsOtherCity(false);
                        setPersonal({ ...personal, city: e.target.value });
                      }
                    }}
                    disabled={!personal.state}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>Select City</option>
                    {personal.state && INDIA_STATES_CITIES[personal.state]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="Other">Other (Type manually)</option>
                  </select>
                  
                  {isOtherCity && (
                    <input
                      type="text"
                      value={personal.city}
                      onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                      placeholder="Enter your city name"
                      className="w-full mt-2 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                    />
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Education Board</label>
                  <select
                    value={personal.board}
                    onChange={(e) => setPersonal({ ...personal, board: e.target.value })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Education Board</option>
                    <optgroup label="State Boards (Auto-selected by State)">
                      {Object.values(STATE_BOARDS).map(board => (
                        <option key={board} value={board}>{board}</option>
                      ))}
                    </optgroup>
                    <optgroup label="National Boards">
                      {NATIONAL_BOARDS.map(board => (
                        <option key={board} value={board}>{board}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep.key === 'academic' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-brand" />
                <span>Academic Background</span>
              </h2>

              {/* Section 1: Class 10 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5 space-y-4">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Class 10 Academic Details</h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">Status</label>
                  <div className="flex gap-4">
                    {['pursuing', 'completed'].map((opt) => (
                      <label key={opt} className="flex items-center space-x-2 text-sm text-text-primary cursor-pointer select-none">
                        <input type="radio" name="c10status" value={opt}
                          checked={academic.class10.status === opt}
                          onChange={(e) => setAcademic({ ...academic, class10: { ...academic.class10, status: e.target.value } })}
                          className="text-brand focus:ring-0" />
                        <span className="capitalize">{opt} Class 10</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Class 10 Overall Percentage</label>
                  <input type="text"
                    value={academic.class10.percentage}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const parsed = val === '' ? '' : Math.min(100, parseInt(val, 10));
                      setAcademic({ ...academic, class10: { ...academic.class10, percentage: parsed as any } });
                    }}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                  <span className="text-[10px] text-text-secondary/60">Enter a value between 0 and 100</span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-text-secondary block border-b border-white/[0.06] pb-2">Subject Performance (0 - 100)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(academic.class10.subjects).map(([subj, score]) => (
                      <div key={subj} className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-[18px] flex flex-col space-y-1 items-center">
                        <span className="text-xs font-bold text-text-secondary uppercase text-center leading-tight">{subj === 'maths' ? 'Mathematics' : subj === 'sst' ? 'SST' : subj}</span>
                        <input type="text"
                          value={score}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const parsed = val === '' ? '' : Math.min(100, parseInt(val, 10));
                            setAcademic({
                              ...academic,
                              class10: { ...academic.class10, subjects: { ...academic.class10.subjects, [subj]: parsed as any } }
                            });
                          }}
                          className="w-full bg-transparent text-center text-sm font-semibold text-text-primary focus:outline-none border-b border-transparent focus:border-ai-cyan/50" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Favorite Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(academic.class10.subjects).map((subj) => {
                        const isFav = academic.class10.favorite_subjects.includes(subj);
                        const isWeak = academic.class10.weak_subjects.includes(subj);
                        return (
                          <button key={subj} type="button"
                            disabled={isWeak}
                            onClick={() => {
                              if (isFav) {
                                setAcademic({ ...academic, class10: { ...academic.class10, favorite_subjects: academic.class10.favorite_subjects.filter(s => s !== subj) } });
                              } else {
                                setAcademic({
                                  ...academic,
                                  class10: {
                                    ...academic.class10,
                                    favorite_subjects: [...academic.class10.favorite_subjects, subj],
                                    weak_subjects: academic.class10.weak_subjects.filter(s => s !== subj)
                                  }
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isFav ? 'bg-ai-cyan/20 border-ai-cyan text-white' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.08]'} ${isWeak ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {subj === 'maths' ? 'Mathematics' : subj === 'sst' ? 'SST' : subj}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Weak Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(academic.class10.subjects).map((subj) => {
                        const isFav = academic.class10.favorite_subjects.includes(subj);
                        const isWeak = academic.class10.weak_subjects.includes(subj);
                        return (
                          <button key={subj} type="button"
                            disabled={isFav}
                            onClick={() => {
                              if (isWeak) {
                                setAcademic({ ...academic, class10: { ...academic.class10, weak_subjects: academic.class10.weak_subjects.filter(s => s !== subj) } });
                              } else {
                                setAcademic({
                                  ...academic,
                                  class10: {
                                    ...academic.class10,
                                    weak_subjects: [...academic.class10.weak_subjects, subj],
                                    favorite_subjects: academic.class10.favorite_subjects.filter(s => s !== subj)
                                  }
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isWeak ? 'bg-error/20 border-error text-white' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.08]'} ${isFav ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {subj === 'maths' ? 'Mathematics' : subj === 'sst' ? 'SST' : subj}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Post-Class 10 Path */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5 space-y-4">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">What did you pursue after Class 10?</h3>
                
                <div className="flex gap-4">
                  {[
                    { val: 'class12', label: 'Class 12' },
                    { val: 'diploma', label: 'Diploma' },
                    { val: 'none', label: 'Nothing Yet' }
                  ].map((opt) => (
                    <label key={opt.val} className="flex items-center space-x-2 text-sm text-text-primary cursor-pointer select-none">
                      <input type="radio" name="postClass10" value={opt.val}
                        checked={academic.postClass10Path === opt.val}
                        onChange={(e) => setAcademic({ ...academic, postClass10Path: e.target.value })}
                        className="text-brand focus:ring-0" />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {academic.postClass10Path === 'class12' && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Class 12 Academic Details</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">Status</label>
                      <div className="flex gap-4">
                        {['pursuing', 'completed'].map((opt) => (
                          <label key={opt} className="flex items-center space-x-2 text-sm text-text-primary cursor-pointer select-none">
                            <input type="radio" name="c12status" value={opt}
                              checked={academic.class12.status === opt}
                              onChange={(e) => setAcademic({ ...academic, class12: { ...academic.class12, status: e.target.value } })}
                              className="text-brand focus:ring-0" />
                            <span className="capitalize">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Academic Stream</label>
                      <select
                        value={academic.class12.stream}
                        onChange={(e) => setAcademic({ ...academic, class12: { ...academic.class12, stream: e.target.value, subjects: {} } })}
                        className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50"
                      >
                        <option value="">Select stream</option>
                        <option value="pcm">Science (PCM)</option>
                        <option value="pcb">Science (PCB)</option>
                        <option value="commerce">Commerce</option>
                        <option value="arts">Arts</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Overall Percentage</label>
                      <input type="text"
                        value={academic.class12.percentage}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const parsed = val === '' ? '' : Math.min(100, parseInt(val, 10));
                          setAcademic({ ...academic, class12: { ...academic.class12, percentage: parsed as any } });
                        }}
                        className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50" />
                      <span className="text-[10px] text-text-secondary/60">Enter a value between 0 and 100</span>
                    </div>

                    {academic.class12.stream && academic.class12.stream !== 'other' && (
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-text-secondary block border-b border-white/[0.06] pb-2">Subject Performance (0 - 100)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {STREAM_SUBJECTS[academic.class12.stream].map((subj) => {
                            const key = SUBJECT_KEY[subj];
                            return (
                              <div key={key} className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-[18px] flex flex-col space-y-1 items-center">
                                <span className="text-xs font-bold text-text-secondary uppercase text-center leading-tight">{subj}</span>
                                <input type="text"
                                  value={academic.class12.subjects[key] ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    const parsed = val === '' ? '' : Math.min(100, parseInt(val, 10));
                                    setAcademic({
                                      ...academic,
                                      class12: { ...academic.class12, subjects: { ...academic.class12.subjects, [key]: parsed as any } }
                                    });
                                  }}
                                  className="w-full bg-transparent text-center text-sm font-semibold text-text-primary focus:outline-none border-b border-transparent focus:border-ai-cyan/50" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {academic.class12.stream === 'other' && (
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-text-secondary block border-b border-white/[0.06] pb-2">Subject Performance (0 - 100)</span>
                        <div className="space-y-2">
                          {Object.entries(academic.class12.subjects).map(([subj, score], idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input type="text" value={subj}
                                onChange={(e) => {
                                  const entries = Object.entries(academic.class12.subjects);
                                  entries[idx] = [e.target.value, entries[idx][1]];
                                  setAcademic({ ...academic, class12: { ...academic.class12, subjects: Object.fromEntries(entries) } });
                                }}
                                placeholder="Subject name"
                                className="flex-1 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50" />
                              <input type="text" value={score}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  const parsed = val === '' ? '' : Math.min(100, parseInt(val, 10));
                                  setAcademic({
                                    ...academic,
                                    class12: { ...academic.class12, subjects: { ...academic.class12.subjects, [subj]: parsed as any } }
                                  });
                                }}
                                className="w-20 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50" />
                              <button onClick={() => {
                                const entries = Object.entries(academic.class12.subjects).filter(([k]) => k !== subj);
                                setAcademic({ ...academic, class12: { ...academic.class12, subjects: Object.fromEntries(entries) } });
                              }}
                                className="text-text-secondary hover:text-error text-lg px-2">&times;</button>
                            </div>
                          ))}
                          <button onClick={() => setAcademic({
                            ...academic,
                            class12: { ...academic.class12, subjects: { ...academic.class12.subjects, '': 0 } }
                          })}
                            className="text-xs text-brand font-semibold">+ Add Subject</button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Favorite Subjects</label>
                        <div className="flex flex-wrap gap-2">
                          {(STREAM_SUBJECTS[academic.class12.stream] ? STREAM_SUBJECTS[academic.class12.stream].map(s => SUBJECT_KEY[s]) : Object.keys(academic.class12.subjects)).map((subj) => {
                            if (!subj) return null;
                            let display = subj;
                            if (STREAM_SUBJECTS[academic.class12.stream]) {
                              display = Object.keys(SUBJECT_KEY).find(k => SUBJECT_KEY[k] === subj) || subj;
                            }
                            const isFav = academic.class12.favorite_subjects.includes(subj);
                            const isWeak = academic.class12.weak_subjects.includes(subj);
                            return (
                              <button key={subj} type="button"
                                disabled={isWeak}
                                onClick={() => {
                                  if (isFav) {
                                    setAcademic({ ...academic, class12: { ...academic.class12, favorite_subjects: academic.class12.favorite_subjects.filter(s => s !== subj) } });
                                  } else {
                                    setAcademic({
                                      ...academic,
                                      class12: {
                                        ...academic.class12,
                                        favorite_subjects: [...academic.class12.favorite_subjects, subj],
                                        weak_subjects: academic.class12.weak_subjects.filter(s => s !== subj)
                                      }
                                    });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isFav ? 'bg-ai-cyan/20 border-ai-cyan text-white' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.08]'} ${isWeak ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {display}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Weak Subjects</label>
                        <div className="flex flex-wrap gap-2">
                          {(STREAM_SUBJECTS[academic.class12.stream] ? STREAM_SUBJECTS[academic.class12.stream].map(s => SUBJECT_KEY[s]) : Object.keys(academic.class12.subjects)).map((subj) => {
                            if (!subj) return null;
                            let display = subj;
                            if (STREAM_SUBJECTS[academic.class12.stream]) {
                              display = Object.keys(SUBJECT_KEY).find(k => SUBJECT_KEY[k] === subj) || subj;
                            }
                            const isFav = academic.class12.favorite_subjects.includes(subj);
                            const isWeak = academic.class12.weak_subjects.includes(subj);
                            return (
                              <button key={subj} type="button"
                                disabled={isFav}
                                onClick={() => {
                                  if (isWeak) {
                                    setAcademic({ ...academic, class12: { ...academic.class12, weak_subjects: academic.class12.weak_subjects.filter(s => s !== subj) } });
                                  } else {
                                    setAcademic({
                                      ...academic,
                                      class12: {
                                        ...academic.class12,
                                        weak_subjects: [...academic.class12.weak_subjects, subj],
                                        favorite_subjects: academic.class12.favorite_subjects.filter(s => s !== subj)
                                      }
                                    });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isWeak ? 'bg-error/20 border-error text-white' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.08]'} ${isFav ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {display}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {academic.postClass10Path === 'diploma' && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Diploma Academic Details</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">Status</label>
                      <div className="flex gap-4">
                        {['pursuing', 'completed'].map((opt) => (
                          <label key={opt} className="flex items-center space-x-2 text-sm text-text-primary cursor-pointer select-none">
                            <input type="radio" name="diplomastatus" value={opt}
                              checked={academic.diploma.status === opt}
                              onChange={(e) => setAcademic({ ...academic, diploma: { ...academic.diploma, status: e.target.value } })}
                              className="text-brand focus:ring-0" />
                            <span className="capitalize">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Course / Branch Name</label>
                      <input type="text"
                        value={academic.diploma.course}
                        onChange={(e) => setAcademic({ ...academic, diploma: { ...academic.diploma, course: e.target.value } })}
                        placeholder="e.g. Diploma in Mechanical Engineering"
                        className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Overall Percentage</label>
                      <input type="text"
                        value={academic.diploma.percentage}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const parsed = val === '' ? '' : Math.min(100, parseInt(val, 10));
                          setAcademic({ ...academic, diploma: { ...academic.diploma, percentage: parsed as any } });
                        }}
                        className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                      <span className="text-[10px] text-text-secondary/60">Enter a value between 0 and 100</span>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold text-text-secondary block border-b border-white/[0.06] pb-2">Subject Performance (0 - 100)</span>
                      <div className="space-y-2">
                        {Object.entries(academic.diploma.subjects).map(([subj, score], idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input type="text" value={subj}
                              onChange={(e) => {
                                const entries = Object.entries(academic.diploma.subjects);
                                entries[idx] = [e.target.value, entries[idx][1]];
                                setAcademic({ ...academic, diploma: { ...academic.diploma, subjects: Object.fromEntries(entries) } });
                              }}
                              placeholder="Subject name"
                              className="flex-1 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                            <input type="text" value={score}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                const parsed = val === '' ? '' : Math.min(100, parseInt(val, 10));
                                setAcademic({
                                  ...academic,
                                  diploma: { ...academic.diploma, subjects: { ...academic.diploma.subjects, [subj]: parsed as any } }
                                });
                              }}
                              className="w-20 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                            <button onClick={() => {
                              const entries = Object.entries(academic.diploma.subjects).filter(([k]) => k !== subj);
                              setAcademic({ ...academic, diploma: { ...academic.diploma, subjects: Object.fromEntries(entries) } });
                            }}
                              className="text-text-secondary hover:text-error text-lg px-2">&times;</button>
                          </div>
                        ))}
                        <button onClick={() => setAcademic({
                          ...academic,
                          diploma: { ...academic.diploma, subjects: { ...academic.diploma.subjects, '': 0 } }
                        })}
                          className="text-xs text-brand font-semibold">+ Add Subject</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Favorite Subjects</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(academic.diploma.subjects).map((subj) => {
                            if (!subj) return null;
                            const isFav = academic.diploma.favorite_subjects.includes(subj);
                            const isWeak = academic.diploma.weak_subjects.includes(subj);
                            return (
                              <button key={subj} type="button"
                                disabled={isWeak}
                                onClick={() => {
                                  if (isFav) {
                                    setAcademic({ ...academic, diploma: { ...academic.diploma, favorite_subjects: academic.diploma.favorite_subjects.filter(s => s !== subj) } });
                                  } else {
                                    setAcademic({
                                      ...academic,
                                      diploma: {
                                        ...academic.diploma,
                                        favorite_subjects: [...academic.diploma.favorite_subjects, subj],
                                        weak_subjects: academic.diploma.weak_subjects.filter(s => s !== subj)
                                      }
                                    });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isFav ? 'bg-ai-cyan/20 border-ai-cyan text-white' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.08]'} ${isWeak ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {subj}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Weak Subjects</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(academic.diploma.subjects).map((subj) => {
                            if (!subj) return null;
                            const isFav = academic.diploma.favorite_subjects.includes(subj);
                            const isWeak = academic.diploma.weak_subjects.includes(subj);
                            return (
                              <button key={subj} type="button"
                                disabled={isFav}
                                onClick={() => {
                                  if (isWeak) {
                                    setAcademic({ ...academic, diploma: { ...academic.diploma, weak_subjects: academic.diploma.weak_subjects.filter(s => s !== subj) } });
                                  } else {
                                    setAcademic({
                                      ...academic,
                                      diploma: {
                                        ...academic.diploma,
                                        weak_subjects: [...academic.diploma.weak_subjects, subj],
                                        favorite_subjects: academic.diploma.favorite_subjects.filter(s => s !== subj)
                                      }
                                    });
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${isWeak ? 'bg-error/20 border-error text-white' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.08]'} ${isFav ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {subj}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep.key === 'interests' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                  <Sliders className="h-5 w-5 text-brand" />
                  <span>Interest Dimensions</span>
                </h2>
                <span className="text-xs text-brand font-semibold bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">Slide 0 - 100</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {INTEREST_FIELDS.map((f) => (
                  <div key={f} className="space-y-3 bg-white/[0.02] border border-white/[0.06] p-4 rounded-[24px] flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold capitalize text-text-primary">{f.replace('_', ' ')}</span>
                      <span className="text-sm font-bold text-brand">{interests[f]}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={interests[f]}
                      onChange={(e) => setInterests({ ...interests, [f]: parseInt(e.target.value, 10) })}
                      className="w-full accent-brand h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep.key === 'skills' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                  <Star className="h-5 w-5 text-brand" />
                  <span>Skill Ratings</span>
                </h2>
                <span className="text-xs text-warning font-semibold bg-warning/10 border border-warning/20 px-3 py-1 rounded-full">Rate 1 - 5 Stars</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {SKILL_FIELDS.map((f) => (
                  <div key={f} className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-[24px] flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize text-text-primary">{f.replace('_', ' ')}</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setSkills({ ...skills, [f]: star })}
                          className="p-1 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (skills[f] || 0) ? 'fill-warning text-warning' : 'text-text-disabled'
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
              <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                <Target className="h-5 w-5 text-brand" />
                <span>Key Priorities & Goals</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GOAL_OPTIONS.map((g) => {
                  const isSelected = goals.includes(g.value);
                  return (
                    <button
                      key={g.value}
                      onClick={() => toggleGoal(g.value)}
                      className={`p-4 rounded-[24px] border border-solid text-left transition-all duration-180 cursor-pointer ${
                        isSelected
                          ? 'bg-brand/10 border-brand text-brand shadow-[0_4px_12px_rgba(91,124,250,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{g.label}</span>
                        {isSelected && <CheckCircle className="h-5 w-5 text-brand" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep.key === 'work_preferences' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-brand" />
                <span>Work Preferences</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PREFERENCE_OPTIONS.map((p) => {
                  const isSelected = workPreferences.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      onClick={() => togglePreference(p.value)}
                      className={`p-4 rounded-[24px] border border-solid text-left transition-all duration-180 cursor-pointer ${
                        isSelected
                          ? 'bg-brand/10 border-brand text-brand shadow-[0_4px_12px_rgba(91,124,250,0.15)]'
                          : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{p.label}</span>
                        {isSelected && <CheckCircle className="h-5 w-5 text-brand" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep.key === 'constraints' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-brand" />
                <span>Study Constraints & Budgets</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Sector Preference</label>
                  <select
                    value={constraints.govt_vs_private}
                    onChange={(e) => setConstraints({ ...constraints, govt_vs_private: e.target.value })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50"
                  >
                    <option value="any">Flexible / Any Sector</option>
                    <option value="government">Government Sector / PSU</option>
                    <option value="private">Private Sector / Startups</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Max Study Duration (Years)</label>
                  <select
                    value={constraints.study_duration_max}
                    onChange={(e) => setConstraints({ ...constraints, study_duration_max: parseInt(e.target.value, 10) || 4 })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(year => (
                      <option key={year} value={year}>{year} {year === 1 ? 'Year' : 'Years'}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Preferred State</label>
                  <select
                    value={constraints.preferred_state}
                    onChange={(e) => {
                      setConstraints({ 
                        ...constraints, 
                        preferred_state: e.target.value,
                        preferred_city: '' // Reset city when state changes
                      })
                    }}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50"
                  >
                    <option value="">Any State</option>
                    {Object.keys(INDIA_STATES_CITIES).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Preferred City</label>
                  <select
                    value={constraints.preferred_city}
                    onChange={(e) => setConstraints({ ...constraints, preferred_city: e.target.value })}
                    disabled={!constraints.preferred_state}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{constraints.preferred_state ? 'Any City' : 'Select a State first'}</option>
                    {constraints.preferred_state && INDIA_STATES_CITIES[constraints.preferred_state]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer bg-white/[0.02] p-4 rounded-[24px] border border-solid border-white/[0.06] hover:border-white/[0.12] select-none">
                    <input
                      type="checkbox"
                      checked={constraints.willing_to_relocate}
                      onChange={(e) => setConstraints({ ...constraints, willing_to_relocate: e.target.checked })}
                      className="rounded text-brand focus:ring-0"
                    />
                    <span className="text-sm text-text-primary font-semibold">Willing to relocate?</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer bg-white/[0.02] p-4 rounded-[24px] border border-solid border-white/[0.06] hover:border-white/[0.12] select-none">
                    <input
                      type="checkbox"
                      checked={constraints.abroad_ok}
                      onChange={(e) => setConstraints({ ...constraints, abroad_ok: e.target.checked })}
                      className="rounded text-brand focus:ring-0"
                    />
                    <span className="text-sm text-text-primary font-semibold">Open to study abroad?</span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {currentStep.key === 'scenarios' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-brand" />
                <span>Real-world Scenarios</span>
              </h2>

              {scenariosLoading && (
                <div className="space-y-4 py-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              )}

              {!scenariosLoading && scenarios.length === 0 && (
                <div className="text-center py-16 text-text-secondary text-sm">
                  Unable to load scenarios. Please try again.
                </div>
              )}

              {!scenariosLoading && scenarios.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-3.5 py-1 rounded-full">
                      {Object.keys(scenarioResponses).length} of {scenarios.length} answered
                    </span>
                  </div>

                  <div className="space-y-8">
                    {scenarios.map((sq: any, sIdx: number) => {
                      const qId = String(sq.id);
                      const selected = scenarioResponses[qId];
                      return (
                        <div key={qId} className="space-y-3 border-b border-white/[0.06] pb-6 last:border-b-0 last:pb-0">
                          <span className="text-xs font-bold text-brand">Scenario {sIdx + 1} of {scenarios.length}</span>
                          <p className="text-sm font-semibold text-text-primary">{sq.question}</p>
                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {sq.options.map((optText: string, oIdx: number) => {
                              const optKey = String.fromCharCode(65 + oIdx);
                              const isChosen = selected === optKey;
                              return (
                                <button
                                  key={optKey}
                                  onClick={() => setScenarioResponses({ ...scenarioResponses, [qId]: optKey })}
                                  className={`p-4 rounded-[18px] border border-solid text-left transition-all text-xs font-semibold cursor-pointer ${
                                    isChosen
                                      ? 'bg-brand/10 border-brand text-brand'
                                      : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:border-white/[0.12]'
                                  }`}
                                >
                                  <span className="font-bold mr-2 text-brand">{optKey}.</span> {optText}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pagination Actions */}
          {currentStep.key === 'interests' && Object.values(interests).filter(v => v > 0).length < 3 && (
            <div className="flex justify-end pt-4">
              <span className="text-error text-xs font-semibold bg-error/10 px-3 py-1.5 rounded-full border border-error/20">
                Please adjust at least 3 dimensions above 0 to proceed. ({Object.values(interests).filter(v => v > 0).length}/3)
              </span>
            </div>
          )}
          
          {currentStep.key === 'skills' && Object.values(skills).filter(v => v > 0).length < 3 && (
            <div className="flex justify-end pt-4">
              <span className="text-error text-xs font-semibold bg-error/10 px-3 py-1.5 rounded-full border border-error/20">
                Please rate at least 3 skills to proceed. ({Object.values(skills).filter(v => v > 0).length}/3)
              </span>
            </div>
          )}

          {currentStep.key === 'goals' && goals.length < 1 && (
            <div className="flex justify-end pt-4">
              <span className="text-error text-xs font-semibold bg-error/10 px-3 py-1.5 rounded-full border border-error/20">
                Please select at least 1 goal to proceed. ({goals.length}/1)
              </span>
            </div>
          )}

          {currentStep.key === 'work_preferences' && workPreferences.length < 1 && (
            <div className="flex justify-end pt-4">
              <span className="text-error text-xs font-semibold bg-error/10 px-3 py-1.5 rounded-full border border-error/20">
                Please select at least 1 work preference to proceed. ({workPreferences.length}/1)
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-6 border-t border-white/[0.06] mt-4">
            <button
              onClick={() => {
                if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1);
              }}
              disabled={currentStepIndex === 0}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.12] text-text-primary font-semibold rounded-[18px] border border-solid border-white/[0.08] text-sm transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <Button
              onClick={() => saveCurrentStep(true)}
              disabled={
                saving || 
                (currentStep.key === 'scenarios' && scenarios.length > 0 && Object.keys(scenarioResponses).length < scenarios.length) ||
                (currentStep.key === 'interests' && Object.values(interests).filter(v => v > 0).length < 3) ||
                (currentStep.key === 'skills' && Object.values(skills).filter(v => v > 0).length < 3) ||
                (currentStep.key === 'goals' && goals.length < 1) ||
                (currentStep.key === 'work_preferences' && workPreferences.length < 1)
              }
              className="flex items-center space-x-2 px-6 py-2.5 text-sm"
              loading={saving}
            >
              <span>{currentStepIndex === STEPS.length - 1 ? 'Complete Onboarding' : 'Next Step'}</span>
              {!saving && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>

        </GlassCard>
      </div>
    </motion.div>
  );
};
