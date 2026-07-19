import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { Search, X, ChevronRight, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '../lib/motion';
import { CATALOGS, catalogFor } from '../lib/catalogs';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

interface Career {
  career_code: string;
  name: string;
  category_code: string;
  source_catalog_parts: string[];
  description: string;
  growth_rate: string;
  average_salary: string;
  entry_requirements: string;
  skills_required: string[];
  trait_weights: Record<string, number>;
}

export const CareerGallery: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [careers, setCareers] = useState<Career[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState('All');
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const res: any = await client.get('/careers');
      setCareers(res);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const filteredCareers = careers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCatalog === 'All' || c.category_code === selectedCatalog;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-grow" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[180px]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8 p-4 md:p-8">
      <div className="relative z-10">
        <h1 className="text-3xl font-black text-text-primary">Career Gallery</h1>
        <p className="text-text-secondary text-sm mt-1">Browse all careers in the system. Click any card to explore details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 relative z-10 justify-between items-stretch md:items-center">
        {/* Search Field */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary h-4 w-4" />
          <input
            list="gallery-careers"
            type="text"
            placeholder="Search careers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all text-sm"
          />
          <datalist id="gallery-careers">
            {careers.map(c => (
              <option key={c.career_code} value={c.name} />
            ))}
          </datalist>
        </div>

        {/* Filter chips (floating list) */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 max-w-full">
          <button
            onClick={() => setSelectedCatalog('All')}
            className={`px-4 py-2 rounded-full border border-solid text-xs font-semibold whitespace-nowrap transition-all duration-180 cursor-pointer focus:outline-none ${
              selectedCatalog === 'All'
                ? 'bg-brand/10 border-brand text-brand'
                : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:border-white/[0.12] hover:bg-white/[0.05]'
            }`}
          >
            All
          </button>
          {CATALOGS.map(cat => (
            <button
              key={cat.code}
              onClick={() => setSelectedCatalog(cat.code)}
              className={`px-4 py-2 rounded-full border border-solid text-xs font-semibold whitespace-nowrap transition-all duration-180 cursor-pointer focus:outline-none ${
                selectedCatalog === cat.code
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-white/[0.02] border-white/[0.06] text-text-secondary hover:border-white/[0.12] hover:bg-white/[0.05]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smoothly animated layout grid on filter changes */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredCareers.map(c => {
            const cat = catalogFor(c.category_code);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                key={c.career_code}
                onClick={() => setSelectedCareer(c)}
                className="outline-none"
              >
                <GlassCard
                  elevation={2}
                  className="p-5 border border-solid border-white/[0.08] hover:border-brand/40 hover:-translate-y-0.5 rounded-[24px] cursor-pointer transition-all duration-180 flex flex-col justify-between h-full group"
                >
                  <div className="space-y-3">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-solid ${cat.badge}`}>
                      {cat.label}
                    </span>
                    <h3 className="text-base font-bold text-text-primary group-hover:text-brand transition-colors">{c.name}</h3>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-brand font-semibold pt-3 mt-3 border-t border-white/[0.06]">
                    <span>View details</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Detailed Modal/Drawer (GlassCard Elevation 4) */}
      <AnimatePresence>
        {selectedCareer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[20px] flex items-center justify-end z-50">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-lg h-full outline-none"
            >
              <GlassCard
                elevation={4}
                className="h-full rounded-none border-t-0 border-b-0 border-r-0 border-l border-solid border-white/[0.08] p-8 flex flex-col justify-between overflow-y-auto"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                    <div className="flex items-center space-x-3">
                      <Compass className="h-5 w-5 text-brand" />
                      <h2 className="text-lg font-bold text-text-primary">Career Details</h2>
                    </div>
                    <button
                      onClick={() => setSelectedCareer(null)}
                      className="p-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-text-secondary hover:text-text-primary cursor-pointer focus:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-solid ${catalogFor(selectedCareer.category_code).badge}`}>
                        {catalogFor(selectedCareer.category_code).label}
                      </span>
                      <h3 className="text-xl font-bold text-text-primary mt-3">{selectedCareer.name}</h3>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed">{selectedCareer.description}</p>

                    {selectedCareer.entry_requirements && (
                      <div className="bg-white/[0.02] border border-solid border-white/[0.06] p-4 rounded-[18px]">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Entry Requirements</h4>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{selectedCareer.entry_requirements}</p>
                      </div>
                    )}

                    {selectedCareer.skills_required?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Skills Required</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCareer.skills_required.map(skill => (
                            <span key={skill} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-solid border-white/[0.06] text-xs text-text-primary font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {selectedCareer.average_salary && (
                        <div className="p-4 rounded-[18px] bg-white/[0.02] border border-solid border-white/[0.06]">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Avg Salary</span>
                          <p className="text-sm font-bold text-brand mt-1">{selectedCareer.average_salary}</p>
                        </div>
                      )}
                      {selectedCareer.growth_rate && (
                        <div className="p-4 rounded-[18px] bg-white/[0.02] border border-solid border-white/[0.06]">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Growth</span>
                          <p className="text-sm font-bold text-success mt-1">{selectedCareer.growth_rate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/[0.06] mt-6">
                  <Button
                    onClick={() => { setSelectedCareer(null); navigate('/careers'); }}
                    className="w-full text-xs py-3"
                  >
                    View Full Analysis in Career Explorer
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
