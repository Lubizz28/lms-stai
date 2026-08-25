import React, { useState } from 'react';
import { LogIn, AlertCircle, Key, UserCheck, Info, User, Lock } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { REGISTERED_USERS } from '../services/authService';
import { CaptchaSecurity } from '../components/auth/CaptchaSecurity';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'accounts'>('form');

  // CAPTCHA State
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCaptchaError(null);

    if (!identifier.trim()) {
      setErrorMessage('NIM / NIDN / NIP atau Email wajib diisi.');
      return;
    }
    if (!kataSandi.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }
    if (!isCaptchaVerified) {
      setCaptchaError('Silakan selesaikan verifikasi keamanan (CAPTCHA) terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier, kataSandi);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali data Anda.');
      // Auto-reset CAPTCHA on login failure to prevent brute force
      setIsCaptchaVerified(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAccount = (user: typeof REGISTERED_USERS[0]) => {
    setIdentifier(user.username);
    setKataSandi('salam123');
    setActiveTab('form');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-3 sm:p-6"
      style={{ 
        background: 'radial-gradient(ellipse at top, #ecfdf5 0%, #f8fafc 60%, #f1f5f9 100%)' 
      }}
    >
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        {/* Brand Header */}
        <div className="text-center">
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white inline-flex items-center justify-center shadow-lg border border-emerald-100 p-2 mb-3 transform hover:scale-105 transition-transform"
          >
            <img 
              src="/logo.png" 
              alt="Logo STAI AL-ITTIHAD" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 
            style={{ 
              fontSize: 'var(--text-2xl)', 
              fontWeight: 800, 
              color: '#065f46', 
              letterSpacing: '-0.5px',
              margin: '0 0 4px 0' 
            }}
          >
            SALAM LMS
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Sistem Aplikasi Layanan Akademik & Mahasiswa<br />
            <strong style={{ color: '#047857' }}>STAI AL-ITTIHAD CIANJUR</strong>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div 
          className="flex rounded-xl p-1 bg-slate-200/60 border border-slate-200"
        >
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'form' 
                ? 'bg-white shadow-sm text-emerald-800' 
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <LogIn size={14} /> Form Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'accounts' 
                ? 'bg-white shadow-sm text-emerald-800' 
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <UserCheck size={14} /> Panduan Akun Akses
          </button>
        </div>

        {/* Login Card with Premium Elevation */}
        <Card style={{ boxShadow: '0 10px 25px -5px rgba(6, 95, 70, 0.08), 0 8px 10px -6px rgba(6, 95, 70, 0.05)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <CardBody style={{ padding: 'var(--space-6)' }}>
            {activeTab === 'form' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                  <div>
                    <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      Masuk ke Akun Anda
                    </h2>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Gunakan identitas akademik resmi
                    </span>
                  </div>
                  <Badge variant="primary" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    Tahun 2026/2027
                  </Badge>
                </div>

                {errorMessage && (
                  <div 
                    className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-shake"
                  >
                    <AlertCircle size={16} className="flex-shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="relative">
                  <Input
                    label="NIM / NIDN / Username / Email"
                    placeholder="Contoh: 21010042 atau 2112087501"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                  />
                  <div className="absolute right-3 top-[34px] text-slate-400 pointer-events-none">
                    <User size={16} />
                  </div>
                </div>

                <div className="relative">
                  <Input
                    label="Kata Sandi"
                    type="password"
                    placeholder="Masukkan kata sandi akun Anda"
                    value={kataSandi}
                    onChange={(e) => setKataSandi(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <div className="absolute right-3 top-[34px] text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                </div>

                {/* Modern Interactive CAPTCHA Component */}
                <CaptchaSecurity
                  onVerify={(isValid) => {
                    setIsCaptchaVerified(isValid);
                    if (isValid) setCaptchaError(null);
                  }}
                  isVerified={isCaptchaVerified}
                  error={captchaError}
                />

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Key size={12} className="text-emerald-600" /> Sandi demo: <strong>salam123</strong>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('accounts')}
                    className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                  >
                    Lihat Info Akun
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={LogIn}
                  isLoading={isSubmitting}
                  className="w-full shadow-md hover:shadow-lg transition-all"
                  style={{
                    backgroundColor: isCaptchaVerified ? '#059669' : undefined,
                    marginTop: 'var(--space-1)',
                    padding: '12px'
                  }}
                >
                  {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Portal SALAM'}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 style={{ fontSize: 'var(--text-base)', margin: 0, fontWeight: 'bold', color: '#0f172a' }}>
                      Panduan Akun Terdaftar
                    </h2>
                    <span className="text-[11px] text-slate-500">Pilih salah satu peran untuk simulasi</span>
                  </div>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">Sandi: <strong>salam123</strong></span>
                </div>

                <div 
                  className="flex items-center gap-2 p-2.5 rounded-lg" 
                  style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '11px', color: '#065f46' }}
                >
                  <Info size={14} className="flex-shrink-0 text-emerald-600" />
                  <span>Klik <strong>"Pilih Akun Ini"</strong> untuk mengisi NIM/Username ke formulir login.</span>
                </div>

                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {REGISTERED_USERS.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-all shadow-2xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                          <div className="text-slate-600 text-xs font-mono">Username/NIM: <strong className="text-emerald-700">{u.username}</strong></div>
                          <div className="text-slate-500 text-[11px]">{u.studyProgram}</div>
                        </div>
                        <Badge variant={u.role === 'mahasiswa' ? 'primary' : u.role === 'dosen' ? 'success' : 'warning'}>
                          {u.roleLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSelectAccount(u)}
                          className="w-full"
                          style={{ fontSize: '11px', padding: '5px 8px' }}
                        >
                          Pilih Akun Ini
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Footer Notice */}
        <p className="text-center text-xs text-slate-500">
          © 2026 STAI AL-ITTIHAD CIANJUR. Terintegrasi SIAKAD & Kemendikbudristek.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

