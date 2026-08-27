import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import {
  History,
  Calendar,
  Compass,
  Award,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';
import { formatDateTime } from '../lib/formatDate';

interface HistoryItem {
  type: 'onboarding' | 'recommendation' | 'saved_career';
  timestamp: string;
  title: string;
  detail: any;
}

export const HistoryLog: React.FC = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchHistory();
  }, [activeTab, currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res: any = await client.get('/history', {
        params: {
          type: activeTab,
          page: currentPage,
          limit,
        },
      });
      setHistoryItems(res.items || []);
      setTotalItems(res.total || 0);
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="p-6 md:p-12 space-y-8">
        
        {/* Title */}
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white flex items-center space-x-3">
            <History className="h-8 w-8 text-accent" />
            <span>Your Activity Timeline</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Review chronological snapshots of onboarding recomputes, recommendations, and saved careers.</p>
        </div>

        {/* Filters Tabs */}
        <div className="flex flex-wrap gap-2 relative z-10 select-none border-b border-white/5 pb-4">
          {[
            { key: 'all', label: 'All Activities' },
            { key: 'onboarding', label: 'Onboarding DNA' },
            { key: 'recommendations', label: 'AI Matches' },
            { key: 'careers', label: 'Saved Bookmarks' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                activeTab === t.key
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-white/[0.03] border-white/10 text-text-muted hover:bg-white/10/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Timeline items list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <span className="text-text-muted text-xs font-semibold">Loading timeline events...</span>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-8 bg-white/[0.03]/30 border border-white/5 rounded-3xl text-center space-y-3 relative z-10">
            <Info className="h-8 w-8 text-accent mx-auto" />
            <h3 className="text-sm font-bold text-white">No history items found</h3>
            <p className="text-text-muted/60 text-xs max-w-sm mx-auto">
              Once you start saving onboarding steps or bookmarking career paths, your timeline log will compile here.
            </p>
          </div>
        ) : (
          <div className="relative z-10 space-y-6 max-w-3xl">
            {/* Vertical timeline line */}
            <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-white/[0.03] pointer-events-none" />

            {historyItems.map((item, index) => {
              const formattedDate = formatDateTime(item.timestamp);
              let Icon = History;
              let dotColor = 'border-white/10 bg-bg text-text-muted/60';
              
              if (item.type === 'onboarding') {
                Icon = BookOpen;
                dotColor = 'border-accent bg-accent/10 text-accent';
              } else if (item.type === 'recommendation') {
                Icon = Award;
                dotColor = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
              } else if (item.type === 'saved_career') {
                Icon = Compass;
                dotColor = 'border-pink-500 bg-pink-500/10 text-pink-400';
              }

              return (
                <div key={index} className="relative pl-12 flex flex-col justify-start group">
                  {/* Timeline bullet dot */}
                  <div className={`absolute left-0 top-1 w-11 h-11 rounded-2xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${dotColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="p-6 bg-white/[0.03] border border-white/[0.06] hover:border-white/20 rounded-2xl backdrop-blur-sm space-y-3 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h3 className="text-sm font-bold text-text/80 group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <span className="flex items-center space-x-1.5 text-[10px] text-text-muted/60 font-semibold bg-bg px-2.5 py-1 rounded-md border border-white/5 select-none shrink-0 w-fit">
                        <Calendar className="h-3 w-3" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>

                    {/* Details rendering depending on event type */}
                    {item.type === 'onboarding' && item.detail?.dna && (
                      <div className="bg-bg p-4 border border-white/[0.06] rounded-xl space-y-3">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wide">DNA Snapshot</span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                          {Object.entries(item.detail.dna).map(([trait, val]: any) => (
                            <div key={trait} className="p-2 bg-white/[0.05] border border-white/5 rounded-lg flex flex-col space-y-0.5 items-center">
                              <span className="text-[8px] text-text-muted/60 uppercase font-black truncate max-w-full">{trait.replace('_', ' ')}</span>
                              <span className="font-bold text-white">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.type === 'recommendation' && item.detail?.top_careers && (
                      <div className="bg-bg p-4 border border-white/[0.06] rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Top Matched Careers</span>
                        <div className="flex flex-wrap gap-2.5">
                          {item.detail.top_careers.map((tc: string) => (
                            <span
                              key={tc}
                              onClick={() => navigate('/careers')}
                              className="text-[10px] font-bold text-text/80 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                            >
                              🏆 {tc.replace('_', ' ').toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.type === 'saved_career' && item.detail?.career_code && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-text-muted/60">Bookmarked career: <strong className="text-text/80 font-bold uppercase">{item.detail.career_code.replace('_', ' ')}</strong></span>
                        <button
                          onClick={() => navigate('/careers')}
                          className="flex items-center space-x-1.5 text-accent hover:text-accent/80 transition-colors font-bold uppercase tracking-wider text-[9px]"
                        >
                          <span>Explore Career</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-8 border-t border-white/5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white/[0.03] border border-white/10 text-text-muted hover:text-white rounded-xl disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xs font-semibold text-text-muted/60">
                  Page <strong className="text-text/80 font-bold">{currentPage}</strong> of <strong className="text-text/80 font-bold">{totalPages}</strong>
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white/[0.03] border border-white/10 text-text-muted hover:text-white rounded-xl disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

          </div>
        )}

    </motion.div>
  );
};
