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
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        backgroundColor: '#f1f5f9',
        backgroundImage: 'radial-gradient(at 0% 0%, #ecfdf5 0px, transparent 50%), radial-gradient(at 100% 100%, #f0fdf4 0px, transparent 50%)'
      }}
    >
      {/* Outer Shell Card - Proportional & Compact */}
      <div 
        style={{
          width: '100%',
          maxWidth: '750px',
          borderRadius: '18px',
          backgroundColor: '#ffffff',
          boxShadow: '0 15px 35px -10px rgba(6, 78, 59, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', width: '100%' }}>
          
          {/* ========================================================================= */}
          {/* LEFT HERO PANEL (Desktop >= 860px) */}
          {/* ========================================================================= */}
          <div 
            className="hidden md:flex"
            style={{
              flex: '0 0 38%',
              background: 'linear-gradient(155deg, #064e3b 0%, #065f46 55%, #047857 100%)',
              padding: '24px 20px',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              color: '#ffffff'
            }}
          >
            {/* Ambient Glow */}
            <div 
              style={{
                position: 'absolute',
                right: '-30px',
                top: '-30px',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />

            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Brand Top */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
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
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#a7f3d0' }}>
                    PORTAL AKADEMIK
                  </span>
                  <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, margin: 0 }}>
                    SALAM LMS
                  </h1>
                </div>
              </div>

              <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, margin: '0 0 6px 0' }}>
                STAI AL-ITTIHAD CIANJUR
              </h2>
              <p style={{ fontSize: '11px', color: '#d1fae5', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                Layanan akademik digital, perkuliahan interaktif, evaluasi CBT, dan transkrip mahasiswa.
              </p>

              {/* Compact Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <GraduationCap size={14} color="#6ee7b7" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>Akademik & KRS</div>
                    <div style={{ fontSize: '9.5px', color: '#a7f3d0' }}>Perwalian PA & KHS online.</div>
                  </div>
                </div>

                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <ShieldCheck size={14} color="#6ee7b7" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>CBT & Bank Soal</div>
                    <div style={{ fontSize: '9.5px', color: '#a7f3d0' }}>Ujian daring terproteksi.</div>
                  </div>
                </div>

                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <BookOpen size={14} color="#6ee7b7" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>E-Modul & Turats</div>
                    <div style={{ fontSize: '9.5px', color: '#a7f3d0' }}>Teks Arab & materi kuliah.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div 
              style={{
                position: 'relative',
                zIndex: 2,
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '9.5px',
                color: '#a7f3d0'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <Sparkles size={11} color="#6ee7b7" /> TA 2026/2027 Ganjil
              </span>
              <span>BAN-PT</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT FORM PANEL (Desktop & Mobile Compact) */}
          {/* ========================================================================= */}
          <div 
            style={{
              flex: '1 1 auto',
              padding: '20px 18px sm:24px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff'
            }}
          >
            <div>
              {/* Mobile Header (Hidden on Desktop) */}
              <div className="flex md:hidden flex-col items-center text-center mb-3">
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    marginBottom: '4px'
                  }}
                >
                  <img 
                    src="/logo.png" 
                    alt="Logo STAI AL-ITTIHAD" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', margin: 0 }}>
                  SALAM LMS
                </h1>
                <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>
                  STAI AL-ITTIHAD CIANJUR
                </p>
              </div>

              {/* Segmented Tab Switcher */}
              <div 
                style={{
                  display: 'flex',
                  backgroundColor: '#f1f5f9',
                  padding: '3px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '7px',
                    backgroundColor: activeTab === 'form' ? '#ffffff' : 'transparent',
                    color: activeTab === 'form' ? '#065f46' : '#64748b',
                    boxShadow: activeTab === 'form' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LogIn size={13} /> Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('accounts')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '7px',
                    backgroundColor: activeTab === 'accounts' ? '#ffffff' : 'transparent',
                    color: activeTab === 'accounts' ? '#065f46' : '#64748b',
                    boxShadow: activeTab === 'accounts' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <UserCheck size={13} /> Panduan Akun ({REGISTERED_USERS.length})
                </button>
              </div>

              {/* TAB 1: FORMULIR MASUK */}
              {activeTab === 'form' ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Masuk ke Akun Anda
                      </h3>
                    </div>
                    <Badge variant="success" style={{ fontSize: '9px', padding: '1px 6px' }}>
                      2026/2027 Ganjil
                    </Badge>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '10.5px',
                        fontWeight: 500
                      }}
                    >
                      <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Input Identifier */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155' }}>
                      NIM / NIDN / NIP / Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        <User size={14} />
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
                          padding: '8px 10px 8px 32px',
                          fontSize: '12px',
                          fontWeight: 500,
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          height: '36px',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#059669';
                          e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#cbd5e1';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Input Kata Sandi */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155' }}>
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsHelpModalOpen(true)}
                        style={{ fontSize: '10.5px', fontWeight: 600, color: '#047857', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        <HelpCircle size={10} /> Lupa Sandi?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', pointerEvents: 'none' }}>
                        <Lock size={14} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan kata sandi akun"
                        value={kataSandi}
                        onChange={(e) => setKataSandi(e.target.value)}
                        autoComplete="current-password"
                        required
                        style={{
                          width: '100%',
                          padding: '8px 34px 8px 32px',
                          fontSize: '12px',
                          fontWeight: 500,
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          height: '36px',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#059669';
                          e.target.style.boxShadow = '0 0 0 2px rgba(5, 150, 105, 0.12)';
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
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Ingat Saya */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: '#475569' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ accentColor: '#059669', width: '13px', height: '13px', borderRadius: '3px' }}
                      />
                      <span>Ingat identitas saya</span>
                    </label>
                  </div>

                  {/* Compact CAPTCHA */}
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
                    size="md"
                    icon={LogIn}
                    isLoading={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      backgroundColor: isCaptchaVerified ? '#059669' : undefined,
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
                      marginTop: '2px'
                    }}
                  >
                    {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Portal'}
                  </Button>
                </form>
              ) : (
                /* TAB 2: PANDUAN AKUN AKSES */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Daftar Akun Pengguna
                    </h3>
                    <span style={{ fontSize: '9.5px', backgroundColor: '#ecfdf5', color: '#065f46', padding: '2px 6px', borderRadius: '5px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                      Sandi: salam123
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Cari nama, NIM, atau peran..."
                      value={searchAccount}
                      onChange={(e) => setSearchAccount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px 5px 26px',
                        fontSize: '10.5px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* List Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto', paddingRight: '2px' }}>
                    {filteredAccounts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '10.5px', color: '#94a3b8' }}>
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
                            padding: '6px 8px',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1, paddingRight: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {u.name}
                              </span>
                              <Badge variant={u.role === 'mahasiswa' ? 'primary' : u.role === 'dosen' ? 'success' : 'warning'} style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                                {u.roleLabel}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748b', fontFamily: 'monospace' }}>
                              Username: <strong style={{ color: '#059669' }}>{u.username}</strong>
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSelectAccount(u)}
                            style={{ fontSize: '9.5px', padding: '3px 6px', flexShrink: 0 }}
                          >
                            Pilih <ArrowRight size={9} style={{ marginLeft: '1px' }} />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              style={{
                paddingTop: '10px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#64748b',
                marginTop: '10px'
              }}
            >
              <span>© 2026 STAI AL-ITTIHAD</span>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <HelpCircle size={11} /> Bantuan
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#334155' }}>
          <div 
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              display: 'flex',
              gap: '6px'
            }}
          >
            <Info size={15} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '1px' }}>Lupa Kata Sandi Akun?</div>
              <div style={{ fontSize: '10.5px', lineHeight: 1.3 }}>
                Pemulihan kata sandi resmi dilakukan melalui verifikasi Bagian Akademik (BAAK) atau Tim IT PTIPD.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>Kontak Resmi:</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <Phone size={14} color="#059669" />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>WhatsApp BAAK STAI</div>
                <div style={{ color: '#64748b', fontSize: '10px' }}>+62 812-3456-7890 (08.00 - 16.00 WIB)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <Mail size={14} color="#059669" />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Email Tim IT (PTIPD)</div>
                <div style={{ color: '#64748b', fontSize: '10px' }}>ptipd@staialittihad.ac.id</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontSize: '10px', color: '#64748b' }}>
            <strong>Demo / Evaluasi:</strong> Gunakan sandi default <strong>salam123</strong> untuk akun pada tab "Panduan Akun".
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
