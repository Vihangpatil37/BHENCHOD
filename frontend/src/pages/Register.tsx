import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { client } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

export const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await client.post('/auth/register', { email, password, full_name: fullName });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard elevation={3} className="p-8 md:p-10 border border-solid rounded-[24px]">
          <div className="font-anton text-brand text-2xl tracking-wider mb-6 select-none">SCPR</div>
          <h2 className="font-semibold text-xl text-text-primary mb-1">Create Account</h2>
          <p className="text-text-secondary text-sm mb-8">Sign up to begin your journey</p>

          {error && (
            <div className="p-4 mb-6 text-sm text-error bg-error/10 border border-solid border-error/20 rounded-[18px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                placeholder="Alex Johnson"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180"
                placeholder="•••••••• (min 6 characters)"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full py-4 text-base mt-2">
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Sign in here
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </AuthLayout>
  );
};
