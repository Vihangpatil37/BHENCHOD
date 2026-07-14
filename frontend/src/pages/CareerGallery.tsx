import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { Search, Loader2, X, ChevronRight, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '../lib/motion';
import { CATALOGS, catalogFor } from '../lib/catalogs';

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-8">
      <div className="relative z-10">
        <h1 className="text-3xl font-black text-white">Career Gallery</h1>
        <p className="text-text-muted text-sm mt-1">Browse all careers in the system. Click any card to explore details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 relative z-10">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-3 h-4 w-4 text-text-muted/60" />
          <input
            list="gallery-careers"
            type="text"
            placeholder="Search careers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10/80 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent placeholder-text-muted/60"
          />
          <datalist id="gallery-careers">
            {careers.map(c => (
              <option key={c.career_code} value={c.name} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCatalog('All')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedCatalog === 'All'
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-white/[0.05] border-white/10 text-text-muted hover:bg-white/10/60'
            }`}
          >
            All
          </button>
          {CATALOGS.map(cat => (
            <button
              key={cat.code}
              onClick={() => setSelectedCatalog(cat.code)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedCatalog === cat.code
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-white/[0.05] border-white/10 text-text-muted hover:bg-white/10/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
        {filteredCareers.map(c => {
          const cat = catalogFor(c.category_code);
          return (
          <div
            key={c.career_code}
            onClick={() => setSelectedCareer(c)}
            className={`p-5 bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:border-accent/20 rounded-2xl border-t-2 ${cat.accent} flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/5`}
          >
            <div className="space-y-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${cat.badge}`}>
                {cat.label}
              </span>
              <h3 className="text-sm font-bold text-text/80">{c.name}</h3>
              <p className="text-xs text-text-muted/60 line-clamp-2 leading-relaxed">{c.description}</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-accent font-semibold pt-3 mt-3 border-t border-white/5/50">
              <span>View details</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCareer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedCareer(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white/[0.03] backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <Compass className="h-5 w-5 text-accent" />
                  <h2 className="text-lg font-bold text-white">Career Details</h2>
                </div>
                <button
                  onClick={() => setSelectedCareer(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-text-muted" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${catalogFor(selectedCareer.category_code).badge}`}>
                    {catalogFor(selectedCareer.category_code).label}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-3">{selectedCareer.name}</h3>
                </div>

                <p className="text-sm text-text/80 leading-relaxed">{selectedCareer.description}</p>

                {selectedCareer.entry_requirements && (
                  <div>
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Entry Requirements</h4>
                    <p className="text-sm text-text/70">{selectedCareer.entry_requirements}</p>
                  </div>
                )}

                {selectedCareer.skills_required?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Skills Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCareer.skills_required.map(skill => (
                        <span key={skill} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-text/70">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedCareer.average_salary && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Avg Salary</span>
                      <p className="text-sm font-bold text-accent mt-1">{selectedCareer.average_salary}</p>
                    </div>
                  )}
                  {selectedCareer.growth_rate && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Growth</span>
                      <p className="text-sm font-bold text-emerald-400 mt-1">{selectedCareer.growth_rate}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setSelectedCareer(null); navigate('/careers'); }}
                  className="w-full py-3 rounded-xl bg-accent hover:brightness-110 text-white font-bold text-sm transition-all"
                >
                  View Full Analysis in Career Explorer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
