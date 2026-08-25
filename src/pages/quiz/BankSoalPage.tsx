import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  Search, 
  X, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  FileQuestion, 
  Image as ImageIcon, 
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { BankQuestion, QuestionType, QuestionDifficulty, ImportQuestionInput, QuizOption } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useToast } from '../../components/feedback/ToastContext';
import { ExportDropdown, DataImportModal, ExportConfig, BulkImportResult } from '../../components/export-import';
import { QUESTION_BANK_IMPORT_SCHEMA } from '../../constants/exportImportSchemas';
import { exportQuestionBankExcelTemplate } from '../../utils/excelUtils';

export interface BankSoalPageProps {
  onBack?: () => void;
}

export const COURSES_INFO: Record<string, { name: string; prodi: string; credits: number; semester: number }> = {
  'PAI-301': { name: 'Ushul Fiqih & Qawaid Fiqhiyyah', prodi: 'Pendidikan Agama Islam', credits: 3, semester: 3 },
  'PAI-204': { name: 'Ulumul Qur\'an & Tafsir Tematik', prodi: 'Pendidikan Agama Islam', credits: 3, semester: 2 },
  'PAI-205': { name: 'Ulumul Hadits & Kritik Sanad', prodi: 'Pendidikan Agama Islam', credits: 2, semester: 2 },
  'PAI-302': { name: 'Pengembangan Kurikulum PAI', prodi: 'Pendidikan Agama Islam', credits: 3, semester: 3 },
  'PAI-102': { name: 'Ilmu Pendidikan Islam', prodi: 'Pendidikan Agama Islam', credits: 3, semester: 1 },
  'TAR-204': { name: 'Sejarah Peradaban Islam', prodi: 'Fakultas Tarbiyah', credits: 2, semester: 2 },
  'TBI-201': { name: 'Bahasa Arab Komunikatif & Qira\'ah', prodi: 'Pendidikan Agama Islam', credits: 2, semester: 2 },
  'MPI-101': { name: 'Manajemen Pendidikan Islam', prodi: 'Manajemen Pendidikan Islam', credits: 3, semester: 1 },
  'EKS-201': { name: 'Fiqih Muamalah & Ekonomi Syariah', prodi: 'Ekonomi Syariah', credits: 3, semester: 2 },
};

// Helper: Tipe label yang mudah dibaca user
const TIPE_LABEL: Record<string, string> = {
  'PILIHAN_GANDA': 'Pilihan Ganda',
  'BENAR_SALAH': 'Benar / Salah',
  'JAWABAN_SINGKAT': 'Isian Singkat',
  'ESAI': 'Esai'
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'MUDAH': { label: 'Mudah', color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
  'SEDANG': { label: 'Sedang', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  'SULIT': { label: 'Sulit', color: '#991b1b', bg: '#fee2e2', border: '#fecaca' }
};

export const BankSoalPage: React.FC<BankSoalPageProps> = ({ onBack: _onBack }) => {
  const toast = useToast();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  // Search & Filter
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('SEMUA');
  const [filterDifficulty, setFilterDifficulty] = useState('SEMUA');
  
  // Modals
  const [editModal, setEditModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<BankQuestion | null>(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewingQuestion, setPreviewingQuestion] = useState<BankQuestion | null>(null);
  const [previewShowAnswer, setPreviewShowAnswer] = useState(false);
  const [importModal, setImportModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form states
  const [courseCode, setCourseCode] = useState('PAI-301');
  const [topic, setTopic] = useState('');
  const [qType, setQType] = useState<QuestionType>('PILIHAN_GANDA');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('SEDANG');
  const [questionText, setQuestionText] = useState('');
  const [arabicText, setArabicText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [points, setPoints] = useState(20);
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState('');
  const [optA, setOptA] = useState('');
  const [optAImage, setOptAImage] = useState('');
  const [optB, setOptB] = useState('');
  const [optBImage, setOptBImage] = useState('');
  const [optC, setOptC] = useState('');
  const [optCImage, setOptCImage] = useState('');
  const [optD, setOptD] = useState('');
  const [optDImage, setOptDImage] = useState('');
  const [optE, setOptE] = useState('');
  const [optEImage, setOptEImage] = useState('');
  const [correctOptIndex, setCorrectOptIndex] = useState(0);
  const [shortAnswer, setShortAnswer] = useState('');
  const [essayRubric, setEssayRubric] = useState('');

  const loadQuestions = () => {
    setQuestions(quizService.getBankQuestions());
  };

  useEffect(() => { loadQuestions(); }, []);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, filterDifficulty, selectedCourse]);

  const hasActiveFilters = searchQuery !== '' || filterType !== 'SEMUA' || filterDifficulty !== 'SEMUA';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('SEMUA');
    setFilterDifficulty('SEMUA');
    setCurrentPage(1);
  };

  // Upload handlers
  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('Ukuran Terlalu Besar', 'Maksimal 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { if (typeof ev.target?.result === 'string') { setImageUrl(ev.target.result); toast.success('Berhasil', 'Gambar soal berhasil diunggah.'); } };
    reader.readAsDataURL(file);
  };

  const handleOptionImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImg: (v: string) => void, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('Ukuran Terlalu Besar', 'Maksimal 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { if (typeof ev.target?.result === 'string') { setImg(ev.target.result); toast.success('Berhasil', `Gambar opsi ${label} berhasil diunggah.`); } };
    reader.readAsDataURL(file);
  };

  // Stats per course
  const courseStats = useMemo(() => {
    const stats: Record<string, { code: string; name: string; prodi: string; credits: number; semester: number; total: number; pg: number; bs: number; js: number; esai: number }> = {};
    Object.entries(COURSES_INFO).forEach(([code, info]) => {
      stats[code] = { code, name: info.name, prodi: info.prodi, credits: info.credits, semester: info.semester, total: 0, pg: 0, bs: 0, js: 0, esai: 0 };
    });
    questions.forEach((q) => {
      const code = q.courseCode || 'LAINNYA';
      if (!stats[code]) stats[code] = { code, name: 'Lainnya', prodi: '-', credits: 2, semester: 1, total: 0, pg: 0, bs: 0, js: 0, esai: 0 };
      stats[code].total += 1;
      if (q.type === 'PILIHAN_GANDA') stats[code].pg += 1;
      if (q.type === 'BENAR_SALAH') stats[code].bs += 1;
      if (q.type === 'JAWABAN_SINGKAT') stats[code].js += 1;
      if (q.type === 'ESAI') stats[code].esai += 1;
    });
    return stats;
  }, [questions]);

  const globalMetrics = useMemo(() => ({
    totalCourses: Object.keys(courseStats).length,
    totalQuestions: questions.length,
    objectiveCount: questions.filter(q => q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH').length,
    subjectiveCount: questions.filter(q => q.type === 'JAWABAN_SINGKAT' || q.type === 'ESAI').length,
  }), [questions, courseStats]);

  const filteredCourses = useMemo(() => {
    return Object.values(courseStats).filter(st => {
      const q = courseSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return st.code.toLowerCase().includes(q) || st.name.toLowerCase().includes(q) || st.prodi.toLowerCase().includes(q);
    });
  }, [courseStats, courseSearchQuery]);

  // Form handlers
  const handleOpenCreate = () => {
    setEditingQuestionId(null);
    setCourseCode(selectedCourse || 'PAI-301');
    setTopic(''); setQType('PILIHAN_GANDA'); setDifficulty('SEDANG');
    setQuestionText(''); setArabicText(''); setImageUrl(''); setPoints(20);
    setOptA(''); setOptAImage(''); setOptB(''); setOptBImage('');
    setOptC(''); setOptCImage(''); setOptD(''); setOptDImage('');
    setOptE(''); setOptEImage(''); setCorrectOptIndex(0);
    setShortAnswer(''); setEssayRubric(''); setExplanation(''); setTags('');
    setEditModal(true);
  };

  const handleOpenEdit = (q: BankQuestion) => {
    setEditingQuestionId(q.id);
    setCourseCode(q.courseCode || selectedCourse || 'PAI-301');
    setTopic(q.topic || ''); setQType(q.type || 'PILIHAN_GANDA');
    setDifficulty(q.difficulty || 'SEDANG'); setQuestionText(q.questionText || '');
    setArabicText(q.arabicText || ''); setImageUrl(q.imageUrl || '');
    setPoints(q.defaultPoints || 20); setExplanation(q.explanation || '');
    setTags((q.tags || []).join(', '));
    if (q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH') {
      const opts = q.options || [];
      setOptA(opts[0]?.text || ''); setOptAImage(opts[0]?.imageUrl || '');
      setOptB(opts[1]?.text || ''); setOptBImage(opts[1]?.imageUrl || '');
      setOptC(opts[2]?.text || ''); setOptCImage(opts[2]?.imageUrl || '');
      setOptD(opts[3]?.text || ''); setOptDImage(opts[3]?.imageUrl || '');
      setOptE(opts[4]?.text || ''); setOptEImage(opts[4]?.imageUrl || '');
      const ci = opts.findIndex(o => o.isCorrect);
      setCorrectOptIndex(ci >= 0 ? ci : 0);
    } else {
      setOptA(''); setOptAImage(''); setOptB(''); setOptBImage('');
      setOptC(''); setOptCImage(''); setOptD(''); setOptDImage('');
      setOptE(''); setOptEImage(''); setCorrectOptIndex(0);
    }
    setShortAnswer(q.correctShortAnswer || ''); setEssayRubric(q.essayRubric || '');
    setEditModal(true);
  };

  const handleOpenDelete = (q: BankQuestion) => { setDeletingQuestion(q); setDeleteConfirmModal(true); };

  const handleExecuteDelete = () => {
    if (!deletingQuestion) return;
    try {
      quizService.deleteBankQuestion(deletingQuestion.id);
      loadQuestions(); setDeleteConfirmModal(false); setDeletingQuestion(null);
      toast.success('Berhasil Dihapus', 'Soal telah dihapus dari Bank Soal.');
    } catch (err: any) { toast.danger('Gagal', err.message); }
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (points > 100) toast.warning('Peringatan', `Bobot (${points} poin) melebihi batas 100.`);
      if (points < 1) { toast.danger('Tidak Valid', 'Bobot minimal 1 poin.'); return; }

      let options: QuizOption[] | undefined;
      if (qType === 'BENAR_SALAH') {
        options = [
          { id: `opt-${Date.now()}-1`, text: 'Benar', isCorrect: correctOptIndex === 0 },
          { id: `opt-${Date.now()}-2`, text: 'Salah', isCorrect: correctOptIndex === 1 },
        ];
      } else if (qType === 'PILIHAN_GANDA') {
        const raw = [
          { id: `opt-${Date.now()}-1`, text: optA.trim(), imageUrl: optAImage.trim() || undefined, isCorrect: correctOptIndex === 0 },
          { id: `opt-${Date.now()}-2`, text: optB.trim(), imageUrl: optBImage.trim() || undefined, isCorrect: correctOptIndex === 1 },
          { id: `opt-${Date.now()}-3`, text: optC.trim(), imageUrl: optCImage.trim() || undefined, isCorrect: correctOptIndex === 2 },
          { id: `opt-${Date.now()}-4`, text: optD.trim(), imageUrl: optDImage.trim() || undefined, isCorrect: correctOptIndex === 3 },
          { id: `opt-${Date.now()}-5`, text: optE.trim(), imageUrl: optEImage.trim() || undefined, isCorrect: correctOptIndex === 4 },
        ].filter(o => o.text !== '' || !!o.imageUrl);
        const mapped = raw.map((o, i) => ({ ...o, text: o.text || `Pilihan ${String.fromCharCode(65+i)}` }));
        if (mapped.length < 2) { toast.warning('Opsi Kurang', 'Minimal 2 opsi jawaban.'); return; }
        options = mapped;
      }

      const payload = {
        courseCode, topic: topic.trim() || 'Umum', type: qType, difficulty,
        questionText: questionText.trim(), arabicText: arabicText.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined, options,
        correctShortAnswer: qType === 'JAWABAN_SINGKAT' ? shortAnswer.trim() : undefined,
        essayRubric: qType === 'ESAI' ? essayRubric.trim() : undefined,
        defaultPoints: points, explanation: explanation.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingQuestionId) {
        quizService.updateBankQuestion(editingQuestionId, payload);
        toast.success('Diperbarui', 'Perubahan soal berhasil disimpan.');
      } else {
        quizService.addBankQuestion(payload);
        toast.success('Ditambahkan', 'Soal baru berhasil disimpan ke Bank Soal.');
      }
      loadQuestions(); setEditModal(false); setEditingQuestionId(null);
    } catch (err: any) { toast.danger('Gagal', err.message); }
  };

  // Bulk Import
  const handleBulkImportQuestions = async (validRows: ImportQuestionInput[]): Promise<BulkImportResult> => {
    let successCount = 0, failedCount = 0;
    const errors: string[] = [];
    validRows.forEach((row, idx) => {
      try {
        let options: QuizOption[] | undefined;
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
            { text: (row.optA||'').trim(), imageUrl: row.optAImage?.trim()||undefined, key: 'A' },
            { text: (row.optB||'').trim(), imageUrl: row.optBImage?.trim()||undefined, key: 'B' },
            { text: (row.optC||'').trim(), imageUrl: row.optCImage?.trim()||undefined, key: 'C' },
            { text: (row.optD||'').trim(), imageUrl: row.optDImage?.trim()||undefined, key: 'D' },
            { text: (row.optE||'').trim(), imageUrl: row.optEImage?.trim()||undefined, key: 'E' },
          ].filter(o => o.text !== '' || !!o.imageUrl);
          if (ro.length < 2) { failedCount++; errors.push(`Baris #${idx+1}: Minimal 2 opsi.`); return; }
          options = ro.map((o, i) => ({
            id: `oi-${Date.now()}-${idx}-${i}`, text: o.text || `Pilihan ${String.fromCharCode(65+i)}`,
            imageUrl: o.imageUrl, isCorrect: o.key === ck || String.fromCharCode(65+i) === ck
          }));
        }
        quizService.addBankQuestion({
          courseCode: row.courseCode || selectedCourse || 'PAI-301',
          topic: row.topic || 'Materi Pokok', type: row.type || 'PILIHAN_GANDA',
          difficulty: row.difficulty || 'SEDANG', questionText: row.questionText,
          arabicText: row.arabicText?.trim() || undefined, imageUrl: row.imageUrl?.trim() || undefined,
          options, correctShortAnswer: sa, essayRubric: er,
          defaultPoints: Number(row.defaultPoints) || 20, explanation: row.explanation,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : ['Impor']
        });
        successCount++;
      } catch (err: any) { failedCount++; errors.push(`Baris #${idx+1}: ${err.message}`); }
    });
    loadQuestions();
    return { total: validRows.length, inserted: successCount, updated: 0, skipped: failedCount, errors };
  };

  // Filtered questions (Level 2)
  const filteredQuestions = useMemo(() => {
    if (!selectedCourse) return [];
    return questions.filter(q => {
      const mc = (q.courseCode || 'PAI-301') === selectedCourse;
      const s = searchQuery.toLowerCase().trim();
      const ms = !s || (q.questionText||'').toLowerCase().includes(s) || (q.topic||'').toLowerCase().includes(s) || (q.tags||[]).some(t => (t||'').toLowerCase().includes(s));
      const mt = filterType === 'SEMUA' || q.type === filterType;
      const md = filterDifficulty === 'SEMUA' || q.difficulty === filterDifficulty;
      return mc && ms && mt && md;
    });
  }, [questions, searchQuery, filterType, filterDifficulty, selectedCourse]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const activeCourseInfo = selectedCourse ? (COURSES_INFO[selectedCourse] || { name: 'Mata Kuliah Pilihan', prodi: '-', credits: 3, semester: 1 }) : null;
  const activeCourseStats = selectedCourse ? courseStats[selectedCourse] : null;

  // Export config
  const bankQuestionExportConfig: ExportConfig<BankQuestion> = useMemo(() => ({
    filename: `SALAM_Bank_Soal_${selectedCourse || 'Semua'}`,
    title: `BANK SOAL — ${selectedCourse ? `${activeCourseInfo?.name} (${selectedCourse})` : 'SEMUA MATA KULIAH'}`,
    subtitle: 'STAI Al-Ittihad Cianjur',
    data: filteredQuestions,
    columns: [
      { key: 'courseCode', header: 'Kode MK', width: '90px' },
      { key: 'topic', header: 'Topik', width: '160px' },
      { key: 'type', header: 'Tipe', width: '120px' },
      { key: 'difficulty', header: 'Level', width: '80px', align: 'center' },
      { key: 'questionText', header: 'Pertanyaan', width: '280px' },
      { key: 'arabicText', header: 'Teks Arab', width: '200px', format: (v: any) => v || '-' },
      { key: 'imageUrl', header: 'Gambar', width: '100px', format: (v: any) => v ? '✓ Ada' : '-' },
      { key: 'defaultPoints', header: 'Poin', width: '60px', align: 'center' },
      { key: 'options', header: 'Kunci', width: '180px',
        format: (_: any, q: BankQuestion) => {
          if (q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH') {
            const ci = (q.options||[]).findIndex(o => o.isCorrect);
            const co = (q.options||[]).find(o => o.isCorrect);
            if (ci >= 0 && co) return `[${String.fromCharCode(65+ci)}] ${co.text}`;
            return '-';
          }
          if (q.type === 'JAWABAN_SINGKAT') return q.correctShortAnswer || '-';
          return 'Rubrik';
        }
      },
      { key: 'explanation', header: 'Pembahasan', width: '200px', format: (v: any) => v || '-' }
    ],
    metadata: {
      'Total Soal': `${filteredQuestions.length}`,
      'Mata Kuliah': selectedCourse ? `${selectedCourse} - ${activeCourseInfo?.name}` : 'Semua',
      'Tanggal': new Date().toLocaleString('id-ID')
    }
  }), [filteredQuestions, selectedCourse, activeCourseInfo]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ================================================================
          LEVEL 1: KATALOG MATA KULIAH
          ================================================================ */}
      {!selectedCourse ? (
        <div className="flex flex-col gap-5">

          {/* === HEADER SECTION === */}
          <div className="flex flex-col gap-4">
            {/* Title Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
                  Bank Soal & Materi Evaluasi
                </h1>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  Pusat repositori butir soal terstandarisasi, bank teks Arab, dan rubrik evaluasi
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" icon={Download} onClick={exportQuestionBankExcelTemplate} className="text-xs">
                  Template Excel
                </Button>
                <Button variant="outline" size="sm" icon={Upload} onClick={() => setImportModal(true)} className="text-xs">
                  Impor Soal
                </Button>
                <Button 
                  variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}
                  style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                  className="text-xs font-bold"
                >
                  Tambah Soal Baru
                </Button>
              </div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mata Kuliah</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{globalMetrics.totalCourses}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Tersedia di Kurikulum</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Butir Soal</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>{globalMetrics.totalQuestions}</div>
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>Terverifikasi di Bank</div>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soal Objektif</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>{globalMetrics.objectiveCount}</div>
                <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '2px' }}>PG & Benar/Salah</div>
              </div>
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soal Subjektif</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>{globalMetrics.subjectiveCount}</div>
                <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>Isian Singkat & Esai</div>
              </div>
            </div>
          </div>

          {/* === SEARCH BAR === */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <Input
              placeholder="Cari mata kuliah... (contoh: Ushul Fiqih, PAI-301, Hadits, Tarbiyah)"
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px', fontSize: '0.85rem', borderRadius: '12px', height: '44px' }}
            />
          </div>

          {/* === COURSE CARDS GRID === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((st) => (
              <div
                key={st.code}
                onClick={() => setSelectedCourse(st.code)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '180px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#059669';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.12)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                {/* Card Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 800, fontFamily: 'monospace',
                    background: '#f0fdf4', color: '#065f46', padding: '4px 10px',
                    borderRadius: '8px', border: '1px solid #bbf7d0'
                  }}>
                    {st.code}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    background: '#f1f5f9', color: '#475569', padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {st.credits} SKS
                  </span>
                </div>

                {/* Course Name */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>
                    {st.name}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {st.prodi} • Semester {st.semester}
                  </p>
                </div>

                {/* Stats Row */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {st.pg > 0 && <span style={{ fontSize: '10px', fontWeight: 600, background: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>PG {st.pg}</span>}
                    {st.bs > 0 && <span style={{ fontSize: '10px', fontWeight: 600, background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>B/S {st.bs}</span>}
                    {st.js > 0 && <span style={{ fontSize: '10px', fontWeight: 600, background: '#fefce8', color: '#92400e', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>Isian {st.js}</span>}
                    {st.esai > 0 && <span style={{ fontSize: '10px', fontWeight: 600, background: '#fef2f2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca' }}>Esai {st.esai}</span>}
                    {st.total === 0 && <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>Belum ada soal</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                    <span>{st.total} Soal</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', margin: 0 }}>Tidak Ditemukan</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                Mata kuliah dengan kata kunci "{courseSearchQuery}" tidak ditemukan.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setCourseSearchQuery('')} style={{ marginTop: '12px' }}>
                Reset Pencarian
              </Button>
            </div>
          )}
        </div>
      ) : (

        /* ================================================================
            LEVEL 2: DAFTAR SOAL PER MATA KULIAH
            ================================================================ */
        <div className="flex flex-col gap-5">

          {/* === HEADER === */}
          <div className="flex flex-col gap-3">
            {/* Back + Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCourse(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                  background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  color: '#475569', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
              >
                <ArrowLeft size={16} /> Kembali ke Katalog
              </button>
              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Bank Soal</span>
                <ChevronRight size={12} />
                <span style={{ fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{selectedCourse}</span>
              </div>
            </div>

            {/* Course Info Hero Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
              borderRadius: '20px', padding: '24px 28px', color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.25)',
              display: 'flex', flexDirection: 'column', gap: '14px'
            }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
                      {selectedCourse}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                      {activeCourseInfo?.credits} SKS • Semester {activeCourseInfo?.semester} • {activeCourseInfo?.prodi}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{activeCourseInfo?.name}</h2>
                </div>

                {/* Quick Counters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total Soal', value: activeCourseStats?.total || 0 },
                    { label: 'PG', value: activeCourseStats?.pg || 0 },
                    { label: 'B/S', value: activeCourseStats?.bs || 0 },
                    { label: 'Isian', value: activeCourseStats?.js || 0 },
                    { label: 'Esai', value: activeCourseStats?.esai || 0 },
                  ].map(c => (
                    <div key={c.label} style={{
                      background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '12px',
                      padding: '8px 14px', textAlign: 'center', minWidth: '60px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>{c.label}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2 flex-wrap items-center">
              <Button variant="outline" size="sm" icon={Download} onClick={exportQuestionBankExcelTemplate} className="text-xs">Template Excel</Button>
              <Button variant="outline" size="sm" icon={Upload} onClick={() => setImportModal(true)} className="text-xs">Impor Soal</Button>
              <ExportDropdown config={bankQuestionExportConfig} buttonLabel="Ekspor Soal" />
              <div style={{ flex: 1 }} />
              <Button 
                variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}
                style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                className="text-xs font-bold"
              >
                Tambah Soal Baru
              </Button>
            </div>
          </div>

          {/* === FILTER BAR === */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center',
            background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <Input
                placeholder="Cari teks soal, topik materi, atau kata kunci tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '0.8rem', borderRadius: '10px' }}
              />
            </div>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px', borderColor: '#e2e8f0', minWidth: '140px' }}
            >
              <option value="SEMUA">Semua Tipe Soal</option>
              <option value="PILIHAN_GANDA">Pilihan Ganda</option>
              <option value="BENAR_SALAH">Benar / Salah</option>
              <option value="JAWABAN_SINGKAT">Isian Singkat</option>
              <option value="ESAI">Esai / Uraian</option>
            </select>
            <select
              className="form-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px', borderColor: '#e2e8f0', minWidth: '130px' }}
            >
              <option value="SEMUA">Semua Tingkat</option>
              <option value="MUDAH">Mudah</option>
              <option value="SEDANG">Sedang</option>
              <option value="SULIT">Sulit</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={14} /> Reset Filter
              </button>
            )}
          </div>

          {/* === QUESTIONS LIST === */}
          {paginatedQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <FileQuestion size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', margin: 0 }}>Belum Ada Butir Soal</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px', maxWidth: '360px', margin: '6px auto 0' }}>
                {hasActiveFilters ? 'Tidak ada soal yang sesuai dengan kriteria filter. Coba ubah kata kunci pencarian.' : 'Mata kuliah ini belum memiliki butir soal. Mulai tambahkan soal atau impor dari Excel.'}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {hasActiveFilters && <Button variant="secondary" size="sm" onClick={handleResetFilters}>Reset Filter</Button>}
                <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>Tambah Soal Sekarang</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paginatedQuestions.map((q, idx) => {
                const qNum = (currentPage - 1) * pageSize + idx + 1;
                const correctIdx = (q.options || []).findIndex(o => o.isCorrect);
                const correctOpt = (q.options || []).find(o => o.isCorrect);
                const hasOptImages = (q.options || []).some(o => !!o.imageUrl);
                const diffCfg = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG['SEDANG'];
                const typeLabel = TIPE_LABEL[q.type] || q.type;

                return (
                  <div
                    key={q.id}
                    style={{
                      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px',
                      padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '12px',
                      transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#059669'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.08)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'; }}
                  >
                    {/* Row 1: Number + Badges + Points */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          width: '30px', height: '30px', borderRadius: '10px',
                          background: '#f0fdf4', color: '#065f46', fontWeight: 800,
                          fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid #bbf7d0', flexShrink: 0
                        }}>
                          {qNum}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                          borderRadius: '6px', background: '#f1f5f9', color: '#475569'
                        }}>
                          {typeLabel}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                          borderRadius: '6px', background: diffCfg.bg, color: diffCfg.color, border: `1px solid ${diffCfg.border}`
                        }}>
                          {diffCfg.label}
                        </span>
                        {q.imageUrl && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#065f46', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ImageIcon size={11} /> Gambar
                          </span>
                        )}
                        {hasOptImages && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ImageIcon size={11} /> Opsi Gambar
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: 800, color: '#065f46',
                        background: '#f0fdf4', padding: '4px 12px', borderRadius: '8px',
                        border: '1px solid #bbf7d0'
                      }}>
                        {q.defaultPoints} Poin
                      </span>
                    </div>

                    {/* Row 2: Question Text */}
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.6 }}>
                      {q.questionText}
                    </div>

                    {/* Arabic text */}
                    {q.arabicText && (
                      <div style={{
                        fontFamily: "'Amiri', 'Traditional Arabic', serif",
                        fontSize: '1.25rem', color: '#065f46', direction: 'rtl', textAlign: 'right',
                        lineHeight: 1.9, background: '#f0fdf4', padding: '12px 16px',
                        borderRadius: '12px', borderRight: '4px solid #059669', border: '1px solid #bbf7d0'
                      }}>
                        {q.arabicText}
                      </div>
                    )}

                    {/* Question image */}
                    {q.imageUrl && (
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', padding: '8px', maxHeight: '180px' }}>
                        <img src={q.imageUrl} alt="Ilustrasi soal" style={{ maxHeight: '164px', objectFit: 'contain', borderRadius: '8px' }} />
                      </div>
                    )}

                    {/* Row 3: Topic + Answer Key */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Topik: <strong style={{ color: '#334155' }}>{q.topic}</strong>
                        </span>
                        {(q.tags || []).slice(0, 3).map((t, ti) => (
                          <span key={ti} style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>#{t}</span>
                        ))}
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                        borderRadius: '8px', background: '#f0fdf4', color: '#065f46', border: '1px solid #d1fae5'
                      }}>
                        {(q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH') ? (
                          <span>Kunci: <strong>[{String.fromCharCode(65 + (correctIdx >= 0 ? correctIdx : 0))}]</strong> {correctOpt?.text ? ` ${correctOpt.text.substring(0, 32)}${correctOpt.text.length > 32 ? '...' : ''}` : ''}</span>
                        ) : q.type === 'JAWABAN_SINGKAT' ? (
                          <span>Kunci: <strong style={{ fontFamily: 'monospace' }}>{q.correctShortAnswer}</strong></span>
                        ) : (
                          <span style={{ color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>Rubrik Penilaian Dosen</span>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <button
                        onClick={() => { setPreviewingQuestion(q); setPreviewShowAnswer(false); setPreviewModal(true); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                          borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                      >
                        <Eye size={14} /> Pratinjau
                      </button>
                      <button
                        onClick={() => handleOpenEdit(q)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                          borderRadius: '8px', border: '1px solid #d1fae5', background: '#f0fdf4',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#065f46',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#dcfce7'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleOpenDelete(q)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                          borderRadius: '8px', border: '1px solid #fecaca', background: '#fff',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#dc2626',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {filteredQuestions.length > 0 && (
            <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredQuestions.length}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="butir soal"
              />
            </div>
          )}
        </div>
      )}


      {/* ================================================================
          MODAL: PRATINJAU SOAL INTERAKTIF
          ================================================================ */}
      {previewModal && previewingQuestion && (
        <Modal isOpen={previewModal} onClose={() => setPreviewModal(false)} title="👁️ Pratinjau Lembar Soal" maxWidth="660px">
          <div className="flex flex-col gap-4">
            {/* Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', background: '#f0fdf4', color: '#065f46', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  {previewingQuestion.courseCode}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
                  {TIPE_LABEL[previewingQuestion.type] || previewingQuestion.type}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                  ...(DIFFICULTY_CONFIG[previewingQuestion.difficulty] ? {
                    background: DIFFICULTY_CONFIG[previewingQuestion.difficulty].bg,
                    color: DIFFICULTY_CONFIG[previewingQuestion.difficulty].color,
                    border: `1px solid ${DIFFICULTY_CONFIG[previewingQuestion.difficulty].border}`
                  } : {})
                }}>
                  {DIFFICULTY_CONFIG[previewingQuestion.difficulty]?.label || previewingQuestion.difficulty}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#065f46', background: '#f0fdf4', padding: '4px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                {previewingQuestion.defaultPoints} Poin
              </span>
            </div>

            {/* Question Text */}
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.6 }}>
              {previewingQuestion.questionText}
            </div>

            {/* Arabic */}
            {previewingQuestion.arabicText && (
              <div style={{
                fontFamily: "'Amiri', 'Traditional Arabic', serif", fontSize: '1.3rem',
                color: '#065f46', direction: 'rtl', textAlign: 'right', lineHeight: 1.9,
                background: '#f0fdf4', padding: '14px 18px', borderRadius: '12px', borderRight: '4px solid #059669', border: '1px solid #bbf7d0'
              }}>
                {previewingQuestion.arabicText}
              </div>
            )}

            {/* Image */}
            {previewingQuestion.imageUrl && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', padding: '10px', maxHeight: '240px' }}>
                <img src={previewingQuestion.imageUrl} alt="Ilustrasi" style={{ maxHeight: '220px', objectFit: 'contain', borderRadius: '8px' }}
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
            )}

            {/* Options */}
            {(previewingQuestion.type === 'PILIHAN_GANDA' || previewingQuestion.type === 'BENAR_SALAH') && previewingQuestion.options && (
              <div className="flex flex-col gap-2">
                {previewingQuestion.options.map((opt, oIdx) => (
                  <div
                    key={opt.id || oIdx}
                    style={{
                      padding: '12px 14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
                      border: `1.5px solid ${previewShowAnswer && opt.isCorrect ? '#059669' : '#e2e8f0'}`,
                      background: previewShowAnswer && opt.isCorrect ? '#f0fdf4' : '#fff',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 800,
                        background: previewShowAnswer && opt.isCorrect ? '#059669' : '#f1f5f9',
                        color: previewShowAnswer && opt.isCorrect ? '#fff' : '#475569'
                      }}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span style={{ fontSize: '0.9rem', paddingTop: '3px', flex: 1, color: '#1e293b' }}>{opt.text}</span>
                      {previewShowAnswer && opt.isCorrect && <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />}
                    </div>
                    {opt.imageUrl && (
                      <div style={{ marginLeft: '38px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', padding: '6px', maxWidth: '280px', maxHeight: '160px' }}>
                        <img src={opt.imageUrl} alt={`Opsi ${String.fromCharCode(65 + oIdx)}`} style={{ maxHeight: '148px', objectFit: 'contain', borderRadius: '6px' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Short Answer */}
            {previewingQuestion.type === 'JAWABAN_SINGKAT' && (
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Kunci Jawaban:</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace', color: '#065f46', background: '#fff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bbf7d0', width: 'fit-content' }}>
                  {previewShowAnswer ? previewingQuestion.correctShortAnswer : '••••••••'}
                </div>
              </div>
            )}

            {/* Essay */}
            {previewingQuestion.type === 'ESAI' && (
              <div style={{ padding: '12px 16px', background: '#fefce8', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>Rubrik Penilaian:</div>
                <p style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: 1.6, margin: 0 }}>
                  {previewingQuestion.essayRubric || 'Tidak ada rubrik khusus.'}
                </p>
              </div>
            )}

            {/* Explanation */}
            {previewShowAnswer && previewingQuestion.explanation && (
              <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>Pembahasan:</div>
                <p style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: 1.6, margin: 0 }}>{previewingQuestion.explanation}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '4px' }}>
              <button
                onClick={() => setPreviewShowAnswer(!previewShowAnswer)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: 700, color: '#059669',
                  background: 'none', border: 'none', cursor: 'pointer'
                }}
              >
                {previewShowAnswer ? 'Sembunyikan Kunci' : 'Tampilkan Kunci & Pembahasan'}
              </button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={Edit}
                  onClick={() => { setPreviewModal(false); handleOpenEdit(previewingQuestion); }}>
                  Edit Soal
                </Button>
                <Button variant="primary" size="sm" onClick={() => setPreviewModal(false)}
                  style={{ background: '#059669' }}>Tutup</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}


      {/* ================================================================
          MODAL: HAPUS SOAL
          ================================================================ */}
      {deleteConfirmModal && deletingQuestion && (
        <Modal isOpen={deleteConfirmModal} onClose={() => setDeleteConfirmModal(false)} title="Hapus Soal?" maxWidth="460px">
          <div className="flex flex-col gap-4">
            <div style={{ padding: '14px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', fontSize: '13px', color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Trash2 size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <div>Soal ini akan dihapus <strong>secara permanen</strong> dari Bank Soal.</div>
            </div>
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>{deletingQuestion.courseCode} • {TIPE_LABEL[deletingQuestion.type]}</div>
              <p style={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.4, margin: 0 }}>"{deletingQuestion.questionText}"</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <Button variant="secondary" onClick={() => setDeleteConfirmModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleExecuteDelete}
                style={{ background: '#dc2626', fontWeight: 700 }}>
                Ya, Hapus Soal
              </Button>
            </div>
          </div>
        </Modal>
      )}


      {/* ================================================================
          MODAL: TAMBAH / EDIT SOAL
          ================================================================ */}
      {editModal && (
        <Modal isOpen={editModal} onClose={() => setEditModal(false)}
          title={editingQuestionId ? 'Edit Butir Soal' : 'Tambah Soal ke Bank Soal'} maxWidth="720px">
          <form onSubmit={handleSaveQuestion} className="flex flex-col gap-4">
            {/* Row: Mata Kuliah + Topik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Mata Kuliah</label>
                <select className="form-select" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required
                  style={{ fontSize: '13px', borderRadius: '10px' }}>
                  {Object.entries(COURSES_INFO).map(([code, info]) => (
                    <option key={code} value={code}>{code} — {info.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Topik / Materi Pokok</label>
                <Input required placeholder="contoh: Kaidah Fiqhiyyah" value={topic} onChange={(e) => setTopic(e.target.value)} style={{ fontSize: '13px', borderRadius: '10px' }} />
              </div>
            </div>

            {/* Row: Tipe + Level + Poin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Tipe Soal</label>
                <select className="form-select" value={qType} onChange={(e) => setQType(e.target.value as QuestionType)}
                  style={{ fontSize: '13px', borderRadius: '10px' }}>
                  <option value="PILIHAN_GANDA">Pilihan Ganda (A-E)</option>
                  <option value="BENAR_SALAH">Benar / Salah</option>
                  <option value="JAWABAN_SINGKAT">Isian Singkat</option>
                  <option value="ESAI">Esai (Uraian)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Tingkat Kesulitan</label>
                <select className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  style={{ fontSize: '13px', borderRadius: '10px' }}>
                  <option value="MUDAH">Mudah</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="SULIT">Sulit</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Bobot Poin Standar</label>
                <Input type="number" min={1} max={100} required value={points} onChange={(e) => setPoints(Number(e.target.value) || 0)} style={{ fontSize: '13px', borderRadius: '10px' }} />
              </div>
            </div>

            {/* Pertanyaan */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Teks Pertanyaan</label>
              <textarea className="form-textarea" rows={3} required placeholder="Tuliskan butir soal secara lengkap dan terstruktur..."
                value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                style={{ fontSize: '13px', borderRadius: '10px' }} />
            </div>

            {/* Teks Arab */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Teks Arab / Matan / Hadits / Ayat <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opsional)</span></label>
              <textarea className="form-textarea" rows={2} placeholder="اكتب النص العربي أو متن الحديث / القاعدة هنا..." dir="rtl"
                style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", fontSize: '1.15rem', color: '#065f46', borderRadius: '10px' }}
                value={arabicText} onChange={(e) => setArabicText(e.target.value)} />
            </div>

            {/* Upload Gambar Soal */}
            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <ImageIcon size={14} style={{ color: '#059669' }} /> Gambar Pendukung Soal <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opsional)</span>
                </label>
                {imageUrl && (
                  <button type="button" onClick={() => setImageUrl('')} style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
              </div>
              {imageUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '10px' }}>
                  <img src={imageUrl} alt="Preview" style={{ maxHeight: '180px', objectFit: 'contain', borderRadius: '8px' }} />
                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    <Input placeholder="URL gambar..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ fontSize: '12px', flex: 1, borderRadius: '8px' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                      <Upload size={13} /> Ganti
                      <input type="file" accept="image/*" className="hidden" onChange={handleQuestionImageUpload} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    <Upload size={14} style={{ color: '#059669' }} /> Unggah Berkas
                    <input type="file" accept="image/*" className="hidden" onChange={handleQuestionImageUpload} />
                  </label>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>atau</span>
                  <Input placeholder="Tempel URL tautan gambar..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ fontSize: '12px', flex: 1, borderRadius: '8px', minWidth: '180px' }} />
                </div>
              )}
            </div>

            {/* Opsi Pilihan Ganda A-E */}
            {qType === 'PILIHAN_GANDA' && (
              <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', margin: 0 }}>Opsi Jawaban (A–E)</label>
                  <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600, background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                    Pilih radio untuk kunci jawaban benar
                  </span>
                </div>
                {[
                  { label: 'A', val: optA, setVal: setOptA, img: optAImage, setImg: setOptAImage },
                  { label: 'B', val: optB, setVal: setOptB, img: optBImage, setImg: setOptBImage },
                  { label: 'C', val: optC, setVal: setOptC, img: optCImage, setImg: setOptCImage },
                  { label: 'D', val: optD, setVal: setOptD, img: optDImage, setImg: setOptDImage },
                  { label: 'E', val: optE, setVal: setOptE, img: optEImage, setImg: setOptEImage },
                ].map((item, idx) => (
                  <div key={item.label} style={{
                    padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '6px',
                    border: `1.5px solid ${correctOptIndex === idx ? '#059669' : '#e2e8f0'}`,
                    background: correctOptIndex === idx ? '#f0fdf4' : '#fff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="radio" name="correctOpt" checked={correctOptIndex === idx} onChange={() => setCorrectOptIndex(idx)}
                        style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{
                        width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 800, flexShrink: 0,
                        background: correctOptIndex === idx ? '#059669' : '#f1f5f9',
                        color: correctOptIndex === idx ? '#fff' : '#475569'
                      }}>{item.label}</span>
                      <Input placeholder={`Teks opsi ${item.label}`} value={item.val} onChange={(e) => item.setVal(e.target.value)}
                        style={{ fontSize: '13px', flex: 1, borderRadius: '8px', borderColor: correctOptIndex === idx ? '#059669' : undefined }} />
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, flexShrink: 0,
                        border: `1px solid ${item.img ? '#bbf7d0' : '#e2e8f0'}`,
                        background: item.img ? '#f0fdf4' : '#fff', color: item.img ? '#065f46' : '#64748b'
                      }}>
                        <ImageIcon size={13} /> <span className="hidden sm:inline">{item.img ? '✓ Gambar' : '+ Gambar'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleOptionImageUpload(e, item.setImg, item.label)} />
                      </label>
                    </div>
                    {item.img && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginLeft: '52px', padding: '6px 8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={item.img} alt={`Opsi ${item.label}`} style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff' }} />
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Gambar ilustrasi opsi {item.label} aktif</span>
                        </div>
                        <button type="button" onClick={() => item.setImg('')}
                          style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Benar / Salah */}
            {qType === 'BENAR_SALAH' && (
              <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '10px' }}>Kunci Jawaban yang Benar</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['Benar', 'Salah'].map((opt, li) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <input type="radio" name="correctBS" checked={correctOptIndex === li} onChange={() => setCorrectOptIndex(li)}
                        style={{ width: '18px', height: '18px', accentColor: '#059669' }} />
                      <span style={{ fontWeight: correctOptIndex === li ? 700 : 400, color: correctOptIndex === li ? '#065f46' : '#475569' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Jawaban Singkat */}
            {qType === 'JAWABAN_SINGKAT' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Kunci Jawaban Singkat</label>
                <Input required placeholder="Kata kunci jawaban yang tepat" value={shortAnswer} onChange={(e) => setShortAnswer(e.target.value)} style={{ fontSize: '13px', borderRadius: '10px' }} />
              </div>
            )}

            {/* Esai */}
            {qType === 'ESAI' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Panduan Rubrik Penilaian Dosen</label>
                <textarea className="form-textarea" rows={2} placeholder="Kriteria penilaian esai..."
                  value={essayRubric} onChange={(e) => setEssayRubric(e.target.value)} style={{ fontSize: '13px', borderRadius: '10px' }} />
              </div>
            )}

            {/* Pembahasan */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Pembahasan & Rujukan <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opsional)</span></label>
              <textarea className="form-textarea" rows={2} placeholder="Penjelasan, dalil rujukan, atau catatan materi..."
                value={explanation} onChange={(e) => setExplanation(e.target.value)} style={{ fontSize: '13px', borderRadius: '10px' }} />
            </div>

            {/* Tags */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Tag / Kata Kunci <span style={{ fontWeight: 400, color: '#94a3b8' }}>(pisahkan koma)</span></label>
              <Input placeholder="contoh: Fiqih, Ushul, Kaidah, Semester 3" value={tags} onChange={(e) => setTags(e.target.value)} style={{ fontSize: '13px', borderRadius: '10px' }} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '4px' }}>
              <Button variant="secondary" type="button" onClick={() => setEditModal(false)}>Batal</Button>
              <Button variant="primary" type="submit" style={{ background: 'linear-gradient(135deg, #059669, #047857)', fontWeight: 700 }}>
                {editingQuestionId ? 'Simpan Perubahan' : 'Simpan ke Bank Soal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}


      {/* ================================================================
          MODAL: IMPOR EXCEL
          ================================================================ */}
      {importModal && (
        <DataImportModal<ImportQuestionInput>
          isOpen={importModal}
          onClose={() => setImportModal(false)}
          schema={QUESTION_BANK_IMPORT_SCHEMA}
          onImport={handleBulkImportQuestions}
          customTitle="Impor Soal dari File Excel"
        />
      )}
    </div>
  );
};

