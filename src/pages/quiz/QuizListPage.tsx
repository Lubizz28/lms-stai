import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileCheck, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw,
  BookOpen,
  Search, 
  X, 
  Plus, 
  ShieldCheck, 
  Upload,
  Award,
  Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Quiz, ImportQuestionInput, QuizAttempt } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/feedback/ToastContext';
import { DataImportModal, BulkImportResult } from '../../components/export-import';
import { QUESTION_BANK_IMPORT_SCHEMA } from '../../constants/exportImportSchemas';
import { QuizCreatePage } from './QuizCreatePage';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'DITERBITKAN': { label: 'Aktif', color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  'DRAF': { label: 'Draf', color: '#92400e', bg: '#fefce8', border: '#fde68a', dot: '#f59e0b' },
  'SELESAI': { label: 'Selesai', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0', dot: '#94a3b8' },
};

export interface QuizListPageProps {
  onStartQuiz: (quizId: string) => void;
  onViewResult: (attemptId: string) => void;
  onOpenBankSoal?: () => void;
  onOpenGradingQueue?: () => void;
}

export const QuizListPage: React.FC<QuizListPageProps> = ({ 
  onStartQuiz, 
  onViewResult,
  onOpenBankSoal,
  onOpenGradingQueue
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('SEMUA');
  const [filterStatus, setFilterStatus] = useState('SEMUA');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);

  const isStudent = user?.role === 'mahasiswa';
  const isLecturer = user?.role === 'dosen' || user?.role === 'dosen_pa' || user?.role === 'administrator_sistem';

  const loadData = () => {
    setQuizzes(quizService.getQuizzes(undefined, isStudent));
    setAttempts(quizService.getAttempts());
  };

  useEffect(() => { loadData(); }, [isStudent]);

  const uniqueCourses = Array.from(new Set(quizzes.map(q => q.courseName))).filter(Boolean);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterCourse, filterStatus]);

  const hasActiveFilters = searchQuery !== '' || filterCourse !== 'SEMUA' || filterStatus !== 'SEMUA';

  const handleResetFilters = () => { setSearchQuery(''); setFilterCourse('SEMUA'); setFilterStatus('SEMUA'); setCurrentPage(1); };

  const metrics = useMemo(() => ({
    total: quizzes.length,
    published: quizzes.filter(q => q.status === 'DITERBITKAN').length,
    pendingGrading: attempts.filter(a => a.status === 'DIKUMPULKAN').length,
    studentCompleted: attempts.filter(a => user && a.studentId === user.id && a.status === 'DINILAI').length,
  }), [quizzes, attempts, user]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
      const s = searchQuery.toLowerCase().trim();
      const ms = !s || (q.title||'').toLowerCase().includes(s) || (q.courseName||'').toLowerCase().includes(s) || (q.description||'').toLowerCase().includes(s);
      const mc = filterCourse === 'SEMUA' || q.courseName === filterCourse;
      const mst = filterStatus === 'SEMUA' || q.status === filterStatus;
      return ms && mc && mst;
    });
  }, [quizzes, searchQuery, filterCourse, filterStatus]);

  const totalPages = Math.ceil(filteredQuizzes.length / pageSize) || 1;
  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuizzes.slice(start, start + pageSize);
  }, [filteredQuizzes, currentPage, pageSize]);

  const handleDeleteQuiz = () => {
    if (!deletingQuiz) return;
    try {
      const remaining = quizzes.filter(q => q.id !== deletingQuiz.id);
      quizService.saveQuizzes(remaining);
      setQuizzes(remaining);
      setDeletingQuiz(null);
      toast.success('Berhasil', `Kuis "${deletingQuiz.title}" telah dihapus.`);
    } catch (err: any) { toast.danger('Gagal', err.message); }
  };

  const handleBulkImportQuestions = async (validRows: ImportQuestionInput[]): Promise<BulkImportResult> => {
    let sc = 0, fc = 0;
    const errors: string[] = [];
    validRows.forEach((row, idx) => {
      try {
        let options: { id: string; text: string; isCorrect: boolean }[] | undefined;
        let sa: string | undefined, er: string | undefined;
        const ck = (row.correctKey || '').trim().toUpperCase();
        if (row.type === 'BENAR_SALAH') {
          options = [
            { id: `oi-${Date.now()}-${idx}-1`, text: 'Benar', isCorrect: ck === 'A' || ck === 'BENAR' || ck === 'TRUE' },
            { id: `oi-${Date.now()}-${idx}-2`, text: 'Salah', isCorrect: ck === 'B' || ck === 'SALAH' || ck === 'FALSE' },
          ];
        } else if (row.type === 'JAWABAN_SINGKAT') { sa = row.correctKey || row.optA || ''; }
        else if (row.type === 'ESAI') { er = row.correctKey || row.explanation || 'Rubrik penilaian esai.'; }
        else {
          const ro = [
            { text: (row.optA||'').trim(), key: 'A' }, { text: (row.optB||'').trim(), key: 'B' },
            { text: (row.optC||'').trim(), key: 'C' }, { text: (row.optD||'').trim(), key: 'D' },
            { text: (row.optE||'').trim(), key: 'E' },
          ].filter(o => o.text !== '');
          if (ro.length < 2) { fc++; errors.push(`Baris #${idx+1}: Minimal 2 opsi.`); return; }
          options = ro.map((o, i) => ({ id: `oi-${Date.now()}-${idx}-${i}`, text: o.text, isCorrect: o.key === ck || String.fromCharCode(65+i) === ck }));
        }
        quizService.addBankQuestion({
          courseCode: row.courseCode || 'PAI-301', topic: row.topic || 'Umum',
          type: row.type || 'PILIHAN_GANDA', difficulty: row.difficulty || 'SEDANG',
          questionText: row.questionText, arabicText: row.arabicText?.trim() || undefined,
          imageUrl: row.imageUrl?.trim() || undefined, options, correctShortAnswer: sa, essayRubric: er,
          defaultPoints: Number(row.defaultPoints) || 20, explanation: row.explanation,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        });
        sc++;
      } catch (err: any) { fc++; errors.push(`Baris #${idx+1}: ${err.message}`); }
    });
    toast.success('Berhasil', `${sc} soal berhasil diimpor.`);
    return { total: validRows.length, inserted: sc, updated: 0, skipped: fc, errors };
  };

  if (showCreatePage) {
    return (
      <QuizCreatePage
        onBack={() => setShowCreatePage(false)}
        onCreated={() => { setShowCreatePage(false); loadData(); }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ================================================================
          HEADER SECTION
          ================================================================ */}
      <div className="flex flex-col gap-4">
        {/* Title + Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
              📝 Kuis & Ujian Online
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              {isStudent
                ? 'Kerjakan kuis dan ujian CBT online dengan sistem anti-kecurangan'
                : 'Kelola kuis evaluasi, bank soal, dan antrean penilaian esai'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isLecturer && (
              <Button variant="outline" size="sm" icon={Upload} onClick={() => setShowImportModal(true)} className="text-xs">
                Impor Soal
              </Button>
            )}
            {isLecturer && onOpenBankSoal && (
              <Button variant="outline" size="sm" icon={BookOpen} onClick={onOpenBankSoal} className="text-xs">
                Bank Soal
              </Button>
            )}
            {isLecturer && onOpenGradingQueue && (
              <Button variant="outline" size="sm" icon={FileCheck} onClick={onOpenGradingQueue} className="text-xs">
                Penilaian
                {metrics.pendingGrading > 0 && (
                  <span style={{
                    marginLeft: '4px', padding: '1px 6px', borderRadius: '10px',
                    background: '#fbbf24', color: '#78350f', fontSize: '10px', fontWeight: 800
                  }}>
                    {metrics.pendingGrading}
                  </span>
                )}
              </Button>
            )}
            {isLecturer && (
              <Button 
                variant="primary" size="sm" icon={Plus} onClick={() => setShowCreatePage(true)}
                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                className="text-xs font-bold"
              >
                Buat Kuis
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Kuis</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>{metrics.total}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aktif</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>{metrics.published}</div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isStudent ? 'Selesai Dinilai' : 'Antrean Penilaian'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>
              {isStudent ? metrics.studentCompleted : metrics.pendingGrading}
            </div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Keamanan</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#065f46', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} style={{ color: '#059669' }} /> CBT Aktif
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SEARCH & FILTER BAR
          ================================================================ */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center',
        background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0'
      }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <Input
            placeholder="Cari judul kuis atau mata kuliah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: '0.8rem', borderRadius: '10px' }}
          />
        </div>
        {uniqueCourses.length > 0 && (
          <select className="form-select" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px', borderColor: '#e2e8f0', minWidth: '150px' }}>
            <option value="SEMUA">Semua Mata Kuliah</option>
            {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px', borderColor: '#e2e8f0', minWidth: '120px' }}>
          <option value="SEMUA">Semua Status</option>
          <option value="DITERBITKAN">Aktif</option>
          <option value="DRAF">Draf</option>
          <option value="SELESAI">Selesai</option>
        </select>
        {hasActiveFilters && (
          <button onClick={handleResetFilters}
            style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {/* ================================================================
          QUIZ CARDS
          ================================================================ */}
      {filteredQuizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <BookOpen size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', margin: 0 }}>Belum Ada Kuis</h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px', maxWidth: '360px', margin: '6px auto 0' }}>
            {hasActiveFilters ? 'Tidak ada kuis yang sesuai filter.' : 'Belum ada kuis yang dibuat.'}
          </p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {hasActiveFilters && <Button variant="secondary" size="sm" onClick={handleResetFilters}>Reset Filter</Button>}
            {isLecturer && <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowCreatePage(true)}>Buat Kuis</Button>}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedQuizzes.map((quiz) => {
            const studentAttempts = user ? quizService.getStudentAttempts(quiz.id, user.id) : [];
            const latestAttempt = studentAttempts[studentAttempts.length - 1];
            const hasOngoingAttempt = latestAttempt?.status === 'SEDANG_DIKERJAKAN';
            const attemptsLeft = quiz.maxAttempts - studentAttempts.length;
            const statusCfg = STATUS_CONFIG[quiz.status] || STATUS_CONFIG['DRAF'];

            return (
              <div
                key={quiz.id}
                style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px',
                  display: 'flex', flexDirection: 'column', transition: 'all 0.2s',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#059669'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                {/* Card Body */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Top: Meeting + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                      background: '#f0fdf4', color: '#065f46', padding: '3px 8px',
                      borderRadius: '6px', border: '1px solid #bbf7d0'
                    }}>
                      Pertemuan {quiz.meetingNumber}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                      background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Title + Course */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>
                      {quiz.title}
                    </h3>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#059669', marginTop: '4px' }}>
                      {quiz.courseName}
                    </p>
                  </div>

                  {/* Description */}
                  {quiz.description && (
                    <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      {quiz.description.length > 80 ? quiz.description.substring(0, 80) + '...' : quiz.description}
                    </p>
                  )}

                  {/* Info Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                    background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                      <Clock size={14} style={{ color: '#059669', flexShrink: 0 }} />
                      <span>{quiz.durationMinutes} Menit</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                      <HelpCircle size={14} style={{ color: '#059669', flexShrink: 0 }} />
                      <span>{quiz.questions.length} Soal</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                      <Award size={14} style={{ color: '#059669', flexShrink: 0 }} />
                      <span>KKM: <strong>{quiz.passingScore}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                      <RotateCcw size={14} style={{ color: '#059669', flexShrink: 0 }} />
                      <span>{quiz.maxAttempts}x ({Math.max(0, attemptsLeft)} sisa)</span>
                    </div>
                  </div>

                  {/* CBT Security Badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '11px', fontWeight: 600, color: '#065f46',
                    background: '#f0fdf4', padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1fae5'
                  }}>
                    <ShieldCheck size={13} style={{ color: '#059669' }} />
                    <span>CBT: Auto-Fullscreen & Kunci Tab</span>
                  </div>

                  {/* Latest Attempt Result (Student) */}
                  {latestAttempt && (
                    <div style={{
                      padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px'
                    }}>
                      <span style={{ color: '#94a3b8' }}>Percobaan #{latestAttempt.attemptNumber}</span>
                      {latestAttempt.status === 'DINILAI' ? (
                        <span style={{
                          fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                          background: latestAttempt.isPassed ? '#f0fdf4' : '#fef2f2',
                          color: latestAttempt.isPassed ? '#166534' : '#991b1b',
                          border: `1px solid ${latestAttempt.isPassed ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          Nilai: {latestAttempt.finalScore} ({latestAttempt.isPassed ? '✓ Lulus' : '✗ Belum'})
                        </span>
                      ) : latestAttempt.status === 'DIKUMPULKAN' ? (
                        <span style={{ fontWeight: 600, color: '#92400e', background: '#fefce8', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                          Menunggu Penilaian
                        </span>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1e40af', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                          Sedang Dikerjakan
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div style={{
                  padding: '14px 20px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'
                }}>
                  {/* Left action */}
                  {latestAttempt && latestAttempt.status !== 'SEDANG_DIKERJAKAN' ? (
                    <button
                      onClick={() => onViewResult(latestAttempt.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                        borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569'
                      }}
                    >
                      Lihat Hasil
                    </button>
                  ) : isLecturer ? (
                    <button
                      onClick={() => setDeletingQuiz(quiz)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                        borderRadius: '8px', border: '1px solid #fecaca', background: '#fff',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#dc2626'
                      }}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {hasOngoingAttempt ? 'Lanjutkan...' : 'Siap dikerjakan'}
                    </span>
                  )}

                  {/* Primary action */}
                  <button
                    onClick={() => onStartQuiz(quiz.id)}
                    disabled={isStudent && !hasOngoingAttempt && attemptsLeft <= 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                      borderRadius: '10px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 700, color: '#fff',
                      background: (isStudent && !hasOngoingAttempt && attemptsLeft <= 0)
                        ? '#d1d5db' 
                        : 'linear-gradient(135deg, #059669, #047857)',
                      opacity: (isStudent && !hasOngoingAttempt && attemptsLeft <= 0) ? 0.6 : 1,
                      transition: 'all 0.15s'
                    }}
                  >
                    {isLecturer
                      ? 'Pratinjau Ujian'
                      : hasOngoingAttempt
                        ? 'Lanjutkan Kuis'
                        : attemptsLeft > 0
                          ? 'Mulai Kuis'
                          : 'Kesempatan Habis'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================
          PAGINATION
          ================================================================ */}
      {filteredQuizzes.length > 0 && (
        <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredQuizzes.length}
            pageSize={pageSize}
            pageSizeOptions={[3, 6, 12, 24]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="kuis"
          />
        </div>
      )}

      {/* ================================================================
          MODAL: HAPUS KUIS
          ================================================================ */}
      {deletingQuiz && (
        <Modal isOpen={!!deletingQuiz} onClose={() => setDeletingQuiz(null)} title="Hapus Kuis?" maxWidth="460px">
          <div className="flex flex-col gap-4">
            <div style={{ padding: '14px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', fontSize: '13px', color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Trash2 size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <div>Kuis <strong>"{deletingQuiz.title}"</strong> akan dihapus secara permanen. Data percobaan mahasiswa akan diarsipkan.</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <Button variant="secondary" onClick={() => setDeletingQuiz(null)}>Batal</Button>
              <Button variant="primary" onClick={handleDeleteQuiz} style={{ background: '#dc2626', fontWeight: 700 }}>
                Ya, Hapus Kuis
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================================================================
          MODAL: IMPOR SOAL EXCEL
          ================================================================ */}
      {showImportModal && (
        <DataImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          schema={QUESTION_BANK_IMPORT_SCHEMA}
          onImport={handleBulkImportQuestions}
          customTitle="Impor Soal dari File Excel"
        />
      )}
    </div>
  );
};
