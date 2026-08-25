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
  GraduationCap,
  Award,
  Trash2
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Quiz, ImportQuestionInput, QuizAttempt } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/feedback/ToastContext';
import { KAMUS_UI } from '../../constants/dictionary';
import { DataImportModal, BulkImportResult } from '../../components/export-import';
import { QUESTION_BANK_IMPORT_SCHEMA } from '../../constants/exportImportSchemas';
import { QuizCreatePage } from './QuizCreatePage';

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Navigate to full-page create wizard
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Delete modal state
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);

  const isStudent = user?.role === 'mahasiswa';
  const isLecturer = user?.role === 'dosen' || user?.role === 'dosen_pa' || user?.role === 'administrator_sistem';

  const loadData = () => {
    const quizList = quizService.getQuizzes(undefined, isStudent);
    const attemptList = quizService.getAttempts();
    setQuizzes(quizList);
    setAttempts(attemptList);
  };

  useEffect(() => {
    loadData();
  }, [isStudent]);

  // Unique courses for filter
  const uniqueCourses = Array.from(new Set(quizzes.map(q => q.courseName))).filter(Boolean);

  // Auto reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCourse, filterStatus]);

  const hasActiveFilters = searchQuery !== '' || filterCourse !== 'SEMUA' || filterStatus !== 'SEMUA';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCourse('SEMUA');
    setFilterStatus('SEMUA');
    setCurrentPage(1);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = quizzes.length;
    const published = quizzes.filter(q => q.status === 'DITERBITKAN').length;
    const pendingGrading = attempts.filter(a => a.status === 'DIKUMPULKAN').length;
    const studentCompleted = attempts.filter(a => user && a.studentId === user.id && a.status === 'DINILAI').length;

    return {
      total,
      published,
      pendingGrading,
      studentCompleted
    };
  }, [quizzes, attempts, user]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const qTitle = (q.title || '').toLowerCase();
      const qCourse = (q.courseName || '').toLowerCase();
      const qDesc = (q.description || '').toLowerCase();
      const s = searchQuery.toLowerCase().trim();

      const matchesSearch = !s || qTitle.includes(s) || qCourse.includes(s) || qDesc.includes(s);
      const matchesCourse = filterCourse === 'SEMUA' || q.courseName === filterCourse;
      const matchesStatus = filterStatus === 'SEMUA' || q.status === filterStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [quizzes, searchQuery, filterCourse, filterStatus]);

  // Paginated Quizzes
  const totalPages = Math.ceil(filteredQuizzes.length / pageSize) || 1;
  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuizzes.slice(start, start + pageSize);
  }, [filteredQuizzes, currentPage, pageSize]);

  // Handle Delete Quiz
  const handleDeleteQuiz = () => {
    if (!deletingQuiz) return;
    try {
      const remaining = quizzes.filter(q => q.id !== deletingQuiz.id);
      quizService.saveQuizzes(remaining);
      setQuizzes(remaining);
      setDeletingQuiz(null);
      toast.success('Kuis Dihapus', `Kuis "${deletingQuiz.title}" berhasil dihapus.`);
    } catch (err: any) {
      toast.danger('Gagal Menghapus Kuis', err.message);
    }
  };

  // Bulk Import Questions Handler
  const handleBulkImportQuestions = async (validRows: ImportQuestionInput[]): Promise<BulkImportResult> => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    validRows.forEach((row, idx) => {
      try {
        let options: { id: string; text: string; isCorrect: boolean }[] | undefined;
        let shortAnswer: string | undefined;
        let essayRubric: string | undefined;
        const cleanKey = (row.correctKey || '').trim().toUpperCase();

        if (row.type === 'BENAR_SALAH') {
          options = [
            { id: `opt-imp-${Date.now()}-${idx}-1`, text: 'Benar', isCorrect: cleanKey === 'A' || cleanKey === 'BENAR' || cleanKey === 'TRUE' },
            { id: `opt-imp-${Date.now()}-${idx}-2`, text: 'Salah', isCorrect: cleanKey === 'B' || cleanKey === 'SALAH' || cleanKey === 'FALSE' },
          ];
        } else if (row.type === 'JAWABAN_SINGKAT') {
          shortAnswer = row.correctKey || row.optA || '';
        } else if (row.type === 'ESAI') {
          essayRubric = row.correctKey || row.explanation || 'Rubrik penilaian esai terstandar.';
        } else {
          const rawOpts = [
            { text: (row.optA || '').trim(), key: 'A' },
            { text: (row.optB || '').trim(), key: 'B' },
            { text: (row.optC || '').trim(), key: 'C' },
            { text: (row.optD || '').trim(), key: 'D' },
            { text: (row.optE || '').trim(), key: 'E' },
          ].filter((o) => o.text !== '');

          if (rawOpts.length < 2) {
            failedCount += 1;
            errors.push(`Baris #${idx + 1}: Soal pilihan ganda butuh minimal 2 opsi jawaban.`);
            return;
          }

          options = rawOpts.map((opt, oIdx) => ({
            id: `opt-imp-${Date.now()}-${idx}-${oIdx}`,
            text: opt.text,
            isCorrect: opt.key === cleanKey || opt.text.toUpperCase() === cleanKey || String.fromCharCode(65 + oIdx) === cleanKey
          }));
        }

        quizService.addBankQuestion({
          courseCode: row.courseCode || 'PAI-301',
          topic: row.topic || 'Topik Umum',
          type: row.type || 'PILIHAN_GANDA',
          difficulty: row.difficulty || 'SEDANG',
          questionText: row.questionText,
          arabicText: row.arabicText?.trim() || undefined,
          imageUrl: row.imageUrl?.trim() || undefined,
          options,
          correctShortAnswer: shortAnswer,
          essayRubric: essayRubric,
          defaultPoints: Number(row.defaultPoints) || 20,
          explanation: row.explanation,
          tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
        });

        successCount += 1;
      } catch (err: any) {
        failedCount += 1;
        errors.push(`Baris #${idx + 1}: ${err.message}`);
      }
    });

    toast.success('Impor Berhasil', `${successCount} butir soal baru berhasil diimpor ke Bank Soal.`);
    return {
      total: validRows.length,
      inserted: successCount,
      updated: 0,
      skipped: failedCount,
      errors
    };
  };

  // If showing create page, render it
  if (showCreatePage) {
    return (
      <QuizCreatePage
        onBack={() => setShowCreatePage(false)}
        onCreated={(_quizId) => {
          setShowCreatePage(false);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Top Hero Banner */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl"
        style={{ 
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm border border-emerald-400/30">
              <GraduationCap size={14} /> Evaluasi Akademik & CBT Online
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              {KAMUS_UI.KUIS_DARING} & Ujian Terstruktur
            </h1>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
              {isStudent 
                ? 'Evaluasi pemahaman pembelajaran daring dengan kuis berbatas waktu, CBT anti-kecurangan, dan pembahasan nilai terstruktur.'
                : 'Pusat pengelolaan kuis evaluasi berkala, bank soal kurikulum, CBT anti-curang, dan antrean penilaian esai.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            {isLecturer && (
              <Button 
                variant="primary" 
                size="sm"
                icon={Plus} 
                onClick={() => setShowCreatePage(true)}
                className="bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-bold border-0 shadow-lg text-xs"
              >
                Buat Kuis Baru
              </Button>
            )}
            {isLecturer && onOpenBankSoal && (
              <Button 
                variant="secondary" 
                size="sm"
                icon={BookOpen} 
                onClick={onOpenBankSoal}
                className="bg-white/15 text-white hover:bg-white/25 border border-white/20 text-xs"
              >
                Bank Soal Kurikulum
              </Button>
            )}
            {isLecturer && onOpenGradingQueue && (
              <Button 
                variant="outline" 
                size="sm"
                icon={FileCheck} 
                onClick={onOpenGradingQueue}
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 text-xs relative"
              >
                Antrean Penilaian
                {metrics.pendingGrading > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[10px] font-bold rounded-full">
                    {metrics.pendingGrading}
                  </span>
                )}
              </Button>
            )}
            {isLecturer && (
              <Button 
                variant="ghost" 
                size="sm"
                icon={Upload} 
                onClick={() => setShowImportModal(true)}
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20 text-xs"
              >
                Impor Excel
              </Button>
            )}
          </div>
        </div>

        {/* Quick Metrics Summary Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-600/40">
          <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
            <div className="text-xs text-emerald-200 font-medium">Total Kuis Terdaftar</div>
            <div className="text-2xl font-bold text-white mt-1">{metrics.total} <span className="text-xs font-normal text-emerald-300">Kuis</span></div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
            <div className="text-xs text-emerald-200 font-medium">Kuis Aktif / Diterbitkan</div>
            <div className="text-2xl font-bold text-white mt-1">{metrics.published} <span className="text-xs font-normal text-emerald-300">Aktif</span></div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
            <div className="text-xs text-emerald-200 font-medium">
              {isStudent ? 'Kuis Selesai Dinilai' : 'Antrean Penilaian Esai'}
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {isStudent ? metrics.studentCompleted : metrics.pendingGrading} <span className="text-xs font-normal text-emerald-300">{isStudent ? 'Selesai' : 'Berkas'}</span>
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
            <div className="text-xs text-emerald-200 font-medium">Proctoring Keamanan</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1 flex items-center gap-1.5 text-lg">
              <ShieldCheck size={20} className="text-emerald-400" /> CBT Aktif
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
          <Input
            placeholder="Cari judul kuis, mata kuliah, atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto items-center flex-wrap">
          {uniqueCourses.length > 0 && (
            <select
              className="form-select text-xs py-2 px-3 rounded-lg border-slate-300 bg-white"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="SEMUA">Semua Mata Kuliah</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <select
            className="form-select text-xs py-2 px-3 rounded-lg border-slate-300 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="SEMUA">Semua Status</option>
            <option value="DITERBITKAN">Diterbitkan (Aktif)</option>
            <option value="DRAF">Draf</option>
            <option value="SELESAI">Selesai</option>
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={handleResetFilters} className="text-xs text-red-600">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Tidak Ada Kuis Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Belum ada kuis yang sesuai dengan kata kunci atau filter pencarian Anda.
          </p>
          {isLecturer && (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowCreatePage(true)}>
                Buat Kuis Sekarang
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedQuizzes.map((quiz) => {
            const studentAttempts = user ? quizService.getStudentAttempts(quiz.id, user.id) : [];
            const latestAttempt = studentAttempts[studentAttempts.length - 1];
            const hasOngoingAttempt = latestAttempt?.status === 'SEDANG_DIKERJAKAN';
            const attemptsLeft = quiz.maxAttempts - studentAttempts.length;

            return (
              <div 
                key={quiz.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header Top */}
                <div className="p-5">
                  <div className="flex justify-between items-start gap-2 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold font-mono border border-emerald-200">
                      Pertemuan {quiz.meetingNumber}
                    </span>
                    <Badge variant={quiz.status === 'DITERBITKAN' ? 'success' : 'warning'}>
                      {quiz.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 leading-snug mb-1 line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-emerald-700 font-semibold mb-3">
                    {quiz.courseName}
                  </p>
                  
                  {quiz.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {quiz.description}
                    </p>
                  )}

                  {/* Badges Info Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-emerald-700 shrink-0" />
                      <span>{quiz.durationMinutes} Menit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-emerald-700 shrink-0" />
                      <span>{quiz.questions.length} Butir Soal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award size={14} className="text-emerald-700 shrink-0" />
                      <span>KKM: <strong>{quiz.passingScore}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-emerald-700 shrink-0" />
                      <span>Batas: {quiz.maxAttempts}x ({Math.max(0, attemptsLeft)} sisa)</span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <ShieldCheck size={13} className="text-emerald-700" />
                    <span>CBT Proctoring: Auto-Fullscreen & Kunci Tab</span>
                  </div>

                  {/* Status Riwayat Pengerjaan Terakhir Mahasiswa */}
                  {latestAttempt && (
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Percobaan #{latestAttempt.attemptNumber}:</span>
                        <Badge variant={latestAttempt.status === 'DINILAI' ? (latestAttempt.isPassed ? 'success' : 'danger') : 'warning'}>
                          {latestAttempt.status === 'DINILAI' 
                            ? `Nilai: ${latestAttempt.finalScore} (${latestAttempt.isPassed ? 'Lulus' : 'Belum Lulus'})` 
                            : latestAttempt.status === 'DIKUMPULKAN' ? 'Menunggu Nilai Esai' : 'Sedang Dikerjakan'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  {latestAttempt && latestAttempt.status !== 'SEDANG_DIKERJAKAN' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onViewResult(latestAttempt.id)}
                      className="text-xs"
                    >
                      Lihat Hasil
                    </Button>
                  ) : isLecturer ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setDeletingQuiz(quiz)}
                      className="text-xs text-red-600 hover:bg-red-50"
                      title="Hapus Kuis"
                    >
                      Hapus
                    </Button>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      {hasOngoingAttempt ? 'Lanjutkan...' : 'Siap dikerjakan'}
                    </span>
                  )}

                  <Button 
                    variant="primary" 
                    size="sm" 
                    icon={ArrowRight} 
                    iconPosition="right"
                    disabled={isStudent && !hasOngoingAttempt && attemptsLeft <= 0}
                    onClick={() => onStartQuiz(quiz.id)}
                    style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' }}
                    className="font-bold text-xs"
                  >
                    {isLecturer ? 'Pratinjau Ujian CBT' : hasOngoingAttempt ? 'Lanjutkan Kuis' : attemptsLeft > 0 ? 'Mulai Kuis' : 'Kesempatan Habis'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredQuizzes.length > 0 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredQuizzes.length}
            pageSize={pageSize}
            pageSizeOptions={[3, 6, 12, 24]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="kuis daring"
          />
        </div>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI HAPUS KUIS
          ========================================================================= */}
      {deletingQuiz && (
        <Modal
          isOpen={!!deletingQuiz}
          onClose={() => setDeletingQuiz(null)}
          title="Konfirmasi Hapus Kuis"
          maxWidth="460px"
        >
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-start gap-2.5">
              <Trash2 size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                Apakah Anda yakin ingin menghapus kuis <strong>"{deletingQuiz.title}"</strong>? Seluruh data percobaan ujian mahasiswa untuk kuis ini akan diarsipkan.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setDeletingQuiz(null)}>
                Batal
              </Button>
              <Button 
                variant="primary" 
                onClick={handleDeleteQuiz}
                className="bg-red-600 hover:bg-red-700 text-white font-bold border-0"
              >
                Hapus Kuis
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: IMPOR SOAL DARI EXCEL
          ========================================================================= */}
      {showImportModal && (
        <DataImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          schema={QUESTION_BANK_IMPORT_SCHEMA}
          onImport={handleBulkImportQuestions}
          customTitle="Impor Butir Soal CBT Terstandar Excel"
        />
      )}
    </div>
  );
};
