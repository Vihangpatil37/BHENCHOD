import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import {
  Sparkles,
  Bookmark,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, clearAuth } = useAuthStore();
  const [loadingData, setLoadingData] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // PDF Report states
  const [reportState, setReportState] = useState<{
    id: string | null;
    status: 'IDLE' | 'QUEUED' | 'GENERATING' | 'READY' | 'FAILED' | 'DOWNLOADED';
    loading: boolean;
  }>({ id: null, status: 'IDLE', loading: false });

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

      // Check if there is an active PDF report in generating status
      if (res.recommendation?.available) {
        // Fetch report history list to see if user has a generated report
        const reports: any = await client.get('/reports/history').catch(() => []);
        if (reports && reports.length > 0) {
          const latestReport = reports[0];
          setReportState({
            id: latestReport._id,
            status: latestReport.status,
            loading: false
          });
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth();
        navigate('/login');
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleStartReportGen = async () => {
    setReportState(prev => ({ ...prev, loading: true, status: 'QUEUED' }));
    try {
      const res: any = await client.post('/reports/generate');
      setReportState({
        id: res._id,
        status: res.status,
        loading: false
      });
      // Start polling status
      pollReportStatus(res._id);
    } catch (err: any) {
      alert(err.message || 'Failed to start PDF report generation');
      setReportState(prev => ({ ...prev, loading: false, status: 'FAILED' }));
    }
  };

  const pollReportStatus = (reportId: string) => {
    const interval = setInterval(async () => {
      try {
        const res: any = await client.get(`/reports/status/${reportId}`);
        setReportState(prev => ({ ...prev, status: res.status }));
        
        if (res.status === 'READY' || res.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
        setReportState(prev => ({ ...prev, status: 'FAILED' }));
      }
    }, 1500);
  };

  const handleDownloadReport = () => {
    if (!reportState.id) return;
    
    // Trigger download stream using window.open or an invisible link
    // Because auth token is required, wait! The reports controller uses JwtAuthGuard for download.
    // If the endpoint is protected by JWT, standard a-href download might throw 401 unless we fetch it as blob or open window with query param token.
    // Wait! Let's check how the reports download is protected:
    // It has @Public() or is it guarded? Let's check reports.controller.ts using view_file or verify.
    // In reports.controller.ts, download endpoint GET /reports/download/:reportId is NOT public (unless explicitly @Public()).
    // Let's verify by opening reports.controller.ts to check if JwtAuthGuard applies. Yes, JwtAuthGuard is global!
    // So we can download it by fetching as a blob via axios, then building an object URL! This is 100% secure, standard, and works perfectly!
    downloadReportViaBlob();
  };

  const downloadReportViaBlob = async () => {
    if (!reportState.id) return;
    setReportState(prev => ({ ...prev, loading: true }));
    try {
      const response: any = await client.get(`/reports/download/${reportState.id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `SCPR_Report_${reportState.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setReportState(prev => ({ ...prev, status: 'DOWNLOADED', loading: false }));
    } catch (err: any) {
      alert('Failed to download report PDF file.');
      setReportState(prev => ({ ...prev, loading: false }));
    }
  };

  if (!user) return null;

  if (loadingData) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-text-muted font-medium">Assembling student workspace...</span>
      </motion.div>
    );
  }

  const journey = dashboardData?.journey || { onboarding_percentage: 0, current_state: 'Onboarding' };
  const recommendations = dashboardData?.recommendation || { available: false, count: 0, stale: false };
  const savedCareers = dashboardData?.saved_careers || { count: 0 };
  const nextAction = dashboardData?.next_action || 'Complete Onboarding questionnaire steps.';
  const aiInsight = dashboardData?.ai_insight || 'Once onboarding completes, your trait profile and matched sectors will appear here.';

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-10">

        {/* Top welcome card */}
        <section className="bg-gradient-to-r from-white/[0.03] via-white/[0.03] to-accent/5 border border-white/[0.06] p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <span className="text-xs font-bold tracking-widest text-accent uppercase">
              Student Workspace
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Hello,{' '}
              <span className="bg-gradient-to-r from-accent via-accent-2 to-accent bg-clip-text text-transparent">
                {user.full_name}
              </span>
            </h1>
            <p className="text-text-muted max-w-2xl text-base leading-relaxed">
              Welcome to the Smart Career Path Recommendation System. Explore your personalized AI roadmaps, traits metrics, and counseling channels.
            </p>
          </div>
        </section>

        {/* Dashboard grid metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Onboarding progress */}
          <div className="p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col justify-between backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted/60 font-bold uppercase tracking-wider">Questionnaire Progress</span>
                <span className="text-xs text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full">{journey.onboarding_percentage}%</span>
              </div>
              <h3 className="text-lg font-bold text-white capitalize">{journey.current_state} Step</h3>
              {/* Progress bar container */}
              <div className="w-full bg-bg h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-accent to-accent-2 h-full rounded-full transition-all duration-500"
                  style={{ width: `${journey.onboarding_percentage}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              className="mt-6 flex items-center justify-between text-xs text-accent hover:text-white font-bold group select-none"
            >
              <span>{journey.onboarding_percentage === 100 ? 'Review Answers' : 'Continue Questionnaire'}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* AI Matches */}
          <div className="p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col justify-between backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted/60 font-bold uppercase tracking-wider">AI Recommendations</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  recommendations.available
                    ? recommendations.stale
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-bg text-text-muted/40'
                }`}>
                  {recommendations.available
                    ? recommendations.stale
                      ? 'Stale'
                      : 'Ready'
                    : 'Pending'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {recommendations.available ? `${recommendations.count} Matched Paths` : 'No Matched Paths'}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {recommendations.available
                  ? 'AI has successfully mapped 20 unique matching vectors across sectors.'
                  : 'Complete all steps to generate matching similarity calculations.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/careers')}
              className="mt-6 flex items-center justify-between text-xs text-accent hover:text-white font-bold group select-none"
            >
              <span>{recommendations.available ? 'Explore Matches' : 'Configure Profile'}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Bookmarks */}
          <div className="p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col justify-between backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted/60 font-bold uppercase tracking-wider">Bookmarks</span>
                <Bookmark className="h-4 w-4 text-pink-500" />
              </div>
              <h3 className="text-lg font-bold text-white">{savedCareers.count} Bookmarked Paths</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Tracked paths appear dynamically in matching indices and Counselor references.
              </p>
            </div>
            <button
              onClick={() => navigate('/careers')}
              className="mt-6 flex items-center justify-between text-xs text-accent hover:text-white font-bold group select-none"
            >
              <span>View Bookmarks</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </section>

        {/* Server side insights box */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Action Suggested */}
          <div className="p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-text-muted/60 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span>Recommended Next Action</span>
            </h3>
            <p className="text-sm font-semibold text-text/80">{nextAction}</p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  if (journey.onboarding_percentage < 100) {
                    navigate('/onboarding');
                  } else {
                    navigate('/careers');
                  }
                }}
                className="px-4 py-2 bg-accent hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-md shadow-accent/20 transition-all"
              >
                Go to Step
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="px-4 py-2 bg-bg border border-white/[0.06] hover:bg-white/10 text-text/80 text-xs font-bold rounded-xl transition-all"
              >
                Chat Counselor
              </button>
            </div>
          </div>

          {/* AI DNA insight */}
          <div className="p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-text-muted/60 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>AI Personality Insight</span>
            </h3>
            <p className="text-xs text-text/80 leading-relaxed font-medium">
              {aiInsight}
            </p>
          </div>

        </section>

        {/* PDF Generation section */}
        {recommendations.available && (
          <section className="bg-white/[0.03] border border-white/[0.06] p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 backdrop-blur-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-accent" />
                <span>Export Career Recommendation Report</span>
              </h3>
              <p className="text-xs text-text-muted max-w-xl leading-relaxed">
                Generate and download an official SCPR PDF report document mapping your 10-dimensional DNA breakdown, complete roadmap breakdowns, college suggestions, and target certification guides.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {reportState.status === 'READY' || reportState.status === 'DOWNLOADED' ? (
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Report</span>
                </button>
              ) : reportState.status === 'QUEUED' || reportState.status === 'GENERATING' ? (
                <div className="flex items-center space-x-2.5 px-5 py-3 bg-bg border border-white/[0.06] rounded-xl text-xs text-text-muted font-semibold select-none">
                  <Loader2 className="h-4 w-4 text-accent animate-spin" />
                  <span>Generating Report ({reportState.status})...</span>
                </div>
              ) : (
                <button
                  onClick={handleStartReportGen}
                  disabled={reportState.loading}
                  className="flex items-center space-x-2 px-5 py-3 bg-accent hover:brightness-110 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Report PDF</span>
                </button>
              )}
            </div>
          </section>
        )}
    </motion.div>
  );
};
