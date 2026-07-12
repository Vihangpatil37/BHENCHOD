import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Compass,
  Loader2,
  Award,
  ChevronRight,
  Info,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

interface Career {
  career_code: string;
  name: string;
  sector: string;
  description: string;
  growth_rate: string;
  average_salary: string;
  entry_requirements: string;
  skills_required: string[];
  trait_weights: Record<string, number>;
}

export const CareerExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [latestRec, setLatestRec] = useState<any>(null);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [careersList, setCareersList] = useState<Career[]>([]);
  
  // Detail Modal
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [selectedRecDetail, setSelectedRecDetail] = useState<any>(null);
  const [relatedCareers, setRelatedCareers] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch latest recommendations
      try {
        const recRes: any = await client.get('/recommendations/latest');
        setLatestRec(recRes);
      } catch (e) {
        // Recommendations might not exist yet if onboarding is incomplete
        setLatestRec(null);
      }

      // 2. Fetch bookmarks
      const savedRes: any = await client.get('/careers/saved');
      setSavedCodes(savedRes.map((sc: any) => sc.career_code));

      // 3. Fetch all careers for explorer search
      const careersRes: any = await client.get('/careers');
      setCareersList(careersRes);
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearAuth();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (careerCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isBookmarked = savedCodes.includes(careerCode);
    try {
      if (isBookmarked) {
        await client.delete(`/careers/save/${careerCode}`);
        setSavedCodes(savedCodes.filter(c => c !== careerCode));
      } else {
        await client.post('/careers/save', { career_code: careerCode });
        setSavedCodes([...savedCodes, careerCode]);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res: any = await client.post('/recommendations/regenerate');
      setLatestRec(res);
    } catch (err: any) {
      alert(err.message || 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  const handleViewDetails = async (careerCode: string) => {
    try {
      // Find recommendation details if this is one of the top 5 matches
      const recItem = latestRec?.final_recommendations?.find((fr: any) => fr.career_code === careerCode);
      setSelectedRecDetail(recItem || null);

      // Fetch career from catalog
      const career: any = await client.get(`/careers/${careerCode}`);
      setSelectedCareer(career);

      // Fetch related careers
      const related: any = await client.get(`/careers/related/${careerCode}`);
      setRelatedCareers(related);
    } catch (err) {
      console.error(err);
    }
  };

  const sectors = ['All', ...Array.from(new Set(careersList.map((c) => c.sector)))];

  const filteredCareers = careersList.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'All' || c.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <span className="text-text-muted font-medium">Analyzing career matches...</span>
      </div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-12">
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-white">Career Path Explorer</h1>
            <p className="text-text-muted text-sm mt-1">Review your AI-generated matches, bookmarked profiles, and catalog requirements.</p>
          </div>
          {latestRec && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/10 text-accent border border-accent/30 hover:border-accent/50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Regenerate Matches</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* AI Recommendations Section */}
        {latestRec ? (
          <section className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="h-5 w-5 text-accent" />
                <span>Your Top AI Recommended Career Paths</span>
              </h2>
              {latestRec.stale && (
                <span className="text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full flex items-center space-x-1.5 animate-pulse">
                  ⚠️ Profile Edited — Matches Stale
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestRec.final_recommendations?.map((rec: any) => {
                const career = careersList.find(c => c.career_code === rec.career_code);
                const isBookmarked = savedCodes.includes(rec.career_code);
                return (
                  <div
                    key={rec.career_code}
                    onClick={() => handleViewDetails(rec.career_code)}
                    className="p-6 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10/80 hover:border-white/20 rounded-3xl backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-[1.01] group flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-accent uppercase tracking-wider bg-accent/10 px-2.5 py-0.5 rounded-full">
                            Rank #{rec.rank}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-accent/80 transition-colors">
                            {career?.name || rec.career_code.replace('_', ' ').toUpperCase()}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                            {rec.ai_score}% Match
                          </span>
                          <button
                            onClick={(e) => handleToggleBookmark(rec.career_code, e)}
                            className="p-1.5 rounded-xl bg-bg/60 border border-white/10 hover:border-white/30 text-text-muted hover:text-white transition-all"
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="h-4 w-4 text-accent" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {rec.explanation}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5/60 mt-4 text-xs font-semibold text-text-muted">
                      <span className="capitalize">{career?.sector || 'General'} Sector</span>
                      <span className="flex items-center space-x-1 text-accent group-hover:translate-x-1 transition-transform">
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Other Shortlisted Matches */}
            {latestRec.shortlist?.length > 5 && (
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                <span className="text-xs font-bold text-text-muted block border-b border-white/5 pb-3">Additional Matched Careers ({latestRec.shortlist.length - 5})</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {latestRec.shortlist.slice(5).map((entry: any) => {
                    const c = careersList.find(car => car.career_code === entry.career_code);
                    return (
                      <div
                        key={entry.career_code}
                        onClick={() => handleViewDetails(entry.career_code)}
                        className="p-3 bg-bg/60 hover:bg-white/[0.05] border border-white/10/40 rounded-2xl flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold text-text/80 truncate">{c?.name || entry.career_code}</p>
                          <span className="text-[10px] text-emerald-400 font-bold">{entry.match_score}% Match</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-text-muted/40 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl text-center space-y-4 relative z-10">
            <Info className="h-8 w-8 text-accent mx-auto" />
            <h3 className="text-lg font-bold text-white">No AI matches generated yet</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Please complete your onboarding questionnaire steps to automatically generate AI matched career roadmaps.
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-5 py-2 bg-accent hover:brightness-110 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-accent/20"
            >
              Start Onboarding
            </button>
          </section>
        )}

        {/* Global Catalog Search Section */}
        <section className="space-y-6 relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Compass className="h-5 w-5 text-accent" />
            <span>Search Full Careers Library</span>
          </h2>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-3 h-4 w-4 text-text-muted/60" />
              <input
                type="text"
                placeholder="Search by career title, sector, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10/80 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent placeholder-text-muted/60"
              />
            </div>
            
            {/* Sector Tabs */}
            <div className="flex flex-wrap gap-2">
              {sectors.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedSector === sec
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-white/[0.05] border-white/10 text-text-muted hover:bg-white/10/60'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Grid list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCareers.map((c) => {
              const isBookmarked = savedCodes.includes(c.career_code);
              return (
                <div
                  key={c.career_code}
                  onClick={() => handleViewDetails(c.career_code)}
                  className="p-5 bg-white/[0.02] hover:bg-white/[0.03] border border-white/5 hover:border-white/10/80 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-widest bg-bg px-2.5 py-0.5 rounded-full border border-white/10/50">
                        {c.sector}
                      </span>
                      <button
                        onClick={(e) => handleToggleBookmark(c.career_code, e)}
                        className="p-1 rounded-lg bg-bg/60 border border-white/5 text-text-muted/60 hover:text-white"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-text/80">{c.name}</h3>
                    <p className="text-xs text-text-muted/60 line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-accent font-semibold pt-3 mt-3 border-t border-white/5/50">
                    <span>View requirements</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Drawer Modal */}
        {selectedCareer && (
          <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-end z-50 animate-fade-in">
            <div className="w-full max-w-xl h-full bg-white/[0.03] border-l border-white/10 p-8 flex flex-col justify-between overflow-y-auto animate-slide-in">
              <div className="space-y-6">
                
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      {selectedCareer.sector}
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2">{selectedCareer.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedCareer(null)}
                    className="p-1 rounded-xl bg-bg border border-white/10 text-text-muted hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Overview</span>
                  <p className="text-xs text-text/80 leading-relaxed">{selectedCareer.description}</p>
                </div>

                {/* Trait weights */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Core Traits Requirements</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedCareer.trait_weights).map(([trait, weight]) => (
                      <div key={trait} className="p-2 bg-bg border border-white/[0.06] rounded-xl flex items-center justify-between">
                        <span className="text-[10px] text-text-muted capitalize">{trait.replace('_', ' ')}</span>
                        <span className="text-[10px] font-bold text-accent">{weight}/10</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic gates */}
                <div className="space-y-2 bg-bg p-4 border border-white/[0.06] rounded-2xl">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wide flex items-center space-x-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Career Insights</span>
                  </span>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                    <div>
                      <span className="text-text-muted/60">Average Salary</span>
                      <p className="font-bold text-white mt-0.5">{selectedCareer.average_salary || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-text-muted/60">Growth Rate</span>
                      <p className="font-bold text-emerald-400 mt-0.5">{selectedCareer.growth_rate || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-text-muted/60">Minimum Academic Requirements</span>
                      <p className="text-text/80 mt-0.5 font-medium leading-relaxed">{selectedCareer.entry_requirements || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* AI generated recommendations details (roadmap, suggested colleges, etc) */}
                {selectedRecDetail && (
                  <div className="space-y-4 border-t border-white/[0.06] pt-5">
                    <span className="text-xs font-bold text-accent uppercase tracking-wider block">AI Generated Roadmaps & Guidance</span>
                    
                    <div className="space-y-1.5">
                      <span className="text-xs text-text-muted font-bold">Suggested Path:</span>
                      <p className="text-xs text-text/80 bg-accent/5 border border-accent/10 p-3.5 rounded-xl font-medium leading-relaxed">
                        {selectedRecDetail.roadmap}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-text-muted font-bold block mb-1">Target Colleges</span>
                        <div className="space-y-1">
                          {selectedRecDetail.suggested_colleges?.map((c: string) => (
                            <span key={c} className="block text-[10px] text-text/80 bg-bg px-2.5 py-1.5 rounded-lg border border-white/[0.06] truncate font-semibold">
                              🎓 {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted font-bold block mb-1">Certifications</span>
                        <div className="space-y-1">
                          {selectedRecDetail.suggested_certifications?.map((cert: string) => (
                            <span key={cert} className="block text-[10px] text-text/80 bg-bg px-2.5 py-1.5 rounded-lg border border-white/[0.06] truncate font-semibold">
                              🏆 {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Careers */}
                {relatedCareers.length > 0 && (
                  <div className="space-y-3 border-t border-white/[0.06] pt-5">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wide block">Related Careers</span>
                    <div className="grid grid-cols-2 gap-2">
                      {relatedCareers.map((rc) => (
                        <button
                          key={rc.career_code}
                          onClick={() => handleViewDetails(rc.career_code)}
                          className="p-3 bg-bg border border-white/[0.06] hover:border-white/20 text-left rounded-xl transition-all hover:scale-[1.01]"
                        >
                          <span className="block text-[11px] font-bold text-text/80 truncate">{rc.name}</span>
                          <span className="text-[9px] text-text-muted/60 capitalize">{rc.sector}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-center gap-3">
                <button
                  onClick={(e) => handleToggleBookmark(selectedCareer.career_code, e)}
                  className={`flex-grow flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    savedCodes.includes(selectedCareer.career_code)
                      ? 'bg-bg border-white/10 text-accent'
                      : 'bg-accent border-accent text-white shadow-lg shadow-accent/10'
                  }`}
                >
                  {savedCodes.includes(selectedCareer.career_code) ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" />
                      <span>Saved Bookmark</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      <span>Bookmark Path</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedCareer(null);
                    navigate('/chat');
                  }}
                  className="px-5 py-3 bg-bg hover:bg-white/10 border border-white/10 text-text/80 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Ask Counselor
                </button>
              </div>

            </div>
          </div>
        )}
    </motion.div>
  );
};
