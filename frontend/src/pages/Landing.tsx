import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useInView, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { Menu, X, User, ClipboardList, Brain, Sparkles, Map, MessageSquare, FileText, BarChart2, GraduationCap, Target, Users, Zap, Mail, ArrowRight, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionReveal } from '../components/shared/SectionReveal';
import { AmbientOrbs } from '../components/shared/AmbientOrbs';
import { fadeUp, staggerContainer, scaleIn, wordReveal } from '../lib/motion';

/* ── AnimatedCounter ───────────────────────────── */
function AnimatedCounter({ from = 0, to, duration = 1.5, suffix = '', prefix = '' }: { from?: number; to: number; duration?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(from);
  const count = useMotionValue(from);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, { duration, ease: 'easeOut' });
      return controls.stop;
    }
  }, [inView, count, to, duration]);

  useEffect(() => {
    return count.on('change', (latest) => setDisplayValue(Math.round(latest)));
  }, [count]);

  return <span ref={ref}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

/* ── CareerOrbit ────────────────────────────────── */
const CareerOrbit = memo(() => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.8 }}
      className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] mx-auto md:ml-auto md:mr-0 flex items-center justify-center pointer-events-none">
      <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-bg border border-white/[0.08] flex items-center justify-center shadow-xl">
        <svg viewBox="0 0 100 100" className="w-12 h-12 md:w-16 md:h-16" fill="none"><circle cx="50" cy="40" r="15" fill="#D7C5B2" /><path d="M30 90 C30 65, 70 65, 70 90" fill="#9F8D8B" /><rect x="40" y="60" width="20" height="15" fill="#D5F4F9" rx="2" /></svg>
      </div>
      <div className="absolute inset-0 border border-white/[0.05] rounded-full" style={prefersReducedMotion ? undefined : { animation: 'orbit 18s linear infinite' }}>
        {[{ label: 'AI Engineer', angle: 0 }, { label: 'Doctor', angle: 60 }, { label: 'Designer', angle: 120 }, { label: 'Lawyer', angle: 180 }, { label: 'Data Scientist', angle: 240 }, { label: 'Architect', angle: 300 }].map(c => <OrbitChip key={c.label} {...c} />)}
      </div>
      <div className="absolute inset-[-40px] md:inset-[-60px] border border-white/[0.03] rounded-full hidden sm:block" style={prefersReducedMotion ? undefined : { animation: 'orbit-reverse 28s linear infinite' }}>
        {[{ label: 'Pilot', angle: 0 }, { label: 'IAS Officer', angle: 90 }, { label: 'Cybersecurity', angle: 180 }, { label: 'UX Designer', angle: 270 }].map(c => <OrbitChip key={c.label} {...c} reverse />)}
      </div>
    </motion.div>
  );
});

function OrbitChip({ label, angle, reverse }: { label: string; angle: number; reverse?: boolean }) {
  return (
    <div className="absolute top-1/2 left-1/2 pointer-events-auto"
      style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-50%) translateY(${reverse ? '-190px' : '-150px'})` }}>
      <div className={reverse ? 'chip-counter-rotate-reverse' : 'chip-counter-rotate'} style={{ animationDelay: `-${angle / 360 * (reverse ? 28 : 18)}s` }}>
        <div className="px-3 py-1.5 rounded-[20px] bg-accent/10 border border-accent/25 backdrop-blur-md whitespace-nowrap">
          <span className="text-[0.7rem] font-medium text-accent">{label}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Landing Page ──────────────────────────────── */
export function Landing() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Journey', href: '#journey' },
    { label: 'Careers', href: '#careers' },
    { label: 'AI', href: '#ai' },
  ];

  /* ── Hero word-reveal ─────────── */
  const heroTitle = ['DISCOVER', 'YOUR', 'FUTURE'];
  const ctaTitle = ['YOUR', 'CAREER', 'STARTS', 'HERE'];

  /* ── Stat data ────────────────── */
  const stats = [
    { value: 150, suffix: '+', label: 'Career Paths' },
    { value: 5000, suffix: '+', label: 'Assessment Qs' },
    { value: 35, suffix: '+', label: 'ML Features' },
    { value: 24, suffix: '/7', label: 'AI Counselor' },
  ];

  /* ── Journey data ────────────── */
  const journeySteps = [
    { id: '1', title: 'Create Profile', desc: 'Tell us about your background and current class.', icon: User },
    { id: '2', title: 'Take Assessment', desc: 'A quick 20-question test on your interests and skills.', icon: ClipboardList },
    { id: '3', title: 'AI Analysis', desc: 'Our ML models map your profile to 150+ career paths.', icon: Brain },
    { id: '4', title: 'Get Recommendations', desc: 'Receive your top career matches with confidence scores.', icon: Sparkles },
    { id: '5', title: 'Explore Roadmap', desc: 'See the exact steps, exams, and skills needed.', icon: Map },
    { id: '6', title: 'Talk to AI Counselor', desc: 'Ask questions and refine your choices with our AI.', icon: MessageSquare },
  ];

  /* ── Career data ─────────────── */
  const careers = [
    { title: 'Software Engineer', salary: '₹8L–₹40L', demand: 'Very High', growth: '↑ 22%/yr', color: '#B583F0' },
    { title: 'Doctor (MBBS)', salary: '₹6L–₹25L', demand: 'High', growth: '↑ 15%/yr', color: '#4FE0B0' },
    { title: 'Data Scientist', salary: '₹10L–₹35L', demand: 'Very High', growth: '↑ 28%/yr', color: '#B583F0' },
    { title: 'Architect', salary: '₹5L–₹20L', demand: 'Moderate', growth: '↑ 10%/yr', color: '#4FE0B0' },
    { title: 'UX Designer', salary: '₹6L–₹22L', demand: 'High', growth: '↑ 18%/yr', color: '#B583F0' },
    { title: 'IAS Officer', salary: '₹7L–₹18L', demand: 'Stable', growth: '→ Prestige', color: '#4FE0B0' },
    { title: 'Pilot (Commercial)', salary: '₹15L–₹80L', demand: 'Growing', growth: '↑ 12%/yr', color: '#B583F0' },
    { title: 'Cybersecurity Analyst', salary: '₹8L–₹30L', demand: 'Critical', growth: '↑ 32%/yr', color: '#4FE0B0' },
  ];

  /* ── Assessment preview state ─── */
  const [assessmentSelected, setAssessmentSelected] = useState<number | null>(null);

  /* ── AI chat preview state ───── */
  const chatRef = useRef<HTMLDivElement>(null);
  const chatInView = useInView(chatRef, { once: true, amount: 0.5 });
  const [chatStep, setChatStep] = useState(0);
  const [typedText, setTypedText] = useState('');
  const aiResponse = "Based on your interests, Software Engineering and Data Science are excellent matches for you. Both fields reward analytical thinking and problem solving.";

  useEffect(() => {
    if (!chatInView) return;
    const t1 = setTimeout(() => setChatStep(1), 400);
    const t2 = setTimeout(() => setChatStep(2), 1200);
    const t3 = setTimeout(() => {
      setChatStep(3);
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(aiResponse.slice(0, i + 1));
        i++;
        if (i === aiResponse.length) clearInterval(interval);
      }, 30);
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [chatInView]);

  /* ── Journey scroll timeline ──── */
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ['start center', 'end center'] });
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const index = Math.floor(latest * journeySteps.length);
    setActiveIndex(Math.min(index, journeySteps.length - 1));
  });

  /* ── Recommendation bar ───────── */
  const barRef = useRef<HTMLDivElement>(null);
  const barInView = useInView(barRef, { once: true, amount: 0.5 });

  /* ── Features data ───────────── */
  const features = [
    { icon: Brain, title: 'ML-Powered Assessment', desc: 'Random Forest + XGBoost ensemble trained on real career patterns.' },
    { icon: Sparkles, title: 'AI Career Counselor', desc: '24/7 Groq-powered LLM counselor that speaks like a real mentor.' },
    { icon: Map, title: 'Personalized Roadmaps', desc: 'Step-by-step paths from where you are to where you want to be.' },
    { icon: FileText, title: 'Career Reports', desc: 'Downloadable PDF reports to share with parents and teachers.' },
    { icon: BarChart2, title: 'Smart Analytics', desc: 'SHAP-explained recommendations — understand the "why" behind your match.' },
    { icon: GraduationCap, title: 'College & Scholarship Match', desc: 'Discover institutions and funding aligned to your chosen path.' },
  ];

  /* ── Stories ──────────────────── */
  const stories = [
    { avatar: '👩🏽‍💻', name: 'Priya S.', location: 'Mumbai', stream: 'PCM', recommendation: 'Software Engineer', quote: 'SCPR showed me exactly why engineering suits my thinking style.' },
    { avatar: '👨🏻‍⚕️', name: 'Rahul M.', location: 'Delhi', stream: 'PCB', recommendation: 'Medical Research', quote: 'The roadmap section gave me a clear plan I could show my parents.' },
    { avatar: '👩🏾‍🎨', name: 'Ananya K.', location: 'Bengaluru', stream: 'Arts', recommendation: 'UX Designer', quote: 'I never knew UX Design existed until SCPR recommended it.' },
    { avatar: '👨🏼‍💼', name: 'Arjun T.', location: 'Pune', stream: 'Commerce', recommendation: 'Data Analyst', quote: 'The AI counselor helped me convince my family about my career choice.' },
  ];

  /* ── About cards ──────────────── */
  const aboutCards = [
    { icon: Target, title: 'Precision Matching', desc: 'Advanced ML (Random Forest & XGBoost) matches your personality, skills, and interests to the perfect career path.' },
    { icon: Users, title: 'Expert Guidance', desc: 'Our AI Counselor, powered by cutting-edge LLM, provides personalized and empathetic advice like a human expert.' },
    { icon: Zap, title: 'Future-Ready', desc: 'We constantly analyze industry trends and demand metrics to ensure you prepare for careers that thrive.' },
  ];

  return (
    <div className="min-h-screen bg-bg text-white overflow-hidden">
      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-bg/85 backdrop-blur-[16px] border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <a href="/" className="font-anton text-[1.4rem] text-accent tracking-[0.02em] focus-ring rounded">SCPR</a>
            <nav className="hidden md:flex space-x-8">
              {navLinks.map(link => (
                <a key={link.label} href={link.href} className="font-jakarta font-medium text-text-muted hover:text-white transition-colors focus-ring rounded">{link.label}</a>
              ))}
            </nav>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
              <Button onClick={() => navigate('/register')}>Get Started</Button>
            </div>
            <button className="md:hidden text-accent p-2 focus-ring rounded" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={24} /></button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] md:hidden" onClick={() => setMobileMenuOpen(false)} />
            <motion.div id="mobile-menu" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              className="fixed right-0 top-0 bottom-0 w-64 bg-bg z-[70] shadow-2xl flex flex-col p-6 md:hidden">
              <div className="flex justify-end mb-8"><button className="text-text-muted hover:text-white focus-ring rounded p-2" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={24} /></button></div>
              <nav className="flex flex-col space-y-6 flex-1">
                {navLinks.map(link => (
                  <a key={link.label} href={link.href} className="font-jakarta font-medium text-lg text-text-muted hover:text-white" onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
                ))}
              </nav>
              <div className="flex flex-col space-y-4 mt-auto">
                <Button variant="ghost" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="w-full text-center">Login</Button>
                <Button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} className="w-full text-center">Get Started</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-bg">
        <AmbientOrbs />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col lg:flex-row items-center">
          <div className="flex-1 text-center lg:text-left pt-12 lg:pt-0 pb-16 lg:pb-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="inline-block px-3 py-1 mb-6 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-md">
              <span className="text-[0.7rem] sm:text-xs font-semibold tracking-wider text-accent uppercase">AI-Powered Career Guidance</span>
            </motion.div>
            <h1 className="font-anton text-[clamp(3rem,12vw,10rem)] leading-[0.9] tracking-[0.02em] text-text mb-6 flex flex-wrap justify-center lg:justify-start gap-[0.2em]">
              {heroTitle.map((word, i) => (
                <span key={i} className="overflow-hidden inline-block pb-2">
                  <motion.span variants={wordReveal} initial="hidden" animate="visible" transition={{ delay: 0.45 + i * 0.15 }} className="inline-block">{word}</motion.span>
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
              className="text-[clamp(0.9rem,2.5vw,1.1rem)] text-text-muted mb-10 max-w-xl mx-auto lg:mx-0">
              Built specifically for Class 10 & 12 students in India.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 text-lg">
                Start Assessment <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="#careers" className="w-full sm:w-auto font-jakarta font-semibold text-white bg-white/5 border border-white/10 px-8 py-4 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-lg focus-ring">
                Explore Careers <Eye className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
          <div className="flex-1 w-full mt-8 lg:mt-0"><CareerOrbit /></div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="w-full bg-white/[0.03] border-y border-white/[0.06] py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/[0.06]">
            {stats.map((stat, idx) => (
              <div key={idx} className={`flex flex-col items-center justify-center ${idx > 0 ? 'pl-8 md:pl-0' : ''} ${idx % 2 === 0 ? 'md:border-none' : ''} ${idx >= 2 ? 'md:border-l' : ''}`}>
                <div className="font-anton text-3xl sm:text-4xl text-accent tracking-wider mb-2">
                  <AnimatedCounter to={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-text-muted text-sm text-center">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── JOURNEY ── */}
      <section id="journey" className="py-24 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionReveal className="text-center mb-16">
          <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em]">THE JOURNEY</h2>
        </SectionReveal>
        <div ref={timelineRef} className="relative">
          <div className="absolute left-[28px] lg:left-1/2 top-0 bottom-0 w-[2px] bg-white/5 -translate-x-1/2 rounded-full overflow-hidden">
            <motion.div className="w-full bg-accent origin-top" style={{ scaleY: scrollYProgress }} />
          </div>
          <div className="flex flex-col gap-12 lg:gap-24">
            {journeySteps.map((step, index) => {
              const isActive = index <= activeIndex;
              return (
                <div key={step.id} className="relative flex justify-start lg:justify-center w-full">
                  <div className={`absolute left-[28px] lg:left-1/2 top-6 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-bg z-20 flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-accent' : 'bg-bg'}`}>
                    {isActive && <motion.div layoutId="pulse" className="absolute inset-0 bg-accent rounded-full opacity-50" animate={prefersReducedMotion ? {} : { scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />}
                  </div>
                  <div className={`w-full pl-16 lg:pl-0 flex ${index % 2 === 0 ? 'lg:justify-end lg:pr-12' : 'lg:justify-start lg:pl-12'}`}>
                    <motion.div variants={fadeUp} className="relative z-10 w-full lg:w-1/2">
                      <GlassCard className={`transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(213,244,249,0.08)] group relative overflow-hidden ${isActive ? 'bg-gradient-to-r from-accent/5 to-transparent' : ''}`}>
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                            <step.icon size={24} className="text-accent group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <div>
                            <div className="font-anton text-accent text-lg tracking-wider mb-1 opacity-80">STEP {step.id}</div>
                            <h3 className="font-semibold text-white text-xl mb-2">{step.title}</h3>
                            <p className="text-text-muted text-sm leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CAREER UNIVERSE ── */}
      <section id="careers" className="py-24 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionReveal className="text-center mb-16">
          <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em] mb-4">CAREER UNIVERSE</h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">150+ career paths analyzed, matched, and explained.</p>
        </SectionReveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {careers.map((career, index) => (
            <div key={index} className={index % 2 === 1 ? 'lg:mt-12' : ''}>
              <CareerCardInline {...career} />
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── ASSESSMENT PREVIEW ── */}
      <section className="py-24 relative z-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <SectionReveal className="text-center mb-16">
          <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em] mb-4">TRY THE ASSESSMENT</h2>
          <p className="text-text-muted text-lg">One question. Zero commitment. See how it works.</p>
        </SectionReveal>
        <SectionReveal delay={0.2}>
          <GlassCard className="p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent glass-orb rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="text-accent text-sm font-semibold tracking-wider uppercase mb-6">Question 1 of 20</div>
              <h3 className="font-medium text-white text-2xl sm:text-3xl mb-10 leading-tight">Which activity interests you most?</h3>
              <div className="space-y-4 mb-8">
                {["Building software or apps", "Helping and teaching others", "Scientific research and experiments", "Designing visuals and experiences"].map((option, idx) => {
                  const isSel = assessmentSelected === idx;
                  return (
                    <button key={idx} onClick={() => setAssessmentSelected(idx)}
                      className={`w-full text-left px-6 py-4 rounded-xl border transition-all duration-300 flex items-center gap-4 focus-ring ${isSel ? 'border-accent bg-accent/10 text-white' : 'border-white/10 bg-white/5 text-text-muted hover:bg-white/10'}`}
                      aria-pressed={isSel}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSel ? 'border-accent' : 'border-white/30'}`}>
                        {isSel && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                      </div>
                      <span className="text-lg">{option}</span>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {assessmentSelected !== null && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-end">
                    <Button onClick={() => navigate('/register')} className="px-8 py-3.5">
                      Continue Assessment <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </SectionReveal>
      </section>

      {/* ── AI CHAT PREVIEW ── */}
      <section id="ai" className="py-24 relative z-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <SectionReveal className="text-center mb-16">
          <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em]">MEET YOUR AI COUNSELOR</h2>
        </SectionReveal>
        <div ref={chatRef} className="max-w-2xl mx-auto">
          <GlassCard className="p-6 sm:p-8 min-h-[300px] flex flex-col justify-end gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: chatStep >= 1 ? 1 : 0, y: chatStep >= 1 ? 0 : 10 }}
              className="self-end max-w-[80%] bg-white/10 border border-white/10 rounded-2xl rounded-tr-sm px-5 py-3">
              <p className="text-white">I love math and coding. What career suits me?</p>
            </motion.div>
            <div className="self-start max-w-[90%] sm:max-w-[80%] flex flex-col gap-1">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: chatStep >= 2 ? 1 : 0 }} className="text-xs text-accent font-medium uppercase ml-2">SCPR AI</motion.span>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: chatStep >= 2 ? 1 : 0, y: chatStep >= 2 ? 0 : 10 }}
                className="bg-accent/10 border border-accent/20 rounded-2xl rounded-tl-sm px-5 py-4 min-h-[60px]">
                {chatStep === 2 && (
                  <div className="flex items-center gap-1.5 h-6">
                    {[0, 0.2, 0.4].map(d => (
                      <motion.div key={d} className="w-2 h-2 rounded-full bg-accent/60" animate={prefersReducedMotion ? {} : { y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }} />
                    ))}
                  </div>
                )}
                {chatStep === 3 && <p className="text-white leading-relaxed">{typedText}<span className="inline-block w-1.5 h-4 ml-1 bg-accent animate-pulse" /></p>}
              </motion.div>
            </div>
          </GlassCard>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="flex flex-wrap justify-center gap-3">
            {["Best careers after 12th PCM", "AI vs Cybersecurity — which to choose?", "What if I scored low in science?"].map((chip, idx) => (
              <button key={idx} onClick={() => navigate('/register')} className="px-4 py-2 rounded-[20px] glass-card text-[0.8rem] text-text-muted hover:text-white transition-colors focus-ring">
                {chip}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── RECOMMENDATION PREVIEW ── */}
      <section className="py-24 relative z-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <SectionReveal className="text-center mb-16">
          <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em] leading-none">YOUR<br />MATCH</h2>
        </SectionReveal>
        <SectionReveal delay={0.2}>
          <GlassCard className="p-8 sm:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent glass-orb rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="text-accent text-sm font-semibold tracking-wider uppercase mb-8">#1 Match</div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                <h3 className="font-anton text-4xl sm:text-5xl text-white tracking-wide">SOFTWARE ENGINEER</h3>
                <div className="font-anton text-4xl sm:text-5xl text-cta"><AnimatedCounter to={93} suffix="%" duration={1.5} /></div>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-12" ref={barRef}>
                <motion.div className="h-full bg-cta" initial={{ width: '0%' }} animate={barInView ? { width: '93%' } : { width: '0%' }} transition={{ duration: 1.4, ease: 'easeOut' }} />
              </div>
              <div className="mb-12">
                <div className="text-text-muted text-sm mb-4">Why you're a match:</div>
                <div className="flex flex-wrap gap-2">
                  {["Analytical Thinking", "Coding Interest", "Problem Solving", "Logical Reasoning"].map((reason, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white">{reason}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => navigate('/register')} className="inline-flex font-semibold text-cta hover:text-white transition-colors focus-ring rounded">
                Explore this career <ArrowRight className="h-4 w-4 ml-2" />
              </button>
              <div className="mt-12 pt-8 border-t border-white/10 space-y-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
                {[{ rank: 2, name: 'Data Scientist', score: '88%' }, { rank: 3, name: 'AI/ML Engineer', score: '84%' }].map(r => (
                  <div key={r.rank} className="flex justify-between items-center">
                    <span className="text-white"><span className="text-text-muted mr-4">#{r.rank}</span> {r.name}</span>
                    <span className="text-white font-medium">{r.score}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center sm:text-left">
                <button onClick={() => navigate('/register')} className="text-sm text-text-muted hover:text-white transition-colors focus-ring rounded underline underline-offset-4">
                  See Your Full Report <ArrowRight className="h-3 w-3 inline ml-1" />
                </button>
              </div>
            </div>
          </GlassCard>
        </SectionReveal>
      </section>

      {/* ── WHY SCPR ── */}
      <section className="py-24 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionReveal className="text-center mb-16">
          <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em]">WHY SCPR</h2>
        </SectionReveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <motion.div key={idx} variants={fadeUp} className="w-full h-full">
              <GlassCard className="h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(213,244,249,0.08)] flex flex-col items-start group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                  <f.icon size={24} className="text-accent group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-3">{f.title}</h3>
                <p className="text-text-muted text-[0.9rem] leading-relaxed">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── STUDENT STORIES ── */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <SectionReveal className="text-center mb-16">
            <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em] mb-4">STUDENT STORIES</h2>
            <p className="text-text-muted text-lg">Early access testers from across India.</p>
          </SectionReveal>
        </div>
        <div className="relative w-full max-w-[100vw] overflow-hidden group">
          <div className="flex md:w-max overflow-x-auto snap-x snap-mandatory hide-scrollbar md:animate-scroll md:hover:[animation-play-state:paused] gap-6 px-4 md:px-0">
            <div className="flex gap-6 shrink-0 pr-6 md:pr-0">
              {stories.map((s, idx) => (
                <StoryCard key={`a-${idx}`} {...s} />
              ))}
            </div>
            <div className="hidden md:flex gap-6 shrink-0">
              {stories.map((s, idx) => (
                <StoryCard key={`b-${idx}`} {...s} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-24 relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-accent/20 glass-orb rounded-full -z-10" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-cta/10 glass-orb rounded-full -z-10" />
        <SectionReveal className="text-center mb-16">
          <h2 className="font-anton text-[clamp(2rem,6vw,5rem)] text-white tracking-[0.02em] mb-6">ABOUT <span className="text-accent">SCPR</span></h2>
          <p className="text-text-muted text-lg max-w-3xl mx-auto leading-relaxed">
            SCPR is a next-generation AI-driven career guidance platform designed to bridge the gap between student potential and industry demands.
          </p>
        </SectionReveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {aboutCards.map((card, idx) => (
            <motion.div key={idx} variants={scaleIn} className="w-full h-full">
              <GlassCard className="h-full p-8 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors duration-300">
                  <card.icon className="text-accent w-8 h-8" />
                </div>
                <h3 className="font-semibold text-xl text-white mb-4">{card.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{card.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center py-32 overflow-hidden bg-cta">
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto w-full">
          <h2 className="font-anton text-[clamp(3.5rem,14vw,11rem)] uppercase text-cta-text leading-[0.9] tracking-[0.02em] flex flex-col items-center justify-center mb-10">
            {ctaTitle.map((word, idx) => (
              <span key={idx} className="overflow-hidden block pb-2">
                <motion.span variants={wordReveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} transition={{ delay: idx * 0.1 }} className="block">{word}</motion.span>
              </span>
            ))}
          </h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.6 }}
            className="text-cta-text/75 text-lg sm:text-xl font-medium mb-12">
            No payment required. AI-powered guidance in minutes.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.6 }}>
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center font-bold text-cta bg-cta-text rounded-xl min-h-[56px] px-9 text-xl hover:scale-103 hover:shadow-[0_0_30px_rgba(240,168,62,0.3)] hover:brightness-110 transition-all duration-300 focus-ring">
              Begin Your Journey <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative bg-[#0A0F0D] pt-16 pb-6 px-4 sm:px-6 lg:px-8 border-t border-accent-2/15">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-2/30 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 md:gap-8 mb-12">
            <div className="flex flex-col gap-5">
              <div className="font-anton text-[1.6rem] text-accent tracking-wider">SCPR</div>
              <p className="text-text-muted text-sm leading-relaxed max-w-[280px]">AI-powered career guidance for Indian students — no payment required.</p>
              <button onClick={() => navigate('/register')} className="w-fit inline-flex items-center gap-2 bg-cta text-cta-text font-semibold text-sm px-5 py-2.5 rounded-full hover:brightness-110 transition-all duration-150 focus-ring mt-1">
                Begin Your Journey <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>
            <div>
              <h4 className="font-semibold text-[#8A9A94] mb-4 uppercase tracking-[0.15em] text-xs">Product</h4>
              <ul className="space-y-2.5">
                {[{ label: 'About', href: '#about' }, { label: 'Journey', href: '#journey' }, { label: 'Careers', href: '#careers' }, { label: 'Assessment', href: '#assessment' }, { label: 'AI Counselor', href: '#ai' }].map(link => (
                  <li key={link.label}><a href={link.href} className="text-sm text-text-muted hover:text-cta transition-colors duration-150 focus-ring rounded">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#8A9A94] mb-4 uppercase tracking-[0.15em] text-xs">Legal</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigate('/register')} className="text-sm text-text-muted hover:text-cta transition-colors duration-150 focus-ring rounded">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/register')} className="text-sm text-text-muted hover:text-cta transition-colors duration-150 focus-ring rounded">Terms of Service</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#8A9A94] mb-4 uppercase tracking-[0.15em] text-xs">Connect</h4>
              <ul className="space-y-3">
                <li><a href="mailto:scpr@example.com" className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-white/[0.08] text-text-muted text-sm hover:border-cta/40 hover:text-cta transition-all duration-150 focus-ring w-fit"><Mail size={14} /> scpr@example.com</a></li>
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-white/[0.08] text-text-muted text-sm hover:border-cta/40 hover:text-cta transition-all duration-150 focus-ring w-fit"><GithubIcon /> GitHub</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-white/[0.08] text-text-muted text-sm hover:border-cta/40 hover:text-cta transition-all duration-150 focus-ring w-fit"><LinkedinIcon /> LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#8A9A94] text-xs text-center sm:text-left">&copy; 2026 SCPR. Built for Indian students.</p>
            <div className="flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-[#8A9A94] hover:border-cta/40 hover:text-cta transition-all duration-150 focus-ring" aria-label="GitHub"><GithubIcon /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-[#8A9A94] hover:border-cta/40 hover:text-cta transition-all duration-150 focus-ring" aria-label="LinkedIn"><LinkedinIcon /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Supporting sub-components (inlined in the same file) ── */

function CareerCardInline({ title, salary, demand, growth, color }: { title: string; salary: string; demand: string; growth: string; color: string }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const animParams = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) % 1000;
    const frac = hash / 1000;
    return { duration: 5 + frac * 3, delay: (hash % 200) / 100 };
  }, [title]);

  return (
    <motion.div variants={scaleIn} className="w-full"
      animate={prefersReducedMotion ? {} : { translateY: [0, -12, 0], rotateZ: [0, 1, -1, 0] }}
      transition={{ translateY: { duration: animParams.duration, repeat: Infinity, ease: 'easeInOut', delay: animParams.delay }, rotateZ: { duration: animParams.duration * 1.5, repeat: Infinity, ease: 'easeInOut', delay: animParams.delay } }}>
      <GlassCard className="h-full p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(213,244,249,0.1)] cursor-pointer sm:cursor-default" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-col h-full">
          <h3 className="font-anton text-[1.3rem] tracking-wide mb-4" style={{ color }}>{title}</h3>
          <div className="space-y-3 mb-6 flex-1">
            {[{ label: 'Avg. Salary', value: salary, accent: false }, { label: 'Demand', value: demand, accent: false }, { label: 'Growth', value: growth, accent: true }].map(row => (
              <div key={row.label} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-b-0">
                <span className="text-text-muted text-sm">{row.label}</span>
                <span className={`font-medium text-sm ${row.accent ? 'text-accent' : 'text-white'}`}>{row.value}</span>
              </div>
            ))}
          </div>
          <div className={`sm:hidden overflow-hidden transition-all duration-300 ${expanded ? 'max-h-24 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
            <p className="text-xs text-text-muted">Discover the skills, roadmap, and top colleges for this career path.</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); navigate('/register'); }} className="font-semibold text-cta text-sm flex items-center hover:brightness-125 transition-all mt-auto w-fit focus-ring rounded">
            Explore <ArrowRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function StoryCard({ avatar, name, location, stream, recommendation, quote }: { avatar: string; name: string; location: string; stream: string; recommendation: string; quote: string }) {
  return (
    <div className="w-[85vw] sm:w-[400px] shrink-0 snap-start">
      <GlassCard className="h-full flex flex-col p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-[1.8rem] shrink-0">{avatar}</div>
          <div>
            <h4 className="font-semibold text-white text-lg leading-tight">{name}</h4>
            <p className="text-text-muted text-sm">{location}</p>
          </div>
          <div className="ml-auto"><span className="px-3 py-1 bg-accent/10 text-accent text-[0.7rem] rounded-full uppercase tracking-wider font-semibold">{stream}</span></div>
        </div>
        <blockquote className="flex-1 mb-8"><p className="text-text-muted text-lg italic leading-relaxed">&ldquo;{quote}&rdquo;</p></blockquote>
        <div className="pt-4 border-t border-white/10 mt-auto">
          <p className="text-sm text-text-muted">Recommended: <span className="text-cta font-medium ml-1">{recommendation}</span></p>
        </div>
      </GlassCard>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
    </svg>
  );
}
