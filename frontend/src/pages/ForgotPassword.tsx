import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { client } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await client.post('/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard elevation={3} className="p-8 md:p-10 border border-solid rounded-[24px]">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary">Check your email</h3>
              <p className="text-text-secondary">
                We've sent a password reset link to <span className="font-medium text-text-primary">{email}</span>.
              </p>
              <div className="pt-4">
                <Link to="/login" className="text-brand hover:underline font-medium flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="font-anton text-brand text-2xl tracking-wider mb-6 select-none">SCPR</div>
              <h2 className="font-semibold text-xl text-text-primary mb-1">Reset Password</h2>
              <p className="text-text-secondary text-sm mb-8">Enter your email to receive a reset link</p>

              {error && (
                <div className="p-4 mb-6 text-sm text-error bg-error/10 border border-solid border-error/20 rounded-[18px]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 transition-all duration-180 pl-11"
                      placeholder="you@example.com"
                    />
                    <Mail className="w-5 h-5 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                
                <Button type="submit" loading={isLoading} className="w-full py-4 text-base mt-2">
                  Send Reset Link
                </Button>
              </form>
              <div className="mt-8 text-center text-sm text-text-secondary">
                Remembered your password?{' '}
                <Link to="/login" className="font-semibold text-brand hover:underline">
                  Log in
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </motion.div>
    </AuthLayout>
  );
};
