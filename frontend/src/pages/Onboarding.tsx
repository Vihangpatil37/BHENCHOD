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
      
      if (res.personal) setPersonal({ ...personal, ...res.personal });
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
      setErrorMessage(err.message || 'Failed to generate scenarios.');
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
      case 'constraints': return constraints;
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
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Age</label>
                  <input
                    type="number"
                    value={personal.age}
                    onChange={(e) => setPersonal({ ...personal, age: parseInt(e.target.value, 10) || 16 })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  />
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">City</label>
                  <input
                    type="text"
                    value={personal.city}
                    onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">State</label>
                  <input
                    type="text"
                    value={personal.state}
                    onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Education Board</label>
                  <input
                    type="text"
                    value={personal.board}
                    onChange={(e) => setPersonal({ ...personal, board: e.target.value })}
                    placeholder="e.g. CBSE / ICSE"
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                  />
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
                  <input type="number" min="0" max="100"
                    value={academic.class10.percentage}
                    onChange={(e) => setAcademic({ ...academic, class10: { ...academic.class10, percentage: parseFloat(e.target.value) || 0 } })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                  <span className="text-[10px] text-text-secondary/60">Enter a value between 0 and 100</span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-text-secondary block border-b border-white/[0.06] pb-2">Subject Performance (0 - 100)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(academic.class10.subjects).map(([subj, score]) => (
                      <div key={subj} className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-[18px] flex flex-col space-y-1 items-center">
                        <span className="text-xs font-bold text-text-secondary uppercase text-center leading-tight">{subj === 'maths' ? 'Mathematics' : subj === 'sst' ? 'SST' : subj}</span>
                        <input type="number" min="0" max="100"
                          value={score}
                          onChange={(e) => setAcademic({
                            ...academic,
                            class10: { ...academic.class10, subjects: { ...academic.class10.subjects, [subj]: parseInt(e.target.value) || 0 } }
                          })}
                          className="w-full bg-transparent text-center text-sm font-semibold text-text-primary focus:outline-none border-b border-transparent focus:border-ai-cyan/50" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Favorite Subjects</label>
                    <input type="text"
                      value={academic.class10.favorite_subjects.join(', ')}
                      onChange={(e) => setAcademic({ ...academic, class10: { ...academic.class10, favorite_subjects: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } })}
                      placeholder="e.g. maths, computer"
                      className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Weak Subjects</label>
                    <input type="text"
                      value={academic.class10.weak_subjects.join(', ')}
                      onChange={(e) => setAcademic({ ...academic, class10: { ...academic.class10, weak_subjects: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } })}
                      placeholder="e.g. sst, english"
                      className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                  </div>
                </div>
              </div>

              {/* Section 2: Class 12 */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5 space-y-4">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Class 12 Academic Details</h3>

                <label className="flex items-center space-x-3 text-sm text-text-primary cursor-pointer select-none">
                  <input type="checkbox"
                    checked={!!academic.class12.status}
                    onChange={(e) => setAcademic({ ...academic, class12: { ...academic.class12, status: e.target.checked ? 'pursuing' : '', stream: '', subjects: {} } })}
                    className="rounded text-brand focus:ring-0" />
                  <span>I am studying / have completed Class 12</span>
                </label>

                {academic.class12.status && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">Status</label>
                      <div className="flex gap-4">
                        {['pursuing', 'completed'].map((opt) => (
                          <label key={opt} className="flex items-center space-x-2 text-sm text-text-primary cursor-pointer select-none">
                            <input type="radio" name="c12status" value={opt}
                              checked={academic.class12.status === opt}
                              onChange={(e) => setAcademic({ ...academic, class12: { ...academic.class12, status: e.target.value } })}
                              className="text-brand focus:ring-0" />
                            <span className="capitalize">{opt} Class 12</span>
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
                        <option value="diploma">Diploma</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Class 12 Overall Percentage</label>
                      <input type="number" min="0" max="100"
                        value={academic.class12.percentage}
                        onChange={(e) => setAcademic({ ...academic, class12: { ...academic.class12, percentage: parseFloat(e.target.value) || 0 } })}
                        className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50" />
                      <span className="text-[10px] text-text-secondary/60">Enter a value between 0 and 100</span>
                    </div>

                    {academic.class12.stream && !['diploma', 'other'].includes(academic.class12.stream) && (
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-text-secondary block border-b border-white/[0.06] pb-2">Subject Performance (0 - 100)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {STREAM_SUBJECTS[academic.class12.stream].map((subj) => {
                            const key = SUBJECT_KEY[subj];
                            return (
                              <div key={key} className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-[18px] flex flex-col space-y-1 items-center">
                                <span className="text-xs font-bold text-text-secondary uppercase text-center leading-tight">{subj}</span>
                                <input type="number" min="0" max="100"
                                  value={academic.class12.subjects[key] || 0}
                                  onChange={(e) => setAcademic({
                                    ...academic,
                                    class12: { ...academic.class12, subjects: { ...academic.class12.subjects, [key]: parseInt(e.target.value) || 0 } }
                                  })}
                                  className="w-full bg-transparent text-center text-sm font-semibold text-text-primary focus:outline-none border-b border-transparent focus:border-ai-cyan/50" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {['diploma', 'other'].includes(academic.class12.stream) && (
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
                              <input type="number" min="0" max="100" value={score}
                                onChange={(e) => setAcademic({
                                  ...academic,
                                  class12: { ...academic.class12, subjects: { ...academic.class12.subjects, [subj]: parseInt(e.target.value) || 0 } }
                                })}
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
                        <input type="text"
                          value={academic.class12.favorite_subjects.join(', ')}
                          onChange={(e) => setAcademic({ ...academic, class12: { ...academic.class12, favorite_subjects: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } })}
                          placeholder="e.g. physics, maths"
                          className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Weak Subjects</label>
                        <input type="text"
                          value={academic.class12.weak_subjects.join(', ')}
                          onChange={(e) => setAcademic({ ...academic, class12: { ...academic.class12, weak_subjects: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } })}
                          placeholder="e.g. chemistry, english"
                          className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50 transition-all" />
                      </div>
                    </div>
                  </>
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
                              star <= (skills[f] || 3) ? 'fill-warning text-warning' : 'text-text-disabled'
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Budget Tier (Annual Fees)</label>
                  <select
                    value={constraints.budget_tier}
                    onChange={(e) => setConstraints({ ...constraints, budget_tier: parseInt(e.target.value, 10) || 3 })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50"
                  >
                    <option value="1">Tier 1: Under ₹50,000 / year</option>
                    <option value="2">Tier 2: ₹50,000 - ₹2,00,000 / year</option>
                    <option value="3">Tier 3: ₹2,00,000 - ₹5,00,000 / year</option>
                    <option value="4">Tier 4: Above ₹5,00,000 / year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Max Study Duration (Years)</label>
                  <input
                    type="number"
                    value={constraints.study_duration_max}
                    onChange={(e) => setConstraints({ ...constraints, study_duration_max: parseInt(e.target.value, 10) || 4 })}
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-ai-cyan/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Preferred State/City</label>
                  <input
                    type="text"
                    value={constraints.preferred_location}
                    onChange={(e) => setConstraints({ ...constraints, preferred_location: e.target.value })}
                    placeholder="e.g. Pune, Mumbai, Bangalore"
                    className="w-full bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50"
                  />
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
          <div className="flex justify-between items-center pt-6 border-t border-white/[0.06] mt-6">
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
              disabled={saving || (currentStep.key === 'scenarios' && scenarios.length > 0 && Object.keys(scenarioResponses).length < scenarios.length)}
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
