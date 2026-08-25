/**
 * Inisialisasi & Reset Data Bersih untuk Produksi SALAM LMS
 * STAI AL-ITTIHAD CIANJUR
 */

const PROD_CLEAN_VERSION = 'salam_clean_prod_v2';
const VERSION_KEY = 'salam_system_version';

export function checkAndResetStaleData(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const currentVersion = localStorage.getItem(VERSION_KEY);
    if (currentVersion !== PROD_CLEAN_VERSION) {
      const keysToClear = [
        'salam_auth_session',
        'salam_quizzes',
        'salam_bank_questions',
        'salam_quiz_attempts',
        'salam_assignments',
        'salam_assignment_submissions',
        'salam_discussion_threads',
        'salam_discussion_posts',
        'salam_forum_participations',
        'salam_in_app_notifications',
        'salam_announcements_student_state',
        'salam_audit_logs',
        'salam_interactive_videos',
        'salam_video_progress',
        'salam_krs_students_v1',
        'salam_krs_consultations_v1'
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(VERSION_KEY, PROD_CLEAN_VERSION);
    }
  } catch {
    // Ignore storage errors
  }
}
