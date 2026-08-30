import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { client } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

export const RecoverAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await client.post('/auth/recover-account', { email, recovery_code: recoveryCode, new_password: newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Invalid recovery code or email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard elevation={3} className="p-8 md:p-10 border border-solid rounded-[24px]">
          <div className="font-anton text-brand text-2xl tracking-wider mb-6 select-none">SCPR</div>
          <h2 className="font-semibold text-xl text-text-primary mb-1">Recover Account</h2>
          
          {success ? (
            <>
              <p className="text-text-secondary text-sm mb-8">
                Your password has been reset successfully.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full py-4 text-base mt-2">
                Back to Login
              </Button>
            </>
          ) : (
            <>
              <p className="text-text-secondary text-sm mb-8">
                Enter your email, a backup recovery code, and your new password.
              </p>

              {error && (
                <div className="p-4 mb-6 text-sm text-error bg-error/10 border border-solid border-error/20 rounded-[18px]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Backup Recovery Code</label>
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 font-mono tracking-wider"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-black/80 flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <Button type="submit" loading={loading} className="w-full py-4 text-base mt-2">
                  Reset Password
                </Button>
                
                <div className="mt-8 text-center text-sm text-text-secondary">
                  <Link to="/login" className="font-semibold text-brand hover:underline">
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          )}
        </GlassCard>
      </motion.div>
    </AuthLayout>
  );
};
