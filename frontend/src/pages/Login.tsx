import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleResponse = async (response: any) => {
      setLoading(true);
      setError(null);
      try {
        const data: any = await client.post('/auth/google', { id_token: response.credential });
        
        if (data.requires_2fa_setup) {
          useAuthStore.getState().updateAccessToken(data.setup_token);
          navigate('/setup-2fa');
        } else if (data.requires_2fa) {
          useAuthStore.getState().updateAccessToken(data.two_factor_token);
          setStep('2fa');
        } else {
          setAuth(data.user, data.access_token, data.refresh_token);
          navigate('/');
        }
      } catch (err: any) {
        setError(err.message || 'Google login failed');
      } finally {
        setLoading(false);
      }
    };

    let attempts = 0;
    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-btn'),
          { theme: 'filled_black', size: 'large', shape: 'pill' }
        );
      } else if (attempts < 20) {
        attempts++;
        setTimeout(initGoogle, 100);
      }
    };
    
    if (step === 'credentials') {
      initGoogle();
    }
  }, [step, navigate, setAuth]);

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data: any = await client.post('/auth/login', { email, password });
      
      if (data.requires_2fa_setup) {
        useAuthStore.getState().updateAccessToken(data.setup_token);
        navigate('/setup-2fa');
      } else if (data.requires_2fa) {
        useAuthStore.getState().updateAccessToken(data.two_factor_token);
        setStep('2fa');
      } else {
        setAuth(data.user, data.access_token, data.refresh_token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data: any = await client.post('/auth/2fa/verify', { code });
      setAuth(data.user, data.access_token, data.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard elevation={3} className="p-8 md:p-10 border border-solid rounded-[24px]">
          <div className="font-anton text-brand text-2xl tracking-wider mb-6 select-none">SCPR</div>
          <h2 className="font-semibold text-xl text-text-primary mb-1">
            {step === 'credentials' ? 'Welcome Back' : 'Two-Factor Authentication'}
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            {step === 'credentials' ? 'Sign in to continue your journey' : 'Enter the code from your Authenticator app'}
          </p>

          {error && (
            <div className="p-4 mb-6 text-sm text-error bg-error/10 border border-solid border-error/20 rounded-[18px]">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleSubmitCredentials} className="space-y-5">
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
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Password</label>
                  <Link to="/recover-account" className="text-xs font-medium text-brand hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-black/80 transition-colors flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full py-4 text-base mt-2">
                Sign In
              </Button>
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-white/[0.08]"></div>
                <span className="px-3 text-xs font-semibold text-text-secondary uppercase">OR</span>
                <div className="flex-1 border-t border-white/[0.08]"></div>
              </div>
              <div id="google-btn" className="w-full overflow-hidden rounded-[18px] flex justify-center"></div>
              <div className="mt-8 text-center text-sm text-text-secondary">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-brand hover:underline">
                  Create one for free
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">6-Digit Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 text-center tracking-widest text-2xl font-mono"
                  placeholder="000000"
                />
              </div>
              <Button type="submit" loading={loading} className="w-full py-4 text-base mt-2">
                Verify
              </Button>
              <div className="mt-8 text-center text-sm text-text-secondary">
                <button type="button" onClick={() => setStep('credentials')} className="font-semibold text-brand hover:underline">
                  Back to login
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </AuthLayout>
  );
};
