import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { client } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await client.post('/auth/reset-password', { token, newPassword: password });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The token may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordReqs = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least 1 lowercase character', met: /[a-z]/.test(password) },
    { label: 'At least 1 uppercase character', met: /[A-Z]/.test(password) },
    { label: 'At least 1 number or special character', met: /[^a-zA-Z]/.test(password) }
  ];

  if (!token && !error) return null;

  return (
    <AuthLayout>
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard elevation={3} className="p-8 md:p-10 border border-solid rounded-[24px]">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary">Password Reset Successful</h3>
              <p className="text-text-secondary">You will be redirected to the login page shortly.</p>
              <div className="pt-4">
                <Link to="/login" className="text-brand hover:underline font-medium">
                  Go to Login now
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="font-anton text-brand text-2xl tracking-wider mb-6 select-none">SCPR</div>
              <h2 className="font-semibold text-xl text-text-primary mb-1">Set New Password</h2>
              <p className="text-text-secondary text-sm mb-8">Enter your new password below</p>

              {error && (
                <div className="p-4 mb-6 text-sm text-error bg-error/10 border border-solid border-error/20 rounded-[18px]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 pl-11 pr-12"
                      placeholder="••••••••"
                    />
                    <Lock className="w-5 h-5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-black/80 transition-colors flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 pl-11 pr-12"
                      placeholder="••••••••"
                    />
                    <Lock className="w-5 h-5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="mt-4 text-sm text-text-secondary space-y-2 bg-white/[0.02] p-4 rounded-xl border border-solid border-white/[0.05]">
                  <p className="font-medium text-text-primary mb-3">New password must contain:</p>
                  {passwordReqs.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-[#10B981]' : 'bg-text-secondary/50'}`} />
                      <span className={req.met ? 'text-text-primary' : 'text-text-secondary'}>{req.label}</span>
                    </div>
                  ))}
                </div>

                <Button type="submit" loading={isLoading} className="w-full py-4 text-base mt-2" disabled={!token}>
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </GlassCard>
      </motion.div>
    </AuthLayout>
  );
};
