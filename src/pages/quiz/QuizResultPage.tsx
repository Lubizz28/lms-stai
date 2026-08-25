import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Sparkles,
  User,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Quiz, QuizAttempt } from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { KAMUS_UI } from '../../constants/dictionary';

export interface QuizResultPageProps {
  attemptId: string;
  onBack: () => void;
}

export const QuizResultPage: React.FC<QuizResultPageProps> = ({ attemptId, onBack }) => {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'ESSAY'>('ALL');

  useEffect(() => {
    if (!user) return;
    try {
      const isLecturer = user.role === 'dosen' || user.role === 'dosen_pa' || user.role === 'administrator_sistem';
      const att = quizService.getAttemptById(attemptId, user.id, isLecturer);
      setAttempt(att);
      const qz = quizService.getQuizById(att.quizId);
      if (qz) setQuiz(qz);
    } catch (e) {
      console.warn('Gagal memuat hasil kuis:', e);
    }
  }, [attemptId, user]);

  const questionsWithAnswers = useMemo(() => {
    if (!quiz || !attempt) return [];
    return quiz.questions.map((q, idx) => {
      const ans = attempt.answers[q.id];
      const isEssay = q.type === 'ESAI';
      const isShortAnswer = q.type === 'JAWABAN_SINGKAT';
      const isObjCorrect = !isEssay && ans?.earnedPoints === q.points;
      const isObjWrong = !isEssay && !isObjCorrect;
      return {
        ...q,
        index: idx,
        ans,
        isEssay,
        isShortAnswer,
        isObjCorrect,
        isObjWrong,
      };
    });
  }, [quiz, attempt]);

  const filteredQuestions = useMemo(() => {
    if (activeFilter === 'CORRECT') return questionsWithAnswers.filter(q => q.isObjCorrect);
    if (activeFilter === 'WRONG') return questionsWithAnswers.filter(q => q.isObjWrong);
    if (activeFilter === 'ESSAY') return questionsWithAnswers.filter(q => q.isEssay);
    return questionsWithAnswers;
  }, [questionsWithAnswers, activeFilter]);

  const stats = useMemo(() => {
    if (!quiz || !attempt) return { correct: 0, wrong: 0, essay: 0, total: 0 };
    const correct = questionsWithAnswers.filter(q => q.isObjCorrect).length;
    const wrong = questionsWithAnswers.filter(q => q.isObjWrong).length;
    const essay = questionsWithAnswers.filter(q => q.isEssay).length;
    return { correct, wrong, essay, total: quiz.questions.length };
  }, [quiz, attempt, questionsWithAnswers]);

  if (!attempt || !quiz) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto py-8">
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
          Kembali ke Daftar Kuis
        </Button>
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Hasil kuis tidak ditemukan atau Anda tidak memiliki hak akses.</p>
        </div>
      </div>
    );
  }

  const isGraded = attempt.status === 'DINILAI';
  const isPassed = attempt.isPassed;

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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
          <ArrowLeft size={16} /> Kembali ke {KAMUS_UI.KUIS_DARING}
        </button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
            className="text-xs"
          >
            Cetak Lembar Hasil
          </Button>
        </div>
      </div>

      {/* Hero Score Banner */}
      <div
        style={{
          background: isGraded 
            ? isPassed 
              ? 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' 
              : 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: isGraded && isPassed ? '0 10px 25px -5px rgba(5, 150, 105, 0.3)' : '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '10px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)', color: '#ffffff'
              }}>
                Percobaan #{attempt.attemptNumber}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                background: isGraded ? (isPassed ? '#dcfce7' : '#fee2e2') : '#fef3c7',
                color: isGraded ? (isPassed ? '#166534' : '#991b1b') : '#92400e',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                {isGraded ? (
                  isPassed ? <><CheckCircle2 size={13} /> LULUS KKM</> : <><XCircle size={13} /> BELUM LULUS</>
                ) : (
                  <><Clock size={13} /> MENUNGGU KOREKSI ESAI</>
                )}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Pertemuan {quiz.meetingNumber} • {quiz.courseName}
              </span>
            </div>

            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, lineHeight: 1.2, color: '#ffffff' }}>
              {quiz.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '14px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                <span><strong>{attempt.studentName}</strong> (NIM: {attempt.studentNim})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                <span>Dikumpulkan: {new Date(attempt.submittedAt || '').toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} />
                <span>CBT Verifikasi Mandiri</span>
              </div>
            </div>
          </div>

          {/* Score Big Display */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '20px',
              padding: '20px 32px',
              textAlign: 'center',
              minWidth: '180px',
              alignSelf: 'stretch',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Nilai Akhir
            </span>
            <div style={{ fontSize: '3.75rem', fontWeight: 900, lineHeight: 1, color: '#ffffff', margin: '4px 0' }}>
              {attempt.finalScore}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
              KKM Kelulusan: <strong>{quiz.passingScore}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Butir Soal</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{stats.total}</div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Poin: {quiz.totalPoints}</span>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Jawaban Benar</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>{stats.correct}</div>
          <span style={{ fontSize: '11px', color: '#166534' }}>Poin Objektif Maksimal</span>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Jawaban Kurang Tepat</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b91c1c' }}>{stats.wrong}</div>
          <span style={{ fontSize: '11px', color: '#991b1b' }}>Perlu Pelajari Pembahasan</span>
        </div>
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Soal Esai</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{stats.essay}</div>
          <span style={{ fontSize: '11px', color: '#92400e' }}>
            {attempt.needsManualGrading ? 'Menunggu Review' : 'Telah Dikoreksi'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', overflowX: 'auto'
      }}>
        {[
          { key: 'ALL', label: `Semua Soal (${stats.total})` },
          { key: 'CORRECT', label: `✓ Benar (${stats.correct})` },
          { key: 'WRONG', label: `✗ Salah (${stats.wrong})` },
          { key: 'ESSAY', label: `📝 Esai (${stats.essay})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            style={{
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeFilter === tab.key ? '#059669' : '#f1f5f9',
              color: activeFilter === tab.key ? '#ffffff' : '#475569'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Question Review List */}
      <div className="flex flex-col gap-4">
        {filteredQuestions.map((q) => {
          const ans = q.ans;
          const isEssay = q.isEssay;
          const isObjCorrect = q.isObjCorrect;

          return (
            <div
              key={q.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              {/* Header: Question Number & Badge status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: '#f1f5f9', color: '#1e293b', fontWeight: 800,
                    fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {q.index + 1}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                    {q.type.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  {isEssay ? (
                    <span style={{
                      fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                      background: ans?.isGraded ? '#f0fdf4' : '#fefce8',
                      color: ans?.isGraded ? '#166534' : '#92400e',
                      border: `1px solid ${ans?.isGraded ? '#bbf7d0' : '#fde68a'}`
                    }}>
                      {ans?.isGraded ? `${ans.earnedPoints} / ${q.points} Poin (Dinilai Dosen)` : `0 / ${q.points} Poin (Menunggu Koreksi)`}
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                      background: isObjCorrect ? '#f0fdf4' : '#fef2f2',
                      color: isObjCorrect ? '#166534' : '#991b1b',
                      border: `1px solid ${isObjCorrect ? '#bbf7d0' : '#fecaca'}`,
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      {isObjCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {ans?.earnedPoints || 0} / {q.points} Poin
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.6 }}>
                {q.questionText}
              </div>

              {/* Arabic Text */}
              {q.arabicText && (
                <div style={{
                  fontFamily: "'Amiri', 'Traditional Arabic', serif",
                  fontSize: '1.25rem',
                  lineHeight: 2,
                  color: '#065f46',
                  direction: 'rtl',
                  textAlign: 'right',
                  background: '#f0fdf4',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  borderRight: '5px solid #059669',
                  border: '1px solid #bbf7d0'
                }}>
                  {q.arabicText}
                </div>
              )}

              {/* Illustration Image */}
              {q.imageUrl && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', padding: '10px', maxHeight: '240px' }}>
                  <img src={q.imageUrl} alt="Ilustrasi Soal" style={{ maxHeight: '220px', objectFit: 'contain', borderRadius: '8px' }} />
                </div>
              )}

              {/* Answers & Options Display */}
              {q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH' ? (
                <div className="flex flex-col gap-2">
                  {q.options?.map((opt, optIdx) => {
                    const isSelected = ans?.selectedOptionId === opt.id;
                    const isCorrectKey = opt.isCorrect;
                    const labelLetter = String.fromCharCode(65 + optIdx);

                    let bg = '#ffffff';
                    let border = '1.5px solid #e2e8f0';
                    let badgeBg = '#f1f5f9';
                    let badgeColor = '#475569';

                    if (isCorrectKey) {
                      bg = '#f0fdf4';
                      border = '1.5px solid #059669';
                      badgeBg = '#059669';
                      badgeColor = '#ffffff';
                    } else if (isSelected && !isCorrectKey) {
                      bg = '#fef2f2';
                      border = '1.5px solid #dc2626';
                      badgeBg = '#dc2626';
                      badgeColor = '#ffffff';
                    }

                    return (
                      <div
                        key={opt.id}
                        style={{
                          padding: '12px 14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
                          border, background: bg, transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{
                            width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 800, background: badgeBg, color: badgeColor
                          }}>
                            {labelLetter}
                          </span>
                          <div style={{ flex: 1, fontSize: '0.9rem', color: '#1e293b', paddingTop: '2px' }}>
                            {opt.text}
                          </div>
                          {isSelected && (
                            <span style={{
                              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                              background: isCorrectKey ? '#dcfce7' : '#fee2e2',
                              color: isCorrectKey ? '#166534' : '#991b1b'
                            }}>
                              Pilihan Anda {isCorrectKey ? '✓' : '✗'}
                            </span>
                          )}
                          {isCorrectKey && !isSelected && (
                            <span style={{
                              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                              background: '#dcfce7', color: '#166534'
                            }}>
                              Kunci Jawaban ✓
                            </span>
                          )}
                        </div>

                        {opt.imageUrl && (
                          <div style={{ marginLeft: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', padding: '4px', maxWidth: '240px' }}>
                            <img src={opt.imageUrl} alt={`Opsi ${labelLetter}`} style={{ maxHeight: '140px', objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : q.type === 'JAWABAN_SINGKAT' ? (
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Jawaban Anda:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isObjCorrect ? '#166534' : '#991b1b' }}>
                    {ans?.shortAnswerText || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Tidak dijawab</span>}
                  </div>
                  {!isObjCorrect && q.correctShortAnswer && (
                    <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#065f46' }}>
                      Kunci Jawaban Resmi: <strong style={{ fontFamily: 'monospace' }}>{q.correctShortAnswer}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Jawaban Mahasiswa:</div>
                  <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {ans?.essayAnswerText || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Tidak ada jawaban tertulis.</span>}
                  </p>
                  {ans?.lecturerFeedback && (
                    <div style={{ marginTop: '8px', padding: '12px 14px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e40af' }}>
                      <strong>💬 Umpan Balik Dosen:</strong> {ans.lecturerFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation & References */}
              {q.explanation && (
                <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#065f46', lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                    <Sparkles size={14} style={{ color: '#059669' }} />
                    <span>Pembahasan & Dalil Rujukan:</span>
                  </div>
                  <div>{q.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

