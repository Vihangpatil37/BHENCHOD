import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { client } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';

export const Setup2FA = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [step, setStep] = useState<'qr' | 'backup_codes'>('qr');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const data: any = await client.post('/auth/2fa/setup');
        setQrCode(data.qr_code);
        setSecret(data.secret);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize 2FA setup');
      }
    };
    fetchQR();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data: any = await client.post('/auth/2fa/verify-setup', { code });
      setRecoveryCodes(data.recovery_codes);
      
      // We will only update auth tokens AFTER they see their backup codes
      // But we can store them in temporary state or just update them directly and prevent redirect 
      // by not navigating yet.
      setStep('backup_codes');
      
      // We still update the store so they are fully authenticated
      setAuth(data.user, data.access_token, data.refresh_token);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  return (
    <AuthLayout>
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard elevation={3} className="p-8 md:p-10 border border-solid rounded-[24px] max-w-lg w-full">
          <div className="font-anton text-brand text-2xl tracking-wider mb-6 select-none">SCPR</div>
          <h2 className="font-semibold text-xl text-text-primary mb-1">
            {step === 'qr' ? 'Setup Two-Factor Authentication' : 'Save Your Backup Codes'}
          </h2>
          
          {error && (
            <div className="p-4 mb-6 text-sm text-error bg-error/10 border border-solid border-error/20 rounded-[18px]">
              {error}
            </div>
          )}

          {step === 'qr' ? (
            <div className="space-y-6">
              <p className="text-text-secondary text-sm">
                Scan the QR code below with your authenticator app (like Google Authenticator or Authy).
              </p>
              
              {qrCode ? (
                <div className="flex justify-center bg-white p-4 rounded-xl">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="flex justify-center p-4">
                  <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {secret && (
                <div className="text-center">
                  <p className="text-xs text-text-secondary mb-1">Or enter this code manually:</p>
                  <code className="bg-white/[0.05] px-3 py-1.5 rounded-lg text-brand font-mono text-sm tracking-wider">
                    {secret}
                  </code>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-5 pt-4 border-t border-white/[0.08]">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Verify Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-solid border-white/[0.08] rounded-[18px] text-text-primary placeholder-white/30 focus:outline-none focus:border-ai-cyan/50 focus:ring-1 focus:ring-ai-cyan/50 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full py-4 text-base mt-2">
                  Verify and Continue
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 text-sm text-[#10B981] bg-[#10B981]/10 border border-solid border-[#10B981]/20 rounded-[18px]">
                2FA has been successfully enabled!
              </div>
              <p className="text-text-secondary text-sm">
                If you ever lose access to your authenticator app, you can use these backup codes to recover your account. 
                <strong className="text-error block mt-2">Store them somewhere safe! They will only be shown once.</strong>
              </p>
              
              <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-6 rounded-[18px] border border-solid border-white/[0.08]">
                {recoveryCodes.map((rc, idx) => (
                  <code key={idx} className="text-text-primary font-mono tracking-wider text-center bg-white/[0.05] py-2 rounded-lg">
                    {rc}
                  </code>
                ))}
              </div>

              <Button onClick={handleFinish} className="w-full py-4 text-base mt-2">
                I have saved my backup codes
              </Button>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </AuthLayout>
  );
};
