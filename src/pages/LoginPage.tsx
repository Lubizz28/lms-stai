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
  Search, 
  Phone, 
  Mail, 
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
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, #ecfdf5 0%, #f8fafc 75%, #f1f5f9 100%)',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Main Card Container (Centered, Max-Width 460px, Never Stretches Full Screen) */}
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          padding: '28px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header with Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
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
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              marginBottom: '10px'
            }}
          >
            <img 
              src="/logo.png" 
              alt="Logo STAI AL-ITTIHAD" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#064e3b', margin: '0 0 2px 0' }}>
            SALAM LMS
          </h1>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, fontWeight: 500 }}>
            STAI AL-ITTIHAD CIANJUR
          </p>
        </div>

        {/* 1. Navigasi Tab (Modern Segmented Control) */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'form' ? 700 : 500,
              borderRadius: '8px',
              backgroundColor: activeTab === 'form' ? '#ffffff' : 'transparent',
              color: activeTab === 'form' ? '#047857' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
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
              fontWeight: activeTab === 'accounts' ? 700 : 500,
              borderRadius: '8px',
              backgroundColor: activeTab === 'accounts' ? '#ffffff' : 'transparent',
              color: activeTab === 'accounts' ? '#047857' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeTab === 'accounts' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <UserCheck size={14} /> Panduan Akun ({REGISTERED_USERS.length})
          </button>
        </div>

        {/* TAB 1: FORMULIR MASUK */}
        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Header Form & Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                  Masuk ke Akun Anda
                </h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0 0' }}>
                  Masukkan identitas akademik resmi
                </p>
              </div>
              <span 
                style={{
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0',
                  flexShrink: 0
                }}
              >
                2026/2027 Ganjil
              </span>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 2. Input Identifier with Guaranteed 42px Padding-Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                NIM / NIDN / NIP / Email
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <div 
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                >
                  <User size={16} />
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
                    height: '44px',
                    paddingLeft: '42px',
                    paddingRight: '14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#047857';
                    e.target.style.boxShadow = '0 0 0 3px rgba(4, 120, 87, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* 2. Input Kata Sandi with Guaranteed 42px Padding-Left & Centered Eye Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(true)}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#047857',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <HelpCircle size={11} /> Lupa Sandi?
                </button>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <div 
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                >
                  <Lock size={16} />
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
                    height: '44px',
                    paddingLeft: '42px',
                    paddingRight: '42px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#047857';
                    e.target.style.boxShadow = '0 0 0 3px rgba(4, 120, 87, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
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
                    color: '#9ca3af',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 4. Area CAPTCHA Security (Single Horizontal Row) */}
            <CaptchaSecurity
              onVerify={(isValid) => {
                setIsCaptchaVerified(isValid);
                if (isValid) setCaptchaError(null);
              }}
              isVerified={isCaptchaVerified}
              error={captchaError}
            />

            {/* 5. Checkbox Ingat Saya */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#4b5563', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#047857', cursor: 'pointer' }}
                />
                <span>Ingat identitas saya</span>
              </label>
            </div>

            {/* 3. Tombol Utama ("Masuk ke Portal") - Paksa Style Hijau Solid & Tebal */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: '#047857',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                padding: '13px 0',
                borderRadius: '8px',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)',
                transition: 'background-color 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#064e3b';
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#047857';
              }}
            >
              {isSubmitting ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Masuk ke Portal</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* TAB 2: PANDUAN AKUN AKSES */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Daftar Akun Pengguna
                </h3>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  Pilih peran untuk simulasi akses
                </span>
              </div>
              <span style={{ fontSize: '10px', backgroundColor: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                Sandi: salam123
              </span>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
                <Search size={14} />
              </div>
              <input
                type="text"
                placeholder="Cari nama, NIM, atau peran..."
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '32px',
                  paddingRight: '12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* List Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredAccounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: '#9ca3af' }}>
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
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.name}
                        </span>
                        <span 
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: u.role === 'mahasiswa' ? '#eff6ff' : u.role === 'dosen' ? '#ecfdf5' : '#fffbeb',
                            color: u.role === 'mahasiswa' ? '#1d4ed8' : u.role === 'dosen' ? '#047857' : '#b45309',
                            border: `1px solid ${u.role === 'mahasiswa' ? '#bfdbfe' : u.role === 'dosen' ? '#a7f3d0' : '#fde68a'}`
                          }}
                        >
                          {u.roleLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#6b7280', fontFamily: 'monospace' }}>
                        Username: <strong style={{ color: '#047857' }}>{u.username}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectAccount(u)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        color: '#047857',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0
                      }}
                    >
                      Pilih <ArrowRight size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer info & helpdesk link */}
        <div 
          style={{
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#6b7280',
            marginTop: '18px'
          }}
        >
          <span>© 2026 STAI AL-ITTIHAD</span>
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            style={{
              color: '#047857',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={12} /> Bantuan BAAK
          </button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', color: '#374151' }}>
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              display: 'flex',
              gap: '8px'
            }}
          >
            <Info size={16} color="#047857" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>Lupa Kata Sandi Akun?</div>
              <div style={{ fontSize: '11px', lineHeight: 1.4 }}>
                Pemulihan kata sandi resmi dilakukan melalui verifikasi Bagian Akademik (BAAK) atau Tim IT PTIPD.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontWeight: 700, color: '#111827' }}>Kontak Resmi:</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <Phone size={15} color="#047857" />
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>WhatsApp BAAK STAI</div>
                <div style={{ color: '#6b7280', fontSize: '10.5px' }}>+62 812-3456-7890 (08.00 - 16.00 WIB)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <Mail size={15} color="#047857" />
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>Email Tim IT (PTIPD)</div>
                <div style={{ color: '#6b7280', fontSize: '10.5px' }}>ptipd@staialittihad.ac.id</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#f3f4f6', fontSize: '10.5px', color: '#6b7280' }}>
            <strong>Demo / Evaluasi:</strong> Gunakan sandi default <strong>salam123</strong> untuk akun pada tab "Panduan Akun".
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
