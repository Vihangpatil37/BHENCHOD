export interface Catalog {
  code: string;
  label: string;
  accent: string;
  badge: string;
}

export const CATALOGS: Catalog[] = [
  { code: 'science', label: 'Science', accent: 'border-t-emerald-500/60', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { code: 'commerce', label: 'Commerce', accent: 'border-t-amber-500/60', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { code: 'arts_humanities', label: 'Arts & Humanities', accent: 'border-t-purple-500/60', badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { code: 'diploma', label: 'Diploma', accent: 'border-t-blue-500/60', badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { code: 'iti_polytechnic', label: 'ITI & Polytechnic', accent: 'border-t-orange-500/60', badge: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { code: 'vocational', label: 'Vocational', accent: 'border-t-teal-500/60', badge: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { code: 'government_defence', label: 'Government & Defence', accent: 'border-t-rose-500/60', badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { code: 'emerging_future', label: 'Emerging & Future', accent: 'border-t-indigo-500/60', badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
];

export function catalogFor(code?: string): Catalog {
  const safeCode = code || 'unknown';
  return CATALOGS.find(c => c.code === safeCode) ?? { 
    code: safeCode, 
    label: safeCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
    accent: 'border-t-white/5', 
    badge: 'text-text-muted/60 bg-bg border-white/10/50' 
  };
}
