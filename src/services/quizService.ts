import { 
  Quiz, 
  BankQuestion, 
  QuizAttempt 
} from '../types/quiz';
import { auditService } from './auditService';

const QUIZZES_STORAGE_KEY = 'salam_quizzes';
const BANK_QUESTIONS_KEY = 'salam_bank_questions';
const ATTEMPTS_STORAGE_KEY = 'salam_quiz_attempts';
export const INITIAL_BANK_QUESTIONS: BankQuestion[] = [];

export const INITIAL_QUIZZES: Quiz[] = [];

class QuizService {
  private memoryAttempts: QuizAttempt[] = [];

  public getQuizzes(classId?: string, isStudent = false): Quiz[] {
    try {
      if (typeof localStorage === 'undefined') {
        let list = INITIAL_QUIZZES;
        if (classId) list = list.filter((q) => q.classId === classId);
        if (isStudent) list = list.filter((q) => q.status === 'DITERBITKAN');
        return list;
      }
      const raw = localStorage.getItem(QUIZZES_STORAGE_KEY);
      let list: Quiz[] = raw ? JSON.parse(raw) : INITIAL_QUIZZES;
      if (classId) {
        list = list.filter((q) => q.classId === classId);
      }
      if (isStudent) {
        list = list.filter((q) => q.status === 'DITERBITKAN');
      }
      return list;
    } catch {
      return INITIAL_QUIZZES;
    }
  }

  public getQuizById(quizId: string): Quiz | undefined {
    return this.getQuizzes().find((q) => q.id === quizId);
  }

  public saveQuizzes(quizzes: Quiz[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
      }
    } catch {
      // ignore
    }
  }

  public createQuiz(quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Quiz {
    const list = this.getQuizzes();
    const newId = `qz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const questionsWithQuizId = (quizData.questions || []).map((q, idx) => ({
      ...q,
      id: q.id || `qz-q-${newId}-${idx + 1}`,
      quizId: newId,
      questionNumber: idx + 1
    }));

    const totalPoints = questionsWithQuizId.reduce((sum, q) => sum + (q.points || 0), 0);

    const newQuiz: Quiz = {
      ...quizData,
      id: newId,
      questions: questionsWithQuizId,
      totalPoints: totalPoints || 100,
      createdAt: now,
      updatedAt: now
    };

    list.unshift(newQuiz);
    this.saveQuizzes(list);
    return newQuiz;
  }

  public getBankQuestions(courseCode?: string): BankQuestion[] {
    try {
      if (typeof localStorage === 'undefined') {
        let list = INITIAL_BANK_QUESTIONS;
        if (courseCode) list = list.filter((b) => b.courseCode === courseCode);
        return list;
      }
      const raw = localStorage.getItem(BANK_QUESTIONS_KEY);
      let list: BankQuestion[] = raw ? JSON.parse(raw) : [];

      // Merge standard seeds so all curriculum courses are always populated
      const existingIds = new Set(list.map((q) => q.id));
      let hasChange = false;
      INITIAL_BANK_QUESTIONS.forEach((seedQ) => {
        if (!existingIds.has(seedQ.id)) {
          list.push(seedQ);
          hasChange = true;
        }
      });

      // Sanitize fields to prevent any undefined crashes
      list = list.map((q) => ({
        ...q,
        courseCode: q.courseCode || 'PAI-301',
        topic: q.topic || 'Umum',
        questionText: q.questionText || '',
        tags: Array.isArray(q.tags) ? q.tags : [],
        options: Array.isArray(q.options) ? q.options : [],
      }));

      if (hasChange || !raw) {
        localStorage.setItem(BANK_QUESTIONS_KEY, JSON.stringify(list));
      }

      if (courseCode) {
        list = list.filter((b) => b.courseCode === courseCode);
      }
      return list;
    } catch {
      return INITIAL_BANK_QUESTIONS;
    }
  }

  public addBankQuestion(question: Omit<BankQuestion, 'id' | 'createdAt'>): BankQuestion {
    const list = this.getBankQuestions();
    const newQ: BankQuestion = {
      ...question,
      id: `bq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    list.push(newQ);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BANK_QUESTIONS_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
    return newQ;
  }

  public updateBankQuestion(id: string, updatedData: Partial<BankQuestion>): BankQuestion {
    const list = this.getBankQuestions();
    const index = list.findIndex((q) => q.id === id);
    if (index === -1) {
      throw new Error('Butir soal tidak ditemukan di Bank Soal.');
    }
    const updated: BankQuestion = {
      ...list[index],
      ...updatedData,
      id: list[index].id,
      createdAt: list[index].createdAt
    };
    list[index] = updated;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BANK_QUESTIONS_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
    return updated;
  }

  public deleteBankQuestion(id: string): void {
    let list = this.getBankQuestions();
    list = list.filter((q) => q.id !== id);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BANK_QUESTIONS_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  }

  public getAttempts(): QuizAttempt[] {
    try {
      if (typeof localStorage === 'undefined') {
        return this.memoryAttempts;
      }
      const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return this.memoryAttempts;
    }
  }

  private saveAttempts(attempts: QuizAttempt[]): void {
    this.memoryAttempts = attempts;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
      }
    } catch {
      // ignore in SSR / node
    }
  }

  public getStudentAttempts(quizId: string, studentId: string): QuizAttempt[] {
    return this.getAttempts().filter(
      (a) => a.quizId === quizId && a.studentId === studentId
    ).sort((a, b) => a.attemptNumber - b.attemptNumber);
  }

  public getAttemptById(attemptId: string, actorUserId: string, isLecturer = false): QuizAttempt {
    const attempt = this.getAttempts().find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Percobaan kuis tidak ditemukan.');

    // Validasi Isolasi Kepemilikan (Ownership Isolation)
    if (!isLecturer && attempt.studentId !== actorUserId) {
      throw new Error('Akses Ditolak: Anda tidak memiliki kewenangan mengakses lembar jawaban pengguna lain.');
    }

    return attempt;
  }

  /**
   * MEMULAI PERCOBAAN KUIS (START ATTEMPT)
   * Mengatur timer berbasis server (expiresAt)
   */
  public startQuizAttempt(
    quizId: string,
    studentId: string,
    studentNim: string,
    studentName: string
  ): QuizAttempt {
    const quiz = this.getQuizById(quizId);
    if (!quiz) throw new Error('Kuis tidak ditemukan.');

    const attempts = this.getAttempts();
    const existingStudentAttempts = attempts.filter(
      (a) => a.quizId === quizId && a.studentId === studentId
    );

    // Cek apakah masih ada attempt aktif (SEDANG_DIKERJAKAN)
    const activeAttempt = existingStudentAttempts.find(
      (a) => a.status === 'SEDANG_DIKERJAKAN'
    );
    if (activeAttempt) {
      // Cek apakah timer server sudah lewat
      const now = new Date();
      const expires = new Date(activeAttempt.expiresAt);
      if (now > expires) {
        // Auto submit karena waktu habis
        return this.submitQuizAttempt(activeAttempt.id, studentId);
      }
      return activeAttempt;
    }

    // Cek batas percobaan maksimum: jika sudah mencapai batas, kembalikan attempt terakhir
    if (existingStudentAttempts.length >= quiz.maxAttempts) {
      return existingStudentAttempts[existingStudentAttempts.length - 1];
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + quiz.durationMinutes * 60000).toISOString();

    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      classId: quiz.classId,
      studentId,
      studentNim,
      studentName,
      attemptNumber: existingStudentAttempts.length + 1,
      status: 'SEDANG_DIKERJAKAN',
      startedAt: now.toISOString(),
      expiresAt,
      answers: {},
      totalEarnedPoints: 0,
      finalScore: 0,
      isPassed: false,
      needsManualGrading: quiz.questions.some((q) => q.type === 'ESAI')
    };

    // Inisialisasi entri jawaban kosong
    quiz.questions.forEach((q) => {
      newAttempt.answers[q.id] = {
        questionId: q.id,
        isGraded: false,
        lastSavedAt: now.toISOString()
      };
    });

    attempts.push(newAttempt);
    this.saveAttempts(attempts);

    auditService.record(
      studentId,
      studentName,
      'mahasiswa',
      'MULAI_KUIS',
      'KUIS_DARING',
      `Mahasiswa memulai pengerjaan ${quiz.title} (Percobaan ke-${newAttempt.attemptNumber}).`,
      'SUKSES'
    );

    return newAttempt;
  }

  /**
   * AUTOSAVE JAWABAN PER BUTIR SOAL
   */
  public autosaveAnswer(
    attemptId: string,
    studentId: string,
    questionId: string,
    answerData: {
      selectedOptionId?: string;
      shortAnswerText?: string;
      essayAnswerText?: string;
      isDoubtful?: boolean;
    }
  ): QuizAttempt {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Percobaan kuis tidak ditemukan.');

    if (attempt.studentId !== studentId) {
      throw new Error('Akses Ditolak: Lembar kuis ini bukan milik Anda.');
    }

    if (attempt.status !== 'SEDANG_DIKERJAKAN') {
      throw new Error('Kuis telah dikumpulkan atau dinilai, perubahan tidak diizinkan.');
    }

    const now = new Date().toISOString();
    attempt.answers[questionId] = {
      ...attempt.answers[questionId],
      ...answerData,
      lastSavedAt: now
    };

    this.saveAttempts(attempts);
    return attempt;
  }

  /**
   * PENGUMPULAN KUIS (SUBMIT ATTEMPT)
   * Idempotent & Anti Double-Submit: Jika sudah dikumpulkan, kembalikan hasil tanpa duplicate scoring.
   */
  public submitQuizAttempt(attemptId: string, studentId: string): QuizAttempt {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Percobaan kuis tidak ditemukan.');

    if (attempt.studentId !== studentId) {
      throw new Error('Akses Ditolak: Anda tidak dapat mengumpulkan kuis milik orang lain.');
    }

    // Idempotency: Jika sudah dikumpulkan atau dinilai, kembalikan attempt yang ada
    if (attempt.status === 'DIKUMPULKAN' || attempt.status === 'DINILAI') {
      return attempt;
    }

    const quiz = this.getQuizById(attempt.quizId);
    if (!quiz) throw new Error('Data kuis tidak ditemukan.');

    const now = new Date().toISOString();
    let totalEarnedPoints = 0;
    let hasUngradedEssay = false;

    // Evaluasi otomatis soal objektif
    quiz.questions.forEach((q) => {
      const studentAns = attempt.answers[q.id];
      if (!studentAns) return;

      if (q.type === 'PILIHAN_GANDA' || q.type === 'BENAR_SALAH') {
        const correctOpt = q.options?.find((o) => o.isCorrect);
        const isCorrect = !!correctOpt && studentAns.selectedOptionId === correctOpt.id;
        studentAns.earnedPoints = isCorrect ? q.points : 0;
        studentAns.isGraded = true;
        totalEarnedPoints += studentAns.earnedPoints;
      } else if (q.type === 'JAWABAN_SINGKAT') {
        const expected = (q.correctShortAnswer || '').trim().toLowerCase();
        const actual = (studentAns.shortAnswerText || '').trim().toLowerCase();
        const isCorrect = expected.length > 0 && expected === actual;
        studentAns.earnedPoints = isCorrect ? q.points : 0;
        studentAns.isGraded = true;
        totalEarnedPoints += studentAns.earnedPoints;
      } else if (q.type === 'ESAI') {
        hasUngradedEssay = true;
        studentAns.isGraded = false; // Memerlukan penilaian manual dosen
      }
    });

    attempt.submittedAt = now;
    attempt.totalEarnedPoints = totalEarnedPoints;
    attempt.needsManualGrading = hasUngradedEssay;

    if (!hasUngradedEssay) {
      // Semua soal objektif: langsung hitung nilai akhir
      const finalScore = Math.round((totalEarnedPoints / quiz.totalPoints) * 100);
      attempt.finalScore = finalScore;
      attempt.isPassed = finalScore >= quiz.passingScore;
      attempt.status = 'DINILAI';
      attempt.gradedAt = now;
    } else {
      attempt.status = 'DIKUMPULKAN'; // Menunggu penilaian esai oleh dosen
      // Skor sementara dari bagian objektif
      attempt.finalScore = Math.round((totalEarnedPoints / quiz.totalPoints) * 100);
      attempt.isPassed = false;
    }

    this.saveAttempts(attempts);

    auditService.record(
      studentId,
      attempt.studentName,
      'mahasiswa',
      'KUMPULKAN_KUIS',
      'KUIS_DARING',
      `Mahasiswa mengumpulkan ${quiz.title}. Skor objektif: ${totalEarnedPoints} poin.`,
      'SUKSES'
    );

    return attempt;
  }

  /**
   * PENILAIAN ESAI OLEH DOSEN (ESSAY GRADING QUEUE)
   */
  public gradeEssayAnswer(
    attemptId: string,
    questionId: string,
    awardedPoints: number,
    feedback: string,
    lecturerName: string
  ): QuizAttempt {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Percobaan kuis tidak ditemukan.');

    const quiz = this.getQuizById(attempt.quizId);
    if (!quiz) throw new Error('Data kuis tidak ditemukan.');

    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question || question.type !== 'ESAI') {
      throw new Error('Soal esai tidak valid.');
    }

    // Validasi poin tidak melebihi batas poin soal
    const validPoints = Math.min(Math.max(awardedPoints, 0), question.points);

    if (!attempt.answers[questionId]) {
      attempt.answers[questionId] = {
        questionId,
        isGraded: true,
        lastSavedAt: new Date().toISOString()
      };
    }

    attempt.answers[questionId].earnedPoints = validPoints;
    attempt.answers[questionId].isGraded = true;
    attempt.answers[questionId].lecturerFeedback = feedback;

    // Cek apakah semua soal (termasuk semua esai) sudah dinilai
    const allGraded = quiz.questions.every((q) => attempt.answers[q.id]?.isGraded);

    // Hitung ulang total poin
    let totalPoints = 0;
    quiz.questions.forEach((q) => {
      totalPoints += attempt.answers[q.id]?.earnedPoints || 0;
    });

    attempt.totalEarnedPoints = totalPoints;
    attempt.finalScore = Math.round((totalPoints / quiz.totalPoints) * 100);
    attempt.isPassed = attempt.finalScore >= quiz.passingScore;

    if (allGraded) {
      attempt.status = 'DINILAI';
      attempt.needsManualGrading = false;
      attempt.gradedAt = new Date().toISOString();
      attempt.gradedByLecturerName = lecturerName;
    }

    this.saveAttempts(attempts);
    return attempt;
  }

  /**
   * RESET PERCOBAAN KUIS (Untuk Evaluator / Dosen / Simulasi)
   */
  public resetStudentAttempts(quizId: string, studentId: string): void {
    const attempts = this.getAttempts();
    const filtered = attempts.filter((a) => !(a.quizId === quizId && a.studentId === studentId));
    this.saveAttempts(filtered);
  }
}

export const quizService = new QuizService();
