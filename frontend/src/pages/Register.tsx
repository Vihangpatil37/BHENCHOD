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
        <GlassCard className="p-8 md:p-10">
          <div className="font-anton text-accent text-2xl tracking-wider mb-6">SCPR</div>
          <h2 className="font-semibold text-[1.4rem] text-white mb-1">Create Account</h2>
          <p className="text-text-muted text-[0.9rem] mb-8">Sign up to begin your journey</p>

          {error && (
            <div className="p-4 mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-muted">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-text-muted/50 focus:outline-none focus:border-accent/50 transition-all"
                placeholder="Alex Johnson"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-muted">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-text-muted/50 focus:outline-none focus:border-accent/50 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-text-muted/50 focus:outline-none focus:border-accent/50 transition-all"
                placeholder="•••••••• (min 6 characters)"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full py-4">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cta hover:underline">
              Sign in here
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </AuthLayout>
  );
};
