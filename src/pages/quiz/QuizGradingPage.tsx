import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Save,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table, Column } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Quiz, QuizAttempt } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/feedback/ToastContext';
import { KAMUS_UI } from '../../constants/dictionary';
import { ExportDropdown, ExportConfig } from '../../components/export-import';

export interface QuizGradingPageProps {
  onBack: () => void;
}

export const QuizGradingPage: React.FC<QuizGradingPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Search & Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form penilaian per soal esai
  const [gradingPoints, setGradingPoints] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});

  // Auto reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const hasActiveFilters = searchQuery !== '' || filterStatus !== 'SEMUA';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('SEMUA');
    setCurrentPage(1);
  };

  const loadAttempts = () => {
    const all = quizService.getAttempts();
    setAttempts(all);
  };

  useEffect(() => {
    loadAttempts();
  }, []);

  const handleOpenGrading = (attempt: QuizAttempt) => {
    const qz = quizService.getQuizById(attempt.quizId);
    if (!qz) return;
    setSelectedQuiz(qz);
    setSelectedAttempt(attempt);

    // Inisialisasi poin yang sudah ada
    const pts: Record<string, number> = {};
    const fdb: Record<string, string> = {};
    qz.questions.forEach((q) => {
      if (q.type === 'ESAI') {
        const ans = attempt.answers[q.id];
        pts[q.id] = ans?.earnedPoints || 0;
        fdb[q.id] = ans?.lecturerFeedback || '';
      }
    });
    setGradingPoints(pts);
    setGradingFeedback(fdb);
  };

  const handleSaveGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt || !selectedQuiz || !user) return;

    try {
      const essayQuestions = selectedQuiz.questions.filter((q) => q.type === 'ESAI');
      let updatedAtt = selectedAttempt;

      essayQuestions.forEach((eq) => {
        const p = gradingPoints[eq.id] || 0;
        const f = gradingFeedback[eq.id] || '';
        updatedAtt = quizService.gradeEssayAnswer(selectedAttempt.id, eq.id, p, f, user.name);
      });

      loadAttempts();
      setSelectedAttempt(null);
      setSelectedQuiz(null);
      toast.success(
        'Penilaian Berhasil Disimpan',
        `Nilai akhir ${updatedAtt.studentName} kini: ${updatedAtt.finalScore} / 100 (${updatedAtt.isPassed ? 'Lulus' : 'Belum Lulus'}).`
      );
    } catch (err: any) {
      toast.danger('Gagal Menyimpan Penilaian', err.message);
    }
  };

  const columns: Column<QuizAttempt>[] = [
    {
      header: 'Mahasiswa',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>{row.studentName}</div>
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>NIM: {row.studentNim}</div>
        </div>
      )
    },
    {
      header: 'Judul Kuis',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{row.quizTitle}</div>
          <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>{row.classId}</div>
        </div>
      )
    },
    {
      header: 'Percobaan',
      width: '100px',
      render: (row) => (
        <span style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
          Ke-{row.attemptNumber}
        </span>
      )
    },
    {
      header: 'Status Penilaian',
      width: '190px',
      render: (row) => (
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
          background: row.needsManualGrading ? '#fefce8' : row.status === 'DINILAI' ? '#f0fdf4' : '#f1f5f9',
          color: row.needsManualGrading ? '#92400e' : row.status === 'DINILAI' ? '#166534' : '#475569',
          border: `1px solid ${row.needsManualGrading ? '#fde68a' : row.status === 'DINILAI' ? '#bbf7d0' : '#e2e8f0'}`
        }}>
          {row.needsManualGrading ? '⚠️ Perlu Koreksi Esai' : row.status === 'DINILAI' ? `✓ Dinilai (Skor: ${row.finalScore})` : 'Selesai'}
        </span>
      )
    },
    {
      header: 'Waktu Pengumpulan',
      width: '160px',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {row.submittedAt ? new Date(row.submittedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
        </span>
      )
    },
    {
      header: 'Aksi',
      width: '120px',
      render: (row) => (
        <Button 
          variant={row.needsManualGrading ? 'primary' : 'outline'} 
          size="sm" 
          onClick={() => handleOpenGrading(row)}
          className="text-xs"
          style={row.needsManualGrading ? { background: 'linear-gradient(135deg, #059669, #047857)' } : {}}
        >
          {row.needsManualGrading ? 'Koreksi Esai' : 'Ubah Nilai'}
        </Button>
      )
    }
  ];

  // Filtered Attempts Memo
  const filteredAttempts = useMemo(() => {
    return attempts.filter((att) => {
      const matchSearch = 
        att.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.studentNim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        att.quizTitle.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (filterStatus === 'KOREKSI_ESAI') {
        matchStatus = att.needsManualGrading;
      } else if (filterStatus === 'DINILAI') {
        matchStatus = att.status === 'DINILAI' && !att.needsManualGrading;
      } else if (filterStatus === 'LULUS') {
        matchStatus = att.isPassed;
      } else if (filterStatus === 'BELUM_LULUS') {
        matchStatus = !att.isPassed;
      }

      return matchSearch && matchStatus;
    });
  }, [attempts, searchQuery, filterStatus]);

  // Paginated Attempts Memo
  const totalPages = Math.ceil(filteredAttempts.length / pageSize) || 1;
  const paginatedAttempts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttempts.slice(start, start + pageSize);
  }, [filteredAttempts, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => ({
    total: attempts.length,
    pending: attempts.filter(a => a.needsManualGrading).length,
    graded: attempts.filter(a => a.status === 'DINILAI').length,
    passed: attempts.filter(a => a.isPassed).length,
  }), [attempts]);

  // Konfigurasi Ekspor Rekap Nilai Kuis Mahasiswa
  const quizExportConfig: ExportConfig<QuizAttempt> = useMemo(() => ({
    filename: 'SALAM_Rekap_Nilai_Kuis',
    title: 'REKAPITULASI HASIL & PENILAIAN KUIS MAHASISWA',
    subtitle: 'Sistem Aplikasi Layanan Akademik dan Mahasiswa (SALAM) — STAI Al-Ittihad',
    data: filteredAttempts,
    columns: [
      { key: 'studentNim', header: 'NIM', width: '110px' },
      { key: 'studentName', header: 'Nama Mahasiswa', width: '220px' },
      { key: 'quizTitle', header: 'Judul Kuis', width: '200px' },
      { key: 'attemptNumber', header: 'Percobaan', width: '80px', align: 'center', format: (val) => `Ke-${val}` },
      { 
        key: 'submittedAt', 
        header: 'Waktu Pengumpulan', 
        width: '160px', 
        format: (val) => val ? new Date(val).toLocaleString('id-ID') : '-' 
      },
      { key: 'finalScore', header: 'Nilai Akhir', width: '90px', align: 'center' },
      { 
        key: 'isPassed', 
        header: 'Status Kelulusan', 
        width: '120px', 
        align: 'center',
        format: (val) => val ? 'Lulus' : 'Belum Lulus'
      },
      { 
        key: 'needsManualGrading', 
        header: 'Koreksi Esai', 
        width: '130px', 
        align: 'center',
        format: (val) => val ? 'Perlu Koreksi' : 'Selesai Dinilai'
      }
    ],
    metadata: {
      'Total Pengumpulan': `${filteredAttempts.length} Lembar Jawaban`,
      'Menunggu Koreksi': `${filteredAttempts.filter((a) => a.needsManualGrading).length} Lembar`,
      'Waktu Unduh': new Date().toLocaleString('id-ID')
    }
  }), [filteredAttempts]);

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                color: '#475569', transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
                ✍️ Antrean Penilaian & Koreksi Esai
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                Periksa lembar jawaban esai kuis mahasiswa dan berikan nilai serta umpan balik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ExportDropdown<QuizAttempt>
              config={quizExportConfig}
              buttonLabel="Ekspor Rekap Nilai"
            />
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadAttempts} className="text-xs">
              Segarkan
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Lembar Masuk</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{metrics.total}</div>
          </div>
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Perlu Koreksi Esai</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>{metrics.pending}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Telah Dinilai</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>{metrics.graded}</div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>Lulus KKM</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>{metrics.passed}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center',
        background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0'
      }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <Input
            placeholder="Cari NIM, nama mahasiswa, atau judul kuis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: '0.8rem', borderRadius: '10px' }}
          />
        </div>

        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px', borderColor: '#e2e8f0', minWidth: '160px' }}
        >
          <option value="SEMUA">Semua Status</option>
          <option value="KOREKSI_ESAI">Perlu Koreksi Esai</option>
          <option value="DINILAI">Sudah Dinilai</option>
          <option value="LULUS">Lulus Kuis</option>
          <option value="BELUM_LULUS">Belum Lulus</option>
        </select>

        {hasActiveFilters && (
          <button 
            onClick={handleResetFilters}
            style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {/* Attempts Table Container (Desktop table & Mobile cards) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', padding: '20px' }}>
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={paginatedAttempts}
            keyExtractor={(row) => row.id}
            emptyMessage="Belum ada lembar kuis mahasiswa yang sesuai filter."
          />
        </div>

        {/* Mobile View: Cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {paginatedAttempts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontSize: '13px' }}>
              Belum ada lembar kuis mahasiswa yang sesuai filter.
            </div>
          ) : (
            paginatedAttempts.map((row) => (
              <div
                key={row.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{row.studentName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>NIM: {row.studentNim}</div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    background: row.needsManualGrading ? '#fefce8' : '#f0fdf4',
                    color: row.needsManualGrading ? '#92400e' : '#166534',
                    border: `1px solid ${row.needsManualGrading ? '#fde68a' : '#bbf7d0'}`
                  }}>
                    {row.needsManualGrading ? 'Perlu Koreksi' : `Nilai: ${row.finalScore}`}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                  {row.quizTitle}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('id-ID') : '-'}
                  </span>
                  <Button 
                    variant={row.needsManualGrading ? 'primary' : 'outline'} 
                    size="sm" 
                    onClick={() => handleOpenGrading(row)}
                    className="text-xs"
                    style={row.needsManualGrading ? { background: '#059669' } : {}}
                  >
                    {row.needsManualGrading ? 'Koreksi Esai' : 'Ubah Nilai'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '16px' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAttempts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="lembar kuis"
          />
        </div>
      </div>

      {/* MODAL: Formulir Penilaian Esai Dosen */}
      {selectedAttempt && selectedQuiz && (
        <Modal
          isOpen={!!selectedAttempt && !!selectedQuiz}
          onClose={() => { setSelectedAttempt(null); setSelectedQuiz(null); }}
          title={`✍️ Koreksi Esai: ${selectedAttempt.studentName}`}
          maxWidth="720px"
        >
          <form onSubmit={handleSaveGrading} className="flex flex-col gap-4">
            {/* Header info */}
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Mahasiswa / NIM:</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{selectedAttempt.studentName} ({selectedAttempt.studentNim})</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Skor Objektif:</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>{selectedAttempt.totalEarnedPoints} / {selectedQuiz.totalPoints} Poin</div>
              </div>
            </div>

            {/* List of essay questions */}
            {selectedQuiz.questions.filter((q) => q.type === 'ESAI').map((eq, idx) => {
              const ans = selectedAttempt.answers[eq.id];

              return (
                <div 
                  key={eq.id}
                  style={{
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div className="flex justify-between items-center" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                      Soal Esai #{idx + 1}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                      Poin Maksimal: {eq.points}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.5, margin: 0 }}>
                    {eq.questionText}
                  </p>

                  {eq.essayRubric && (
                    <div style={{ fontSize: '11px', color: '#92400e', background: '#fefce8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      <strong>Rubrik Panduan:</strong> {eq.essayRubric}
                    </div>
                  )}

                  {/* Jawaban Mahasiswa */}
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Jawaban Mahasiswa:</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {ans?.essayAnswerText || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Tidak ada jawaban tertulis.</span>}
                    </div>
                  </div>

                  {/* Input Score & Feedback */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginTop: '4px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                        Beri Nilai (0 - {eq.points})
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={eq.points}
                        value={gradingPoints[eq.id] ?? 0}
                        onChange={(e) => setGradingPoints({ ...gradingPoints, [eq.id]: parseInt(e.target.value) || 0 })}
                        required
                        style={{ fontSize: '13px', borderRadius: '8px' }}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                        Catatan / Umpan Balik Dosen
                      </label>
                      <Input
                        placeholder="Contoh: Analisis tepat, tingkatkan dalil rujukan..."
                        value={gradingFeedback[eq.id] || ''}
                        onChange={(e) => setGradingFeedback({ ...gradingFeedback, [eq.id]: e.target.value })}
                        style={{ fontSize: '13px', borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '4px' }}>
              <Button variant="secondary" type="button" onClick={() => { setSelectedAttempt(null); setSelectedQuiz(null); }}>
                {KAMUS_UI.BATAL}
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                icon={Save}
                style={{ background: 'linear-gradient(135deg, #059669, #047857)', fontWeight: 700 }}
              >
                Simpan & Terbitkan Nilai
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

