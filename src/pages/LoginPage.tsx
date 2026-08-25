import React, { useState } from 'react';
import { LogIn, AlertCircle, Key, UserCheck, Info } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { REGISTERED_USERS } from '../services/authService';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'accounts'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!identifier.trim()) {
      setErrorMessage('NIM / NIDN / NIP atau Email wajib diisi.');
      return;
    }
    if (!kataSandi.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier, kataSandi);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali data Anda.');
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
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 'var(--space-4)',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)' 
      }}
    >
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <div 
            style={{ 
              width: '68px', 
              height: '68px', 
              borderRadius: 'var(--radius-xl)', 
              background: '#ffffff', 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-slate-200)',
              padding: '6px',
              marginBottom: 'var(--space-3)'
            }}
          >
            <img 
              src="/logo.png" 
              alt="Logo STAI AL-ITTIHAD" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            SALAM LMS
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Sistem Aplikasi Layanan Akademik & Mahasiswa<br />
            <strong>STAI AL-ITTIHAD CIANJUR</strong>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div 
          className="flex rounded-lg" 
          style={{ 
            backgroundColor: 'var(--color-slate-100)', 
            padding: '4px', 
            marginBottom: 'var(--space-4)',
            border: '1px solid var(--border-subtle)' 
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === 'form' 
                ? 'bg-white shadow-sm text-primary-800' 
                : 'text-muted hover:text-primary'
            }`}
          >
            <LogIn size={14} /> Form Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === 'accounts' 
                ? 'bg-white shadow-sm text-primary-800' 
                : 'text-muted hover:text-primary'
            }`}
          >
            <UserCheck size={14} /> Panduan Akun Akses
          </button>
        </div>

        {/* Login Card */}
        <Card style={{ boxShadow: 'var(--shadow-lg)' }}>
          <CardBody style={{ padding: 'var(--space-6)' }}>
            {activeTab === 'form' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>
                    Masuk ke Sistem
                  </h2>
                  <Badge variant="primary" style={{ fontSize: '10px' }}>
                    Tahun Akademik 2026/2027
                  </Badge>
                </div>

                {errorMessage && (
                  <div 
                    className="flex items-center gap-2" 
                    style={{ 
                      padding: 'var(--space-3)', 
                      backgroundColor: 'var(--color-danger-bg)', 
                      border: '1px solid var(--color-danger-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-danger-text)',
                      fontSize: 'var(--text-xs)'
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Input
                  label="NIM / NIDN / Username / Email"
                  placeholder="Contoh: 21010042 atau 2112087501"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />

                <Input
                  label="Kata Sandi"
                  type="password"
                  placeholder="Masukkan kata sandi akun Anda"
                  value={kataSandi}
                  onChange={(e) => setKataSandi(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <div className="flex items-center justify-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Key size={12} /> Sandi default demo: <strong>salam123</strong>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('accounts')}
                    className="text-primary-700 hover:underline"
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
                  className="w-full"
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  Masuk ke SALAM
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 style={{ fontSize: 'var(--text-base)', margin: 0, fontWeight: 'bold' }}>
                    Daftar Akun Pengguna Terdaftar
                  </h2>
                  <span className="text-xs text-muted">Sandi Demo: <strong>salam123</strong></span>
                </div>

                <div 
                  className="flex items-center gap-2 p-2 rounded" 
                  style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', fontSize: '11px', color: 'var(--color-primary-900)' }}
                >
                  <Info size={14} className="flex-shrink-0" />
                  <span>Klik <strong>"Pilih Akun"</strong> untuk menyalin NIM/NIDN ke formulir login resmi.</span>
                </div>

                <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {REGISTERED_USERS.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                          <div className="text-slate-600 text-xs font-mono">Username/NIM: <strong>{u.username}</strong></div>
                          <div className="text-slate-500 text-xs">{u.studyProgram}</div>
                        </div>
                        <Badge variant={u.role === 'mahasiswa' ? 'primary' : u.role === 'dosen' ? 'success' : 'warning'}>
                          {u.roleLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSelectAccount(u)}
                          className="w-full"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
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
        <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-5)' }}>
          © 2026 STAI AL-ITTIHAD. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
