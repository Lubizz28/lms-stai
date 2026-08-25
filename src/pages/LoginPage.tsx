import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  AlertCircle, 
  UserCheck, 
  Info, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Search, 
  Phone, 
  Mail, 
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { REGISTERED_USERS } from '../services/authService';
import { CaptchaSecurity } from '../components/auth/CaptchaSecurity';

const REMEMBER_KEY = 'salam_remember_identifier';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'accounts'>('form');
  const [searchAccount, setSearchAccount] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // CAPTCHA State
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Load remembered identifier if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setIdentifier(saved);
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

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

    // Save or clear remembered identifier
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, identifier.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      // ignore
    }

    setIsSubmitting(true);
    try {
      await login(identifier, kataSandi);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali data kredensial Anda.');
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
    setErrorMessage(null);
  };

  const filteredAccounts = REGISTERED_USERS.filter((u) => 
    u.name.toLowerCase().includes(searchAccount.toLowerCase()) ||
    u.username.toLowerCase().includes(searchAccount.toLowerCase()) ||
    u.roleLabel.toLowerCase().includes(searchAccount.toLowerCase()) ||
    (u.studyProgram || '').toLowerCase().includes(searchAccount.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-3 sm:p-6 md:p-8"
      style={{ 
        background: 'radial-gradient(ellipse at 50% 0%, #ecfdf5 0%, #f8fafc 65%, #e2e8f0 100%)' 
      }}
    >
      {/* Main Container Card */}
      <div 
        className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white grid grid-cols-1 lg:grid-cols-12"
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRAND & INSTITUTIONAL HERO (DESKTOP & TABLET) */}
        {/* ========================================================================= */}
        <div 
          className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden text-white"
          style={{
            background: 'linear-gradient(145deg, #064e3b 0%, #065f46 45%, #047857 100%)'
          }}
        >
          {/* Decorative Subtle Geometry & Glow */}
          <div 
            className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }}
          />
          <div 
            className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }}
          />

          {/* Top Section: Logo & Titles */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border border-emerald-300 flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Logo STAI AL-ITTIHAD" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                  LMS & SIAKAD TERPADU
                </span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">
                  SALAM PORTAL
                </h1>
              </div>
            </div>

            <h2 className="text-lg font-bold text-white mb-2 leading-snug">
              Sistem Aplikasi Layanan Akademik & Mahasiswa
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed mb-6 font-normal">
              Pusat pembelajaran digital, evaluasi CBT, manajemen KRS-KHS, dan perkuliahan interaktif STAI Al-Ittihad Cianjur.
            </p>

            {/* Feature Highlights */}
            <div className="flex flex-col gap-2.5 my-4">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <GraduationCap size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Ekosistem Akademik Lengkap</div>
                  <div className="text-[11px] text-emerald-100">KRS, KHS, E-Modul, CBT, Tugas, dan Forum Diskusi.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <ShieldCheck size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Aman & Terstandarisasi</div>
                  <div className="text-[11px] text-emerald-100">Otentikasi berlapis, CAPTCHA anti-bot, dan audit log.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <BookOpen size={16} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Integrasi Turats & Kurikulum OBE</div>
                  <div className="text-[11px] text-emerald-100">Dukungan teks Arab berharakat & kurikulum berbasis capaian.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Accreditation & Academic Year */}
          <div className="relative z-10 pt-4 border-t border-emerald-600/60 mt-4 flex items-center justify-between text-[11px] text-emerald-200">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles size={13} className="text-emerald-300" /> TA 2026/2027 Ganjil
            </span>
            <span className="opacity-90">Terakreditasi BAN-PT</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LOGIN FORM & TABBED CONTAINER */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Navigation Tabs Segmented Control */}
            <div 
              className="flex rounded-xl p-1 bg-slate-100 border border-slate-200 mb-6"
            >
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'form' 
                    ? 'bg-white shadow-xs text-emerald-800' 
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <LogIn size={15} /> Formulir Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'accounts' 
                    ? 'bg-white shadow-xs text-emerald-800' 
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <UserCheck size={15} /> Panduan Akun Akses ({REGISTERED_USERS.length})
              </button>
            </div>

            {/* TAB 1: FORMULIR MASUK AKUN */}
            {activeTab === 'form' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 m-0">
                      Masuk ke Akun Anda
                    </h3>
                    <p className="text-xs text-slate-500 m-0">
                      Silakan masukkan kredensial resmi institusi
                    </p>
                  </div>
                  <Badge variant="success" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    Sesi Aktif Aman
                  </Badge>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div 
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-shake"
                  >
                    <AlertCircle size={16} className="flex-shrink-0 text-rose-600 mt-0.5" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                {/* Input Identifier */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    NIM / NIDN / NIP / Username / Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Contoh: 21010042 atau 2112087501"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(true)}
                      className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle size={12} /> Lupa Sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi akun Anda"
                      value={kataSandi}
                      onChange={(e) => setKataSandi(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Ingat identitas saya di peramban ini</span>
                  </label>
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

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={LogIn}
                  isLoading={isSubmitting}
                  className="w-full shadow-md hover:shadow-lg transition-all font-bold"
                  style={{
                    backgroundColor: isCaptchaVerified ? '#059669' : undefined,
                    padding: '13px',
                    borderRadius: 'var(--radius-xl)'
                  }}
                >
                  {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Portal SALAM'}
                </Button>
              </form>
            ) : (
              /* TAB 2: PANDUAN AKUN AKSES & ROLE DIRECTORY */
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 m-0">
                      Daftar Akun Pengguna Terdaftar
                    </h3>
                    <p className="text-[11px] text-slate-500 m-0">
                      Gunakan akun demo berikut untuk eksplorasi sistem
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-mono border border-emerald-200">
                    Sandi: <strong>salam123</strong>
                  </span>
                </div>

                {/* Account Search Input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, NIM, atau peran akun..."
                    value={searchAccount}
                    onChange={(e) => setSearchAccount(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredAccounts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Tidak ada akun yang sesuai dengan kata kunci pencarian.
                    </div>
                  ) : (
                    filteredAccounts.map((u) => (
                      <div
                        key={u.id}
                        className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                            <div className="text-slate-600 text-[11px] font-mono">
                              Username: <strong className="text-emerald-700">{u.username}</strong>
                            </div>
                            <div className="text-slate-500 text-[11px]">{u.studyProgram}</div>
                          </div>
                          <Badge variant={u.role === 'mahasiswa' ? 'primary' : u.role === 'dosen' ? 'success' : 'warning'}>
                            {u.roleLabel}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70">
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 mt-4">
            <span>© 2026 STAI AL-ITTIHAD CIANJUR</span>
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="text-emerald-700 hover:underline font-medium flex items-center gap-1"
            >
              <HelpCircle size={13} /> Pusat Bantuan & Kontak BAAK
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: PUSAT BANTUAN & LUPA KATA SANDI */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Pusat Bantuan & Pemulihan Akun"
        maxWidth="500px"
        footer={
          <Button variant="primary" onClick={() => setIsHelpModalOpen(false)}>
            Tutup Bantuan
          </Button>
        }
      >
        <div className="flex flex-col gap-4 text-xs text-slate-600">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
            <Info size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-1">Lupa Kata Sandi Akun Akademik?</div>
              <div>
                Untuk menjaga keamanan data akademik mahasiswa dan dosen, reset kata sandi resmi dilakukan melalui verifikasi Biro Administrasi Akademik & Kemahasiswaan (BAAK).
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-bold text-slate-800">Layanan Bantuan Resmi:</div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
              <Phone size={18} className="text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-800">Helpdesk WhatsApp BAAK</div>
                <div className="text-slate-500">+62 812-3456-7890 (Senin - Jumat: 08.00 - 16.00 WIB)</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
              <Mail size={18} className="text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-800">Email Pusat IT (PTIPD)</div>
                <div className="text-slate-500">it-center@staialittihad.ac.id</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Akun Pengujian / Demo:</div>
            <div className="text-slate-500">
              Gunakan kata sandi default <strong>salam123</strong> untuk seluruh pengguna terdaftar pada tab "Panduan Akun Akses".
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;


