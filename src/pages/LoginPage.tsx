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
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: '#f1f5f9',
        backgroundImage: 'radial-gradient(at 0% 0%, #ecfdf5 0px, transparent 50%), radial-gradient(at 100% 100%, #f0fdf4 0px, transparent 50%)'
      }}
    >
      {/* Outer Shell Card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '960px',
          borderRadius: '24px',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Responsive Dual Pane: Left Hero (Desktop only) + Right Form */}
        <div style={{ display: 'flex', width: '100%', minHeight: '560px' }}>
          
          {/* ========================================================================= */}
          {/* LEFT HERO PANEL (Visible on Desktop >= 900px) */}
          {/* ========================================================================= */}
          <div 
            className="hidden lg:flex"
            style={{
              flex: '0 0 42%',
              background: 'linear-gradient(155deg, #064e3b 0%, #065f46 50%, #047857 100%)',
              padding: '40px 32px',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              color: '#ffffff'
            }}
          >
            {/* Background Glow Accents */}
            <div 
              style={{
                position: 'absolute',
                right: '-40px',
                top: '-40px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />
            <div 
              style={{
                position: 'absolute',
                left: '-40px',
                bottom: '-40px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(110, 231, 183, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />

            {/* Top Brand */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div 
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}
                >
                  <img 
                    src="/logo.png" 
                    alt="Logo STAI AL-ITTIHAD" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#a7f3d0' }}>
                    PORTAL AKADEMIK RESMI
                  </span>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, margin: 0 }}>
                    SALAM LMS
                  </h1>
                </div>
              </div>

              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                Sistem Aplikasi Layanan Akademik & Mahasiswa
              </h2>
              <p style={{ fontSize: '12px', color: '#d1fae5', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                STAI Al-Ittihad Cianjur menghadirkan ekosistem pembelajaran digital komprehensif, terintegrasi SIAKAD & Kemendikbudristek.
              </p>

              {/* Feature Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <GraduationCap size={16} color="#6ee7b7" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>Akademik & Perwalian KRS</div>
                    <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Bimbingan PA & cetak KHS digital instan.</div>
                  </div>
                </div>

                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <ShieldCheck size={16} color="#6ee7b7" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>Ujian CBT & Bank Soal</div>
                    <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Evaluasi terstandarisasi dengan keamanan anti-curang.</div>
                  </div>
                </div>

                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <BookOpen size={16} color="#6ee7b7" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>E-Modul & Turats Interaktif</div>
                    <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Materi kuliah berharakat & audio visual.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer on Left */}
            <div 
              style={{
                position: 'relative',
                zIndex: 2,
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#a7f3d0'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Sparkles size={12} color="#6ee7b7" /> TA 2026/2027 Ganjil
              </span>
              <span>Terakreditasi BAN-PT</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT FORM PANEL (Desktop & Mobile Friendly) */}
          {/* ========================================================================= */}
          <div 
            style={{
              flex: '1 1 auto',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff'
            }}
          >
            <div>
              {/* Mobile Header (Shown only on small screens < 1024px) */}
              <div className="flex lg:hidden flex-col items-center text-center mb-5">
                <div 
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    marginBottom: '8px'
                  }}
                >
                  <img 
                    src="/logo.png" 
                    alt="Logo STAI AL-ITTIHAD" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', margin: '0 0 2px 0' }}>
                  SALAM LMS
                </h1>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                  STAI AL-ITTIHAD CIANJUR
                </p>
              </div>

              {/* Segmented Control Switcher */}
              <div 
                style={{
                  display: 'flex',
                  backgroundColor: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: activeTab === 'form' ? '#ffffff' : 'transparent',
                    color: activeTab === 'form' ? '#065f46' : '#64748b',
                    boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LogIn size={14} /> Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('accounts')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: activeTab === 'accounts' ? '#ffffff' : 'transparent',
                    color: activeTab === 'accounts' ? '#065f46' : '#64748b',
                    boxShadow: activeTab === 'accounts' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <UserCheck size={14} /> Panduan Akun ({REGISTERED_USERS.length})
                </button>
              </div>

              {/* TAB 1: FORMULIR MASUK */}
              {activeTab === 'form' ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Autentikasi Pengguna
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Masukkan identitas akademik terdaftar
                      </span>
                    </div>
                    <Badge variant="success" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      2026/2027 Ganjil
                    </Badge>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '11px',
                        fontWeight: 500
                      }}
                    >
                      <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Input Identifier */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      NIM / NIDN / NIP / Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: 21010042 atau 2112087501"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          fontSize: '13px',
                          fontWeight: 500,
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#059669';
                          e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#cbd5e1';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Input Kata Sandi */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsHelpModalOpen(true)}
                        style={{ fontSize: '11px', fontWeight: 600, color: '#047857', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <HelpCircle size={11} /> Lupa Sandi?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        <Lock size={15} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi Anda"
                        value={kataSandi}
                        onChange={(e) => setKataSandi(e.target.value)}
                        autoComplete="current-password"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 36px',
                          fontSize: '13px',
                          fontWeight: 500,
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#059669';
                          e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#cbd5e1';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Ingat Saya */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#475569' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ accentColor: '#059669', width: '14px', height: '14px', borderRadius: '4px' }}
                      />
                      <span>Ingat identitas saya</span>
                    </label>
                  </div>

                  {/* CAPTCHA Security Box */}
                  <CaptchaSecurity
                    onVerify={(isValid) => {
                      setIsCaptchaVerified(isValid);
                      if (isValid) setCaptchaError(null);
                    }}
                    isVerified={isCaptchaVerified}
                    error={captchaError}
                  />

                  {/* Tombol Submit */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={LogIn}
                    isLoading={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      backgroundColor: isCaptchaVerified ? '#059669' : undefined,
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                      marginTop: '4px'
                    }}
                  >
                    {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Portal SALAM'}
                  </Button>
                </form>
              ) : (
                /* TAB 2: PANDUAN AKUN AKSES & SIMULASI */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Direktori Akun Pengguna
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Pilih salah satu peran untuk simulasi
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', backgroundColor: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                      Sandi: salam123
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Cari nama, NIM, prodi, atau peran..."
                      value={searchAccount}
                      onChange={(e) => setSearchAccount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 30px',
                        fontSize: '11px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* List Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '310px', overflowY: 'auto', paddingRight: '2px' }}>
                    {filteredAccounts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '11px', color: '#94a3b8' }}>
                        Tidak ditemukan akun yang cocok.
                      </div>
                    ) : (
                      filteredAccounts.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {u.name}
                              </span>
                              <Badge variant={u.role === 'mahasiswa' ? 'primary' : u.role === 'dosen' ? 'success' : 'warning'} style={{ fontSize: '9px', padding: '1px 5px' }}>
                                {u.roleLabel}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                              Username: <strong style={{ color: '#059669' }}>{u.username}</strong>
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSelectAccount(u)}
                            style={{ fontSize: '10px', padding: '4px 8px', flexShrink: 0 }}
                          >
                            Pilih <ArrowRight size={10} style={{ marginLeft: '2px' }} />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer on Form Side */}
            <div 
              style={{
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#64748b',
                marginTop: '16px'
              }}
            >
              <span>© 2026 STAI AL-ITTIHAD</span>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <HelpCircle size={12} /> Bantuan BAAK
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL BANTUAN & RESET KATA SANDI */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Pusat Bantuan & Pemulihan Akun"
        maxWidth="480px"
        footer={
          <Button variant="primary" onClick={() => setIsHelpModalOpen(false)}>
            Tutup
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#334155' }}>
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Info size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>Lupa Kata Sandi Akun?</div>
              <div style={{ fontSize: '11px', lineHeight: 1.4 }}>
                Sesuai protokol keamanan kampus, pemulihan kata sandi dilakukan secara terverifikasi melalui Bagian Akademik (BAAK) atau Tim IT (PTIPD).
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Kontak Resmi Kampus:</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <Phone size={16} color="#059669" />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Layanan WhatsApp BAAK</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>+62 812-3456-7890 (Jam Kerja: 08.00 - 16.00 WIB)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <Mail size={16} color="#059669" />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Email Tim IT & Pangkalan Data</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>ptipd@staialittihad.ac.id</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#f1f5f9', fontSize: '11px', color: '#64748b' }}>
            <strong>Catatan Evaluasi / Demo:</strong> Seluruh pengguna yang terdaftar pada tab "Panduan Akun" dapat masuk menggunakan kata sandi <strong>salam123</strong>.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
