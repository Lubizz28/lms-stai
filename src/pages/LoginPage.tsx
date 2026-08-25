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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
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
      setErrorMessage('NIM / NIDN atau Email wajib diisi.');
      return;
    }
    if (!kataSandi.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }
    if (!isCaptchaVerified) {
      setCaptchaError('Selesaikan verifikasi keamanan terlebih dahulu.');
      return;
    }

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
      setErrorMessage(err.message || 'Gagal masuk. Periksa data kredensial Anda.');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100">
      
      {/* Outer Shell Card - Pixel Perfect & Modern */}
      <div className="w-full max-w-[780px] bg-white rounded-2xl shadow-xl shadow-emerald-950/5 border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="flex w-full min-h-[490px]">
          
          {/* ========================================================================= */}
          {/* LEFT HERO PANEL (Desktop >= 768px) */}
          {/* ========================================================================= */}
          <div className="hidden md:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white p-7 w-[38%] shrink-0">
            {/* Ambient Background Accents */}
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Brand Top Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="Logo STAI AL-ITTIHAD" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-emerald-300 block">
                    PORTAL AKADEMIK RESMI
                  </span>
                  <h1 className="text-lg font-extrabold text-white leading-tight">
                    SALAM LMS
                  </h1>
                </div>
              </div>

              <h2 className="text-sm font-bold text-white leading-snug mb-1.5">
                STAI AL-ITTIHAD CIANJUR
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed mb-5">
                Layanan akademik digital, perkuliahan interaktif, evaluasi CBT, dan transkrip mahasiswa terintegrasi.
              </p>

              {/* Value Highlights */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm">
                  <GraduationCap size={15} className="text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Akademik & KRS</div>
                    <div className="text-[10px] text-emerald-200">Perwalian PA & KHS online.</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm">
                  <ShieldCheck size={15} className="text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">CBT & Bank Soal</div>
                    <div className="text-[10px] text-emerald-200">Ujian daring terproteksi.</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-sm">
                  <BookOpen size={15} className="text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">E-Modul & Turats</div>
                    <div className="text-[10px] text-emerald-200">Materi kuliah interaktif.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-emerald-200">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles size={11} className="text-emerald-300" /> TA 2026/2027 Ganjil
              </span>
              <span>Terakreditasi BAN-PT</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT FORM PANEL (Desktop & Mobile Unified) */}
          {/* ========================================================================= */}
          <div className="flex-1 bg-white p-6 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Mobile Compact Header (Hidden on Desktop >= 768px) */}
              <div className="flex md:hidden flex-col items-center text-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm border border-slate-200 mb-1.5">
                  <img 
                    src="/logo.png" 
                    alt="Logo STAI AL-ITTIHAD" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-base font-bold text-emerald-900">
                  SALAM LMS
                </h1>
                <p className="text-[11px] text-gray-500">
                  STAI AL-ITTIHAD CIANJUR
                </p>
              </div>

              {/* 1. Navigasi Tab (Modern Segmented Control Style) */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 mb-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`flex-1 py-2 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'form'
                      ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                      : 'text-slate-500 font-medium hover:text-slate-700 bg-transparent'
                  }`}
                >
                  <LogIn size={14} /> Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('accounts')}
                  className={`flex-1 py-2 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'accounts'
                      ? 'bg-white text-emerald-700 font-semibold shadow-sm'
                      : 'text-slate-500 font-medium hover:text-slate-700 bg-transparent'
                  }`}
                >
                  <UserCheck size={14} /> Panduan Akun ({REGISTERED_USERS.length})
                </button>
              </div>

              {/* TAB 1: FORMULIR MASUK */}
              {activeTab === 'form' ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                  
                  {/* 2. Hierarki Tipografi & Header Form */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                        Masuk ke Akun Anda
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Masukkan identitas akademik resmi
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-full shrink-0">
                      2026/2027 Ganjil
                    </span>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                      <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* 3. Input Identifier (NIM/Email) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      NIM / NIDN / NIP / Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: 21010042 atau 2112087501"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                        required
                        className="w-full h-10 pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-left"
                      />
                    </div>
                  </div>

                  {/* 3. Input Kata Sandi & Lupa Sandi Link */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-gray-700">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsHelpModalOpen(true)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
                      >
                        <HelpCircle size={11} /> Lupa Sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
                        <Lock size={15} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi akun"
                        value={kataSandi}
                        onChange={(e) => setKataSandi(e.target.value)}
                        autoComplete="current-password"
                        required
                        className="w-full h-10 pl-9 pr-10 text-xs text-gray-800 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-left"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* 4. Area CAPTCHA (Verifikasi Keamanan) */}
                  <div>
                    <CaptchaSecurity
                      onVerify={(isValid) => {
                        setIsCaptchaVerified(isValid);
                        if (isValid) setCaptchaError(null);
                      }}
                      isVerified={isCaptchaVerified}
                      error={captchaError}
                    />
                  </div>

                  {/* 5. Checkbox Ingat Saya */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500/30 accent-emerald-600 cursor-pointer"
                      />
                      <span>Ingat identitas saya</span>
                    </label>
                  </div>

                  {/* 5. Tombol Utama (Masuk ke Portal) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Memverifikasi...</span>
                    ) : (
                      <>
                        <LogIn size={15} />
                        <span>Masuk ke Portal</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* TAB 2: PANDUAN AKUN AKSES */
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Daftar Akun Pengguna
                      </h3>
                      <span className="text-[11px] text-gray-500">
                        Pilih peran untuk simulasi akses
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                      Sandi: salam123
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, NIM, atau peran..."
                      value={searchAccount}
                      onChange={(e) => setSearchAccount(e.target.value)}
                      className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-left placeholder:text-gray-400"
                    />
                  </div>

                  {/* List Container */}
                  <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {filteredAccounts.length === 0 ? (
                      <div className="text-center py-5 text-xs text-gray-400">
                        Tidak ditemukan akun yang cocok.
                      </div>
                    ) : (
                      filteredAccounts.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-800 truncate">
                                {u.name}
                              </span>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                u.role === 'mahasiswa' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : u.role === 'dosen' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {u.roleLabel}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              Username: <strong className="text-emerald-700">{u.username}</strong>
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSelectAccount(u)}
                            className="text-[10px] py-1 px-2.5 rounded-md shrink-0"
                          >
                            Pilih <ArrowRight size={10} className="ml-0.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-gray-500 mt-3.5">
              <span>© 2026 STAI AL-ITTIHAD</span>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <HelpCircle size={12} /> Bantuan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL BANTUAN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Pusat Bantuan & Kontak BAAK"
        maxWidth="440px"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsHelpModalOpen(false)}>
            Tutup
          </Button>
        }
      >
        <div className="flex flex-col gap-2.5 text-xs text-gray-700">
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex gap-2">
            <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-0.5">Lupa Kata Sandi Akun?</div>
              <div className="text-[11px] leading-relaxed text-emerald-800">
                Pemulihan kata sandi resmi dilakukan melalui verifikasi Bagian Akademik (BAAK) atau Tim IT PTIPD.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="font-semibold text-gray-900">Kontak Resmi:</div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 bg-slate-50">
              <Phone size={15} className="text-emerald-600 shrink-0" />
              <div>
                <div className="font-medium text-gray-900">WhatsApp BAAK STAI</div>
                <div className="text-gray-500 text-[10px]">+62 812-3456-7890 (08.00 - 16.00 WIB)</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 bg-slate-50">
              <Mail size={15} className="text-emerald-600 shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Email Tim IT (PTIPD)</div>
                <div className="text-gray-500 text-[10px]">ptipd@staialittihad.ac.id</div>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-100 text-[10px] text-gray-600">
            <strong>Demo / Evaluasi:</strong> Gunakan sandi default <strong>salam123</strong> untuk akun pada tab "Panduan Akun".
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
