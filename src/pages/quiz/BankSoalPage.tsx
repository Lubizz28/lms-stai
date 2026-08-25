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
  Folder, 
  Eye, 
  CheckCircle2, 
  FileQuestion, 
  Image as ImageIcon, 
  ChevronRight, 
  Sparkles, 
  GraduationCap 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table, Column } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { BankQuestion, QuestionType, QuestionDifficulty, ImportQuestionInput } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useToast } from '../../components/feedback/ToastContext';
import { KAMUS_UI } from '../../constants/dictionary';
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

export const BankSoalPage: React.FC<BankSoalPageProps> = ({ onBack }) => {
  const toast = useToast();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  // Search & Filter for Course Catalog (Level 1)
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Search & Filter for Questions List (Level 2)
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form states untuk Tambah/Edit Manual
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

  // Pilihan Ganda Form states (5 Opsi A, B, C, D, E)
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [optE, setOptE] = useState('');
  const [correctOptIndex, setCorrectOptIndex] = useState(0);
  const [shortAnswer, setShortAnswer] = useState('');
  const [essayRubric, setEssayRubric] = useState('');

  const loadQuestions = () => {
    setQuestions(quizService.getBankQuestions());
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // Auto reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterDifficulty, selectedCourse]);

  const hasActiveFilters = searchQuery !== '' || filterType !== 'SEMUA' || filterDifficulty !== 'SEMUA';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('SEMUA');
    setFilterDifficulty('SEMUA');
    setCurrentPage(1);
  };

  // Group questions by course code for summary stats
  const courseStats = useMemo(() => {
    const stats: Record<string, { 
      code: string; 
      name: string; 
      prodi: string;
      credits: number;
      semester: number;
      total: number; 
      pg: number; 
      bs: number; 
      js: number; 
      esai: number;
      mudah: number;
      sedang: number;
      sulit: number;
    }> = {};
    
    // Add known courses first
    Object.entries(COURSES_INFO).forEach(([code, info]) => {
      stats[code] = { 
        code, 
        name: info.name, 
        prodi: info.prodi,
        credits: info.credits,
        semester: info.semester,
        total: 0, 
        pg: 0, 
        bs: 0, 
        js: 0, 
        esai: 0,
        mudah: 0,
        sedang: 0,
        sulit: 0
      };
    });

    questions.forEach((q) => {
      const code = q.courseCode || 'LAINNYA';
      if (!stats[code]) {
        stats[code] = { 
          code, 
          name: COURSES_INFO[code]?.name || 'Mata Kuliah Pilihan', 
          prodi: COURSES_INFO[code]?.prodi || 'Program Studi Terkait',
          credits: COURSES_INFO[code]?.credits || 2,
          semester: COURSES_INFO[code]?.semester || 1,
          total: 0, 
          pg: 0, 
          bs: 0, 
          js: 0, 
          esai: 0,
          mudah: 0,
          sedang: 0,
          sulit: 0
        };
      }
      stats[code].total += 1;
      if (q.type === 'PILIHAN_GANDA') stats[code].pg += 1;
      if (q.type === 'BENAR_SALAH') stats[code].bs += 1;
      if (q.type === 'JAWABAN_SINGKAT') stats[code].js += 1;
      if (q.type === 'ESAI') stats[code].esai += 1;

      if (q.difficulty === 'MUDAH') stats[code].mudah += 1;
      if (q.difficulty === 'SEDANG') stats[code].sedang += 1;
      if (q.difficulty === 'SULIT') stats[code].sulit += 1;
    });

    return stats;
  }, [questions]);

  // Overall Question Bank Metrics
  const globalMetrics = useMemo(() => {
    const totalCourses = Object.keys(courseStats).length;
    const totalQuestions = questions.length;
    const totalPG = questions.filter(q => q.type === 'PILIHAN_GANDA').length;
    const totalBS = questions.filter(q => q.type === 'BENAR_SALAH').length;
    const totalJS = questions.filter(q => q.type === 'JAWABAN_SINGKAT').length;
    const totalEsai = questions.filter(q => q.type === 'ESAI').length;
    const totalMudah = questions.filter(q => q.difficulty === 'MUDAH').length;
    const totalSedang = questions.filter(q => q.difficulty === 'SEDANG').length;
    const totalSulit = questions.filter(q => q.difficulty === 'SULIT').length;

    return {
      totalCourses,
      totalQuestions,
      totalPG,
      totalBS,
      totalJS,
      totalEsai,
      totalMudah,
      totalSedang,
      totalSulit
    };
  }, [questions, courseStats]);

  // Filtered Course Catalog (Level 1)
  const filteredCourses = useMemo(() => {
    return Object.values(courseStats).filter(st => {
      const matchesSearch = 
        st.code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        st.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
        st.prodi.toLowerCase().includes(courseSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [courseStats, courseSearchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingQuestionId(null);
    setCourseCode(selectedCourse || 'PAI-301');
    setTopic('');
    setQType('PILIHAN_GANDA');
    setDifficulty('SEDANG');
    setQuestionText('');
    setArabicText('');
    setImageUrl('');
    setPoints(20);
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setOptE('');
    setCorrectOptIndex(0);
    setShortAnswer('');
    setEssayRubric('');
    setExplanation('');
    setTags('');
    setEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (q: BankQuestion) => {
    setEditingQuestionId(q.id);
    setCourseCode(q.courseCode);
    setTopic(q.topic);
    setQType(q.type);
    setDifficulty(q.difficulty);
    setQuestionText(q.questionText);
    setArabicText(q.arabicText || '');
    setImageUrl(q.imageUrl || '');
    setPoints(q.defaultPoints);
    setExplanation(q.explanation || '');
    setTags(q.tags?.join(', ') || '');

    if (q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH') {
      const opts = q.options || [];
      setOptA(opts[0]?.text || '');
      setOptB(opts[1]?.text || '');
      setOptC(opts[2]?.text || '');
      setOptD(opts[3]?.text || '');
      setOptE(opts[4]?.text || '');
      const correctIdx = opts.findIndex((o) => o.isCorrect);
      setCorrectOptIndex(correctIdx >= 0 ? correctIdx : 0);
    } else {
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setOptE('');
      setCorrectOptIndex(0);
    }

    setShortAnswer(q.correctShortAnswer || '');
    setEssayRubric(q.essayRubric || '');
    setEditModal(true);
  };

  // Confirm Delete
  const handleOpenDelete = (q: BankQuestion) => {
    setDeletingQuestion(q);
    setDeleteConfirmModal(true);
  };

  const handleExecuteDelete = () => {
    if (!deletingQuestion) return;
    try {
      quizService.deleteBankQuestion(deletingQuestion.id);
      loadQuestions();
      setDeleteConfirmModal(false);
      setDeletingQuestion(null);
      toast.success('Soal Berhasil Dihapus', 'Butir soal telah dihapus dari repositori Bank Soal.');
    } catch (err: any) {
      toast.danger('Gagal Menghapus Soal', err.message);
    }
  };

  // Save (Create or Update) Question
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (points > 100) {
        toast.warning(
          'Peringatan Bobot Soal',
          `Bobot poin butir soal (${points} poin) melebihi batas standar maksimal 100 poin.`
        );
      }
      if (points < 1) {
        toast.danger('Bobot Tidak Valid', 'Bobot poin butir soal minimal adalah 1 poin.');
        return;
      }

      let options: { id: string; text: string; isCorrect: boolean }[] | undefined;

      if (qType === 'BENAR_SALAH') {
        options = [
          { id: `opt-${Date.now()}-1`, text: 'Benar', isCorrect: correctOptIndex === 0 },
          { id: `opt-${Date.now()}-2`, text: 'Salah', isCorrect: correctOptIndex === 1 },
        ];
      } else if (qType === 'PILIHAN_GANDA') {
        const rawOptions = [
          { id: `opt-${Date.now()}-1`, text: optA.trim(), isCorrect: correctOptIndex === 0 },
          { id: `opt-${Date.now()}-2`, text: optB.trim(), isCorrect: correctOptIndex === 1 },
          { id: `opt-${Date.now()}-3`, text: optC.trim(), isCorrect: correctOptIndex === 2 },
          { id: `opt-${Date.now()}-4`, text: optD.trim(), isCorrect: correctOptIndex === 3 },
          { id: `opt-${Date.now()}-5`, text: optE.trim(), isCorrect: correctOptIndex === 4 },
        ].filter((o) => o.text !== '');

        if (rawOptions.length < 2) {
          toast.warning('Opsi Kurang', 'Soal pilihan ganda minimal harus memiliki 2 opsi jawaban.');
          return;
        }

        options = rawOptions;
      }

      const questionPayload = {
        courseCode,
        topic: topic.trim() || 'Umum',
        type: qType,
        difficulty,
        questionText: questionText.trim(),
        arabicText: arabicText.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        options,
        correctShortAnswer: qType === 'JAWABAN_SINGKAT' ? shortAnswer.trim() : undefined,
        essayRubric: qType === 'ESAI' ? essayRubric.trim() : undefined,
        defaultPoints: points,
        explanation: explanation.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
      };

      if (editingQuestionId) {
        quizService.updateBankQuestion(editingQuestionId, questionPayload);
        toast.success('Soal Diperbarui', 'Perubahan butir soal berhasil disimpan.');
      } else {
        quizService.addBankQuestion(questionPayload);
        toast.success('Soal Ditambahkan', 'Butir soal baru berhasil disimpan ke Bank Soal.');
      }

      loadQuestions();
      setEditModal(false);
      setEditingQuestionId(null);
    } catch (err: any) {
      toast.danger('Gagal Menyimpan Soal', err.message);
    }
  };

  // Handler Impor Massal Excel
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
          // PILIHAN GANDA (5 Opsi A-E)
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
          courseCode: row.courseCode || selectedCourse || 'PAI-301',
          topic: row.topic || 'Materi Pokok',
          type: row.type || 'PILIHAN_GANDA',
          difficulty: row.difficulty || 'SEDANG',
          questionText: row.questionText,
          arabicText: row.arabicText?.trim() || undefined,
          imageUrl: row.imageUrl?.trim() || undefined,
          options,
          correctShortAnswer: shortAnswer,
          essayRubric,
          defaultPoints: Number(row.defaultPoints) || 20,
          explanation: row.explanation,
          tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : ['Impor Excel']
        });

        successCount += 1;
      } catch (err: any) {
        failedCount += 1;
        errors.push(`Baris #${idx + 1}: ${err.message || 'Galat saat memproses butir soal.'}`);
      }
    });

    const highPointRows = validRows.filter((r) => Number(r.defaultPoints) > 100);
    if (highPointRows.length > 0) {
      toast.warning(
        'Peringatan Bobot Soal',
        `Terdeteksi ${highPointRows.length} butir soal hasil impor dengan bobot melebihi batas 100 poin.`
      );
    }

    loadQuestions();
    return {
      total: validRows.length,
      inserted: successCount,
      updated: 0,
      skipped: failedCount,
      errors
    };
  };

  // Filter questions for Selected Course (Level 2)
  const filteredQuestions = useMemo(() => {
    if (!selectedCourse) return [];

    return questions.filter((q) => {
      const matchesCourse = q.courseCode === selectedCourse;
      const matchesSearch = 
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = filterType === 'SEMUA' || q.type === filterType;
      const matchesDifficulty = filterDifficulty === 'SEMUA' || q.difficulty === filterDifficulty;
      
      return matchesCourse && matchesSearch && matchesType && matchesDifficulty;
    });
  }, [questions, searchQuery, filterType, filterDifficulty, selectedCourse]);

  // Paginated Questions
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Active Selected Course Info
  const activeCourseInfo = selectedCourse ? (COURSES_INFO[selectedCourse] || { name: 'Mata Kuliah Pilihan', prodi: 'Program Studi Terkait', credits: 3, semester: 1 }) : null;
  const activeCourseStats = selectedCourse ? courseStats[selectedCourse] : null;

  // Konfigurasi Ekspor Profesional Bank Soal
  const bankQuestionExportConfig: ExportConfig<BankQuestion> = useMemo(() => ({
    filename: `SALAM_Bank_Soal_${selectedCourse || 'Katalog_Semua'}`,
    title: `REPOSITORI BANK SOAL KURIKULUM — ${selectedCourse ? `${activeCourseInfo?.name} (${selectedCourse})` : 'SEMUA MATA KULIAH'}`,
    subtitle: 'Sekolah Tinggi Agama Islam (STAI) Al-Ittihad Cianjur',
    data: filteredQuestions,
    columns: [
      { key: 'courseCode', header: 'Kode MK', width: '90px' },
      { key: 'topic', header: 'Topik / Materi', width: '160px' },
      { key: 'type', header: 'Tipe Soal', width: '120px' },
      { key: 'difficulty', header: 'Tingkat', width: '80px', align: 'center' },
      { key: 'questionText', header: 'Teks Pertanyaan', width: '280px' },
      { key: 'arabicText', header: 'Teks Arab / Matan', width: '200px', format: (val: any) => val || '-' },
      { key: 'imageUrl', header: 'Gambar / Ilustrasi', width: '120px', format: (val: any) => val ? 'Ada Gambar' : '-' },
      { key: 'defaultPoints', header: 'Poin', width: '60px', align: 'center' },
      { 
        key: 'options', 
        header: 'Kunci Jawaban', 
        width: '180px',
        format: (_: any, q: BankQuestion) => {
          if (q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH') {
            const correctIdx = q.options?.findIndex((o) => o.isCorrect);
            const correctOpt = q.options?.find((o) => o.isCorrect);
            if (correctIdx !== undefined && correctIdx >= 0 && correctOpt) {
              return `[${String.fromCharCode(65 + correctIdx)}] ${correctOpt.text}`;
            }
            return '-';
          }
          if (q.type === 'JAWABAN_SINGKAT') return q.correctShortAnswer || '-';
          return 'Rubrik Terlampir';
        }
      },
      { key: 'explanation', header: 'Pembahasan', width: '200px', format: (val: any) => val || '-' }
    ],
    metadata: {
      'Total Butir Soal': `${filteredQuestions.length} Soal`,
      'Mata Kuliah': selectedCourse ? `${selectedCourse} - ${activeCourseInfo?.name}` : 'Semua Mata Kuliah',
      'Waktu Unduh': new Date().toLocaleString('id-ID')
    }
  }), [filteredQuestions, selectedCourse, activeCourseInfo]);

  // Table Columns Definition (Desktop)
  const columns: Column<BankQuestion>[] = [
    {
      header: 'No',
      width: '50px',
      render: (_, index) => (
        <span style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      )
    },
    {
      header: 'Tipe & Tingkat',
      width: '140px',
      render: (q) => (
        <div className="flex flex-col gap-1.5">
          <Badge variant="default" style={{ fontSize: '10px', width: 'fit-content', fontWeight: 600 }}>
            {q.type.replace('_', ' ')}
          </Badge>
          <Badge 
            variant={q.difficulty === 'MUDAH' ? 'success' : q.difficulty === 'SEDANG' ? 'warning' : 'danger'}
            style={{ fontSize: '10px', width: 'fit-content', padding: '1px 6px' }}
          >
            {q.difficulty}
          </Badge>
        </div>
      )
    },
    {
      header: 'Teks Pertanyaan & Materi',
      render: (q) => (
        <div className="flex flex-col gap-1.5">
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.45 }}>
            {q.questionText}
          </div>
          {q.arabicText && (
            <div 
              style={{
                fontFamily: "'Amiri', 'Traditional Arabic', serif",
                fontSize: '1.05rem',
                color: '#065f46',
                direction: 'rtl',
                textAlign: 'right',
                lineHeight: 1.6,
                backgroundColor: 'rgba(6, 95, 70, 0.04)',
                padding: '4px 8px',
                borderRadius: '6px',
                borderRight: '3px solid #059669'
              }}
            >
              {q.arabicText}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Topik: <strong className="text-slate-700">{q.topic}</strong>
            </span>
            {q.imageUrl && (
              <Badge variant="default" className="flex items-center gap-1" style={{ fontSize: '10px' }}>
                <ImageIcon size={10} /> Gambar Referensi
              </Badge>
            )}
            {q.tags?.map((t, idx) => (
              <span key={idx} style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: '4px' }}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      )
    },
    {
      header: 'Kunci / Rubrik',
      width: '180px',
      render: (q) => {
        if (q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH') {
          const correctIdx = q.options?.findIndex((o) => o.isCorrect);
          const correctOpt = q.options?.find((o) => o.isCorrect);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                <CheckCircle2 size={12} /> Opsi [{String.fromCharCode(65 + (correctIdx ?? 0))}]
              </span>
              <span className="text-xs text-slate-600 truncate" title={correctOpt?.text}>
                {correctOpt?.text || '-'}
              </span>
            </div>
          );
        }
        if (q.type === 'JAWABAN_SINGKAT') {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-emerald-700 font-bold text-xs">Kata Kunci:</span>
              <span className="text-xs text-slate-700 font-mono bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                {q.correctShortAnswer || '-'}
              </span>
            </div>
          );
        }
        return (
          <span className="text-xs text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Rubrik Penilaian Terlampir
          </span>
        );
      }
    },
    {
      header: 'Bobot',
      width: '80px',
      render: (q) => (
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 'var(--text-xs)', color: 'var(--color-primary-800)' }}>
          {q.defaultPoints} Pts
        </div>
      )
    },
    {
      header: 'Aksi',
      width: '130px',
      render: (q) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setPreviewingQuestion(q);
              setPreviewShowAnswer(false);
              setPreviewModal(true);
            }}
            title="Pratinjau Butir Soal"
            style={{ padding: '6px', color: 'var(--text-muted)' }}
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleOpenEdit(q)}
            title="Edit Butir Soal"
            style={{ padding: '6px' }}
          >
            <Edit size={14} color="var(--color-primary-700)" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
            onClick={() => handleOpenDelete(q)}
            title="Hapus Butir Soal"
            style={{ padding: '6px' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* =========================================================================
          LEVEL 1: KATALOG KATEGORI / MATA KULIAH (WHEN NO COURSE IS SELECTED)
          ========================================================================= */}
      {!selectedCourse ? (
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
                  <GraduationCap size={14} /> Repositori Bank Soal Terstandar
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                  {KAMUS_UI.BANK_SOAL} & Kurikulum Ujian
                </h1>
                <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
                  Pusat pengelolaan dan kurasi butir soal terstandar berbasis Capaian Pembelajaran Mata Kuliah (CPMK). Pilih kategori mata kuliah di bawah untuk mengelola butir soal.
                </p>
              </div>

              {/* Action Buttons in Hero */}
              <div className="flex flex-wrap gap-2.5">
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={Download} 
                  onClick={exportQuestionBankExcelTemplate}
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 text-xs"
                  title="Unduh Template Excel Format Resmi Bank Soal"
                >
                  Template Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  icon={Upload} 
                  onClick={() => setImportModal(true)}
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 text-xs"
                >
                  Impor Excel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  icon={Plus} 
                  onClick={handleOpenCreate}
                  className="bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-bold border-0 shadow-lg text-xs"
                >
                  Tambah Soal Baru
                </Button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-600/40">
              <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
                <div className="text-xs text-emerald-200 font-medium">Total Bank Mata Kuliah</div>
                <div className="text-2xl font-bold text-white mt-1">{globalMetrics.totalCourses} <span className="text-xs font-normal text-emerald-300">MK</span></div>
              </div>
              <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
                <div className="text-xs text-emerald-200 font-medium">Total Butir Soal</div>
                <div className="text-2xl font-bold text-white mt-1">{globalMetrics.totalQuestions} <span className="text-xs font-normal text-emerald-300">Soal</span></div>
              </div>
              <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
                <div className="text-xs text-emerald-200 font-medium">Pilihan Ganda & B/S</div>
                <div className="text-2xl font-bold text-white mt-1">{globalMetrics.totalPG + globalMetrics.totalBS} <span className="text-xs font-normal text-emerald-300">Objektif</span></div>
              </div>
              <div className="bg-emerald-950/40 rounded-xl p-3.5 backdrop-blur-sm border border-emerald-500/20">
                <div className="text-xs text-emerald-200 font-medium">Isian & Esai Rubrik</div>
                <div className="text-2xl font-bold text-white mt-1">{globalMetrics.totalJS + globalMetrics.totalEsai} <span className="text-xs font-normal text-emerald-300">Subjektif</span></div>
              </div>
            </div>
          </div>

          {/* Search and Section Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Folder size={18} className="text-emerald-700" />
                Pilih Kategori Mata Kuliah
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik kartu mata kuliah untuk membuka repositori butir soal spesifik
              </p>
            </div>            <div className="w-full sm:w-80 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <Input
                placeholder="Cari kode MK atau nama mata kuliah..."
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Grid of Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((st) => (
              <div
                key={st.code}
                onClick={() => setSelectedCourse(st.code)}
                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col justify-between"
                style={{ minHeight: '190px' }}
              >
                {/* Top Badge & Code */}
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold font-mono border border-emerald-200">
                      {st.code}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                      <FileQuestion size={12} className="text-emerald-600" /> {st.total} Butir Soal
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-snug mb-1">
                    {st.name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                    <span>{st.prodi}</span>
                    <span>•</span>
                    <span>{st.credits} SKS</span>
                  </div>
                </div>

                {/* Question Type Breakdown & Footer */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-3 flex-wrap gap-1">
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">PG: <strong>{st.pg}</strong></span>
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">B/S: <strong>{st.bs}</strong></span>
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">Isian: <strong>{st.js}</strong></span>
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">Esai: <strong>{st.esai}</strong></span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span>Kelola Butir Soal</span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Buka Bank Soal <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Folder size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">Mata Kuliah Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Tidak ada kategori mata kuliah yang cocok dengan kata kunci "{courseSearchQuery}".
              </p>
              <Button variant="secondary" size="sm" onClick={() => setCourseSearchQuery('')} className="mt-3">
                Reset Pencarian
              </Button>
            </div>
          )}
        </div>
      ) : (

        /* =========================================================================
            LEVEL 2: DAFTAR BUTIR SOAL PER MATA KULIAH (WHEN A COURSE IS SELECTED)
            ========================================================================= */
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Breadcrumb & Navigation Back */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={ArrowLeft} 
                onClick={() => setSelectedCourse(null)}
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Kembali ke Daftar Mata Kuliah
              </Button>
              {onBack && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBack}
                  className="text-xs text-slate-500"
                >
                  Ke Modul Kuis
                </Button>
              )}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <span>Bank Soal</span>
                <span>/</span>
                <span className="font-bold text-emerald-700 font-mono">{selectedCourse}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="ghost" 
                size="sm"
                icon={Download} 
                onClick={exportQuestionBankExcelTemplate}
                className="text-xs text-slate-700"
              >
                Template Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                icon={Upload} 
                onClick={() => setImportModal(true)}
                className="text-xs"
              >
                Impor Excel
              </Button>
              <ExportDropdown 
                config={bankQuestionExportConfig} 
                buttonLabel="Ekspor Soal" 
              />
              <Button 
                variant="primary" 
                size="sm" 
                icon={Plus} 
                onClick={handleOpenCreate}
                style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' }}
                className="font-bold text-xs"
              >
                Tambah Soal Baru
              </Button>
            </div>
          </div>

          {/* Active Course Info Card Banner */}
          <div 
            className="p-5 md:p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30">
                  {selectedCourse}
                </span>
                <span className="text-xs text-emerald-200">
                  {activeCourseInfo?.prodi} • {activeCourseInfo?.credits} SKS
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {activeCourseInfo?.name}
              </h2>
              <p className="text-xs text-emerald-100 mt-1">
                Daftar butir soal kuis & ujian terstandar Capaian Pembelajaran Mata Kuliah
              </p>
            </div>

            {/* Quick Counters for this course */}
            <div className="flex gap-2 flex-wrap">
              <div className="bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-500/20 text-center min-w-[75px]">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">Total Soal</div>
                <div className="text-lg font-bold text-white">{filteredQuestions.length}</div>
              </div>
              <div className="bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-500/20 text-center min-w-[65px]">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">PG</div>
                <div className="text-lg font-bold text-white">{activeCourseStats?.pg || 0}</div>
              </div>
              <div className="bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-500/20 text-center min-w-[65px]">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">B/S</div>
                <div className="text-lg font-bold text-white">{activeCourseStats?.bs || 0}</div>
              </div>
              <div className="bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-500/20 text-center min-w-[65px]">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">Esai</div>
                <div className="text-lg font-bold text-white">{activeCourseStats?.esai || 0}</div>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-96 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <Input
                placeholder="Cari teks soal, materi, topik, atau tagar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto items-center flex-wrap">
              <select
                className="form-select text-xs py-2 px-3 rounded-lg border-slate-300 bg-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="SEMUA">Semua Tipe Soal</option>
                <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                <option value="BENAR_SALAH">Benar / Salah</option>
                <option value="JAWABAN_SINGKAT">Jawaban Singkat</option>
                <option value="ESAI">Esai</option>
              </select>

              <select
                className="form-select text-xs py-2 px-3 rounded-lg border-slate-300 bg-white"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="SEMUA">Semua Tingkat</option>
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" icon={X} onClick={handleResetFilters} className="text-xs text-red-600">
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* =========================================================================
              TAMPILAN DESKTOP (TABLE VIEW)
              ========================================================================= */}
          <div className="hidden md:block">
            <Card>
              <Table 
                columns={columns} 
                data={paginatedQuestions} 
                keyExtractor={(q) => q.id}
                emptyMessage="Belum ada butir soal untuk mata kuliah ini. Silakan tambahkan soal baru atau impor file Excel."
              />
            </Card>
          </div>

          {/* =========================================================================
              TAMPILAN MOBILE (CARDS VIEW)
              ========================================================================= */}
          <div className="block md:hidden flex flex-col gap-3">
            {paginatedQuestions.map((q, idx) => (
              <div 
                key={q.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3"
              >
                {/* Header Card */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </span>
                    <Badge variant="default" style={{ fontSize: '10px' }}>
                      {q.type.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={q.difficulty === 'MUDAH' ? 'success' : q.difficulty === 'SEDANG' ? 'warning' : 'danger'}
                      style={{ fontSize: '10px' }}
                    >
                      {q.difficulty}
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {q.defaultPoints} Pts
                  </span>
                </div>

                {/* Question Text */}
                <div className="text-sm font-semibold text-slate-800 leading-snug">
                  {q.questionText}
                </div>

                {/* Arabic Text if any */}
                {q.arabicText && (
                  <div 
                    style={{
                      fontFamily: "'Amiri', 'Traditional Arabic', serif",
                      fontSize: '1.05rem',
                      color: '#065f46',
                      direction: 'rtl',
                      textAlign: 'right',
                      lineHeight: 1.6,
                      backgroundColor: 'rgba(6, 95, 70, 0.04)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      borderRight: '3px solid #059669'
                    }}
                  >
                    {q.arabicText}
                  </div>
                )}

                {/* Topic & Details */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  <span>Topik: <strong>{q.topic}</strong></span>
                  {q.imageUrl && (
                    <Badge variant="default" style={{ fontSize: '9px' }}>
                      <ImageIcon size={9} /> Gambar
                    </Badge>
                  )}
                </div>

                {/* Correct Answer Snippet */}
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <span className="text-slate-500 font-medium">Kunci: </span>
                  {q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH' ? (
                    <strong className="text-emerald-700">
                      [{String.fromCharCode(65 + (q.options?.findIndex(o => o.isCorrect) ?? 0))}] {q.options?.find(o => o.isCorrect)?.text || '-'}
                    </strong>
                  ) : q.type === 'JAWABAN_SINGKAT' ? (
                    <strong className="text-emerald-700 font-mono">{q.correctShortAnswer}</strong>
                  ) : (
                    <span className="text-amber-700 italic">Rubrik Terlampir</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Eye} 
                    onClick={() => {
                      setPreviewingQuestion(q);
                      setPreviewShowAnswer(false);
                      setPreviewModal(true);
                    }}
                    className="text-xs"
                  >
                    Pratinjau
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    icon={Edit} 
                    onClick={() => handleOpenEdit(q)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Trash2} 
                    onClick={() => handleOpenDelete(q)}
                    className="text-xs text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}

            {paginatedQuestions.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-4">
                <FileQuestion size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">Tidak Ada Butir Soal</p>
                <p className="text-xs text-slate-500 mt-1">Belum ada butir soal yang sesuai dengan filter pencarian.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredQuestions.length > 0 && (
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredQuestions.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="butir soal"
              />
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL PRATINJAU BUTIR SOAL (PREVIEW)
          ========================================================================= */}
      {previewModal && previewingQuestion && (
        <Modal
          isOpen={previewModal}
          onClose={() => setPreviewModal(false)}
          title={`Pratinjau Butir Soal (${previewingQuestion.courseCode})`}
          maxWidth="640px"
        >
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Badge variant="primary">{previewingQuestion.courseCode}</Badge>
                <Badge variant="default">{previewingQuestion.type.replace('_', ' ')}</Badge>
                <Badge 
                  variant={previewingQuestion.difficulty === 'MUDAH' ? 'success' : previewingQuestion.difficulty === 'SEDANG' ? 'warning' : 'danger'}
                >
                  {previewingQuestion.difficulty}
                </Badge>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Bobot: {previewingQuestion.defaultPoints} Poin
              </span>
            </div>

            {/* Question Text */}
            <div className="text-base font-semibold text-slate-800 leading-relaxed">
              {previewingQuestion.questionText}
            </div>

            {/* Arabic Text if any */}
            {previewingQuestion.arabicText && (
              <div 
                style={{
                  fontFamily: "'Amiri', 'Traditional Arabic', serif",
                  fontSize: '1.25rem',
                  color: '#065f46',
                  direction: 'rtl',
                  textAlign: 'right',
                  lineHeight: 1.8,
                  backgroundColor: 'rgba(6, 95, 70, 0.05)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  borderRight: '4px solid #059669'
                }}
              >
                {previewingQuestion.arabicText}
              </div>
            )}

            {/* Image Preview if any */}
            {previewingQuestion.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 flex justify-center bg-slate-50">
                <img 
                  src={previewingQuestion.imageUrl} 
                  alt="Ilustrasi Soal" 
                  className="object-contain max-h-64"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            )}

            {/* Options for Multiple Choice / True False */}
            {(previewingQuestion.type === 'PILIHAN_GANDA' || previewingQuestion.type === 'BENAR_SALAH') && previewingQuestion.options && (
              <div className="flex flex-col gap-2 mt-2">
                {previewingQuestion.options.map((opt, oIdx) => {
                  const isCorrect = opt.isCorrect;
                  return (
                    <div 
                      key={opt.id || oIdx}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        previewShowAnswer && isCorrect 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        previewShowAnswer && isCorrect 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm pt-0.5">{opt.text}</span>
                      {previewShowAnswer && isCorrect && (
                        <CheckCircle2 size={16} className="ml-auto text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {previewingQuestion.type === 'JAWABAN_SINGKAT' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block mb-1">Kunci Jawaban Singkat:</span>
                <span className="font-mono font-bold text-sm text-emerald-800 bg-white px-2 py-1 rounded border">
                  {previewShowAnswer ? previewingQuestion.correctShortAnswer : '•••••••• (Klik Buka Kunci)'}
                </span>
              </div>
            )}

            {/* Essay Rubric */}
            {previewingQuestion.type === 'ESAI' && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-800 block mb-1">Panduan Rubrik Penilaian Dosen:</span>
                <p className="text-amber-900 leading-relaxed">
                  {previewingQuestion.essayRubric || 'Tidak ada rubrik khusus yang dicantumkan.'}
                </p>
              </div>
            )}

            {/* Explanation & Discussion */}
            {previewShowAnswer && previewingQuestion.explanation && (
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs mt-2">
                <span className="font-bold text-emerald-800 block mb-1">Pembahasan / Rujukan Dalil:</span>
                <p className="text-emerald-900 leading-relaxed">
                  {previewingQuestion.explanation}
                </p>
              </div>
            )}

            {/* Toggle Answer Key */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2">
              <button
                type="button"
                onClick={() => setPreviewShowAnswer(!previewShowAnswer)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                {previewShowAnswer ? 'Sembunyikan Kunci & Pembahasan' : 'Tampilkan Kunci & Pembahasan'}
              </button>

              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon={Edit} 
                  onClick={() => {
                    setPreviewModal(false);
                    handleOpenEdit(previewingQuestion);
                  }}
                >
                  Edit Soal
                </Button>
                <Button variant="primary" size="sm" onClick={() => setPreviewModal(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL HAPUS BUTIR SOAL (DELETE CONFIRMATION)
          ========================================================================= */}
      {deleteConfirmModal && deletingQuestion && (
        <Modal
          isOpen={deleteConfirmModal}
          onClose={() => setDeleteConfirmModal(false)}
          title="Konfirmasi Hapus Butir Soal"
          maxWidth="480px"
        >
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-start gap-2.5">
              <Trash2 size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Tindakan ini tidak dapat dibatalkan!</strong> Butir soal akan dihapus secara permanen dari Bank Soal repositori STAI AL-ITTIHAD.
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Mata Kuliah: {deletingQuestion.courseCode}</div>
              <p className="font-semibold text-slate-900 leading-snug line-clamp-3">
                "{deletingQuestion.questionText}"
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                Topik: <strong>{deletingQuestion.topic}</strong> • Tipe: <strong>{deletingQuestion.type}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setDeleteConfirmModal(false)}>
                Batal
              </Button>
              <Button 
                variant="primary" 
                onClick={handleExecuteDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold border-0"
              >
                Hapus Permanen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL TAMBAH / EDIT BUTIR SOAL
          ========================================================================= */}
      {editModal && (
        <Modal
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          title={editingQuestionId ? 'Edit Butir Soal' : 'Tambah Butir Soal Baru'}
          maxWidth="700px"
        >
          <form onSubmit={handleSaveQuestion} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label font-bold text-xs">Mata Kuliah Target</label>
                <select
                  className="form-select text-xs"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  required
                >
                  {Object.entries(COURSES_INFO).map(([code, info]) => (
                    <option key={code} value={code}>
                      {code} — {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label font-bold text-xs">Topik / CPMK Pembahasan</label>
                <Input
                  required
                  placeholder="misal: Kaidah Lughawiyah Ushul Fiqih"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label font-bold text-xs">Tipe Soal</label>
                <select
                  className="form-select text-xs"
                  value={qType}
                  onChange={(e) => setQType(e.target.value as QuestionType)}
                >
                  <option value="PILIHAN_GANDA">Pilihan Ganda (5 Opsi A-E)</option>
                  <option value="BENAR_SALAH">Benar / Salah</option>
                  <option value="JAWABAN_SINGKAT">Jawaban Singkat (Isian)</option>
                  <option value="ESAI">Esai (Uraian)</option>
                </select>
              </div>

              <div>
                <label className="form-label font-bold text-xs">Tingkat Kesulitan</label>
                <select
                  className="form-select text-xs"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                >
                  <option value="MUDAH">Mudah</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="SULIT">Sulit</option>
                </select>
              </div>

              <div>
                <label className="form-label font-bold text-xs">Bobot Poin Standar</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <label className="form-label font-bold text-xs">Teks Pertanyaan / Soal</label>
              <textarea
                className="form-textarea text-xs"
                rows={3}
                required
                placeholder="Tuliskan narasi pertanyaan atau kasus secara jelas..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </div>

            {/* Teks Arab / Matan */}
            <div>
              <label className="form-label font-bold text-xs">Teks Arab / Ayat / Hadits / Matan Kitab (Opsional)</label>
              <textarea
                className="form-textarea text-base"
                rows={2}
                placeholder="أدخل النص العربي أو المتن هنا..."
                dir="rtl"
                style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", color: '#065f46' }}
                value={arabicText}
                onChange={(e) => setArabicText(e.target.value)}
              />
            </div>

            {/* URL Gambar */}
            <div>
              <label className="form-label text-xs">URL Gambar / Bagan Ilustrasi (Opsional)</label>
              <Input
                placeholder="https://example.com/diagram-ushul.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {/* Opsi Jawaban: Pilihan Ganda */}
            {qType === 'PILIHAN_GANDA' && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center">
                  <label className="form-label font-bold text-xs" style={{ margin: 0 }}>5 Opsi Jawaban & Kunci Benar (A – E)</label>
                  <span className="text-[11px] text-slate-500">Klik radio untuk memilih kunci jawaban benar</span>
                </div>
                
                {[
                  { key: 'optA', label: 'A', val: optA, set: setOptA, req: true },
                  { key: 'optB', label: 'B', val: optB, set: setOptB, req: true },
                  { key: 'optC', label: 'C', val: optC, set: setOptC, req: false },
                  { key: 'optD', label: 'D', val: optD, set: setOptD, req: false },
                  { key: 'optE', label: 'E', val: optE, set: setOptE, req: false },
                ].map((item, idx) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="correctOptBank" 
                      checked={correctOptIndex === idx} 
                      onChange={() => setCorrectOptIndex(idx)} 
                      title={`Jadikan Kunci Benar ${item.label}`}
                      style={{ width: '18px', height: '18px', accentColor: '#047857', cursor: 'pointer' }}
                    />
                    <Input 
                      placeholder={`Opsi ${item.label}${item.req ? ' (Wajib)' : ' (Opsional)'}`} 
                      required={item.req}
                      value={item.val} 
                      onChange={(e) => item.set(e.target.value)} 
                      style={{
                        borderColor: correctOptIndex === idx ? '#059669' : undefined,
                        backgroundColor: correctOptIndex === idx ? '#ecfdf5' : undefined
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Opsi Jawaban: Benar / Salah */}
            {qType === 'BENAR_SALAH' && (
              <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <label className="form-label font-bold text-xs">Kunci Jawaban yang Benar</label>
                <div className="flex gap-6">
                  {['Benar', 'Salah'].map((opt, li) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="correctBSBank" 
                        checked={correctOptIndex === li} 
                        onChange={() => setCorrectOptIndex(li)} 
                        style={{ width: '18px', height: '18px', accentColor: '#047857' }}
                      />
                      <span className={correctOptIndex === li ? 'font-bold text-emerald-800' : 'text-slate-700'}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Jawaban Singkat */}
            {qType === 'JAWABAN_SINGKAT' && (
              <div>
                <label className="form-label font-bold text-xs">Kunci Kata Kunci Jawaban Singkat</label>
                <Input
                  required
                  placeholder="Ketik kata kunci jawaban yang tepat (tidak sensitif huruf besar/kecil)"
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                />
              </div>
            )}

            {/* Esai Rubrik */}
            {qType === 'ESAI' && (
              <div>
                <label className="form-label font-bold text-xs">Panduan Rubrik Penilaian Dosen</label>
                <textarea
                  className="form-textarea text-xs"
                  rows={2}
                  placeholder="Kriteria penilaian esai (misal: Bobot definisi 40%, contoh kasus 60%)..."
                  value={essayRubric}
                  onChange={(e) => setEssayRubric(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="form-label text-xs">Penjelasan / Pembahasan Soal (Opsional)</label>
              <textarea
                className="form-textarea text-xs"
                rows={2}
                placeholder="Penjelasan kaidah atau dalil rujukan..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label text-xs">Tagar / Kata Kunci (Pisahkan koma)</label>
              <Input
                placeholder="misal: Fiqih, Ushul, Kaidah Amar"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
              <Button variant="secondary" type="button" onClick={() => setEditModal(false)}>
                Batal
              </Button>
              <Button variant="primary" type="submit" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' }}>
                {editingQuestionId ? 'Simpan Perubahan' : 'Simpan ke Bank Soal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL IMPOR BUTIR SOAL EXCEL
          ========================================================================= */}
      {importModal && (
        <DataImportModal<ImportQuestionInput>
          isOpen={importModal}
          onClose={() => setImportModal(false)}
          schema={QUESTION_BANK_IMPORT_SCHEMA}
          onImport={handleBulkImportQuestions}
          customTitle="Pusat Impor Bank Soal Kurikulum (Format Excel Terstandar)"
        />
      )}
    </div>
  );
};
