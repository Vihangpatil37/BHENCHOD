import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import {
  Sparkles,
  Bookmark,
  CheckCircle,
  ArrowRight,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, clearAuth } = useAuthStore();
  const [loadingData, setLoadingData] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [accessToken]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const res: any = await client.get('/dashboard');
      setDashboardData(res);
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth();
        navigate('/login');
      }
    } finally {
      setLoadingData(false);
    }
  };



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user) return null;

  if (loadingData) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <Skeleton className="h-[180px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[160px] w-full" />
          <Skeleton className="h-[160px] w-full" />
        </div>
      </div>
    );
  }

  const journey = dashboardData?.journey || { onboarding_percentage: 0, current_state: 'Onboarding' };
  const recommendations = dashboardData?.recommendation || { available: false, count: 0, stale: false };
  const savedCareers = dashboardData?.saved_careers || { count: 0 };
  const nextAction = dashboardData?.next_action || 'Complete Onboarding questionnaire steps.';
  const aiInsight = dashboardData?.ai_insight || 'Once onboarding completes, your trait profile and matched sectors will appear here.';

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8 p-4 md:p-8">

      {/* Top Welcome Card */}
      <GlassCard elevation={2} className="relative overflow-hidden p-8 border border-solid border-white/[0.08] rounded-[24px]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand uppercase">
            <User size={14} />
            <span>Student Workspace</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-anton tracking-wide text-text-primary leading-tight">
            {getGreeting()},{' '}
            <span className="text-brand">
              {user.full_name}
            </span>
          </h1>
          <p className="text-text-secondary max-w-2xl text-sm md:text-base leading-relaxed">
            Welcome to the Smart Career Path Recommendation System. Explore your personalized AI roadmaps, traits metrics, and counseling channels.
          </p>
        </div>
      </GlassCard>

      {/* Dashboard Grid Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Onboarding progress */}
        <GlassCard elevation={2} className="p-6 border border-solid border-white/[0.08] rounded-[24px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Questionnaire Progress</span>
              <span className="text-xs text-brand font-bold bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded-full">{journey.onboarding_percentage}%</span>
            </div>
            <h3 className="text-base font-bold text-text-primary capitalize">{journey.current_state} Step</h3>
            
            {/* Progress track */}
            <div className="w-full bg-white/[0.05] h-2 rounded-[999px] overflow-hidden border border-white/[0.06]">
              <div
                className="bg-gradient-to-r from-brand to-[#70E1FF] h-full rounded-[999px] transition-all duration-500"
                style={{ width: `${journey.onboarding_percentage}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-6 flex items-center justify-between text-xs text-brand hover:text-text-primary font-bold group select-none cursor-pointer focus:outline-none"
          >
            <span>{journey.onboarding_percentage === 100 ? 'Review Answers' : 'Continue Questionnaire'}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-180" />
          </button>
        </GlassCard>

        {/* AI Matches */}
        <GlassCard elevation={2} className="p-6 border border-solid border-white/[0.08] rounded-[24px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">AI Recommendations</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-solid ${
                recommendations.available
                  ? recommendations.stale
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-success/10 text-success border-success/20'
                  : 'bg-white/[0.02] border-white/[0.06] text-text-disabled'
              }`}>
                {recommendations.available
                  ? recommendations.stale
                    ? 'Stale'
                    : 'Ready'
                  : 'Pending'}
              </span>
            </div>
            <h3 className="text-base font-bold text-text-primary">
              {recommendations.available ? `${recommendations.count} Matched Paths` : 'No Matched Paths'}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {recommendations.available
                ? 'AI has successfully mapped unique matching vectors across sectors.'
                : 'Complete all steps to generate matching similarity calculations.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/careers')}
            className="mt-6 flex items-center justify-between text-xs text-brand hover:text-text-primary font-bold group select-none cursor-pointer focus:outline-none"
          >
            <span>{recommendations.available ? 'Explore Matches' : 'Configure Profile'}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-180" />
          </button>
        </GlassCard>

        {/* Bookmarks / Recent Activity */}
        <GlassCard elevation={2} className="p-6 border border-solid border-white/[0.08] rounded-[24px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Bookmarks</span>
              <Bookmark className="h-4 w-4 text-brand" />
            </div>
            <h3 className="text-base font-bold text-text-primary">{savedCareers.count} Bookmarked Paths</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Tracked paths appear dynamically in matching indices and Counselor references.
            </p>
          </div>
          <button
            onClick={() => navigate('/careers')}
            className="mt-6 flex items-center justify-between text-xs text-brand hover:text-text-primary font-bold group select-none cursor-pointer focus:outline-none"
          >
            <span>View Bookmarks</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-180" />
          </button>
        </GlassCard>

      </section>

      {/* Suggested Roadmaps & Insights */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Action Suggested / Continue Roadmap */}
        <GlassCard elevation={2} className="p-6 border border-solid border-white/[0.08] rounded-[24px] space-y-4">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
            <CheckCircle className="h-4 w-4 text-brand" />
            <span>Recommended Next Action</span>
          </h3>
          <p className="text-sm font-semibold text-text-primary leading-relaxed">{nextAction}</p>
          <div className="flex gap-3 pt-2">
            <Button
              size="sm"
              onClick={() => {
                if (journey.onboarding_percentage < 100) {
                  navigate('/onboarding');
                } else {
                  navigate('/careers');
                }
              }}
            >
              Go to Step
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/chat')}
            >
              Chat Counselor
            </Button>
          </div>
        </GlassCard>

        {/* AI Insight widget */}
        <GlassCard elevation={2} className="p-6 border border-solid border-white/[0.08] rounded-[24px] space-y-4">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="h-4 w-4 text-brand" />
            <span>AI Personality Insight</span>
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed font-medium">
            {aiInsight}
          </p>
        </GlassCard>

      </section>


    </motion.div>
  );
};
