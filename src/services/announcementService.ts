/**
 * Layanan Modul Pengumuman & Informasi Kampus
 * SALAM LMS — STAI AL-ITTIHAD CIANJUR
 */

import { 
  AnnouncementItem, 
  StudentAnnouncementState 
} from '../types/announcement';

const STORAGE_KEY_STATE = 'salam_announcements_student_state';

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [];

class AnnouncementService {
  private announcements: AnnouncementItem[] = INITIAL_ANNOUNCEMENTS;

  private memoryStates: Record<string, Record<string, StudentAnnouncementState>> = {};

  /**
   * Mengambil semua state pengumuman mahasiswa dari local storage
   */
  private getStudentStates(studentId: string): Record<string, StudentAnnouncementState> {
    try {
      if (typeof localStorage === 'undefined') {
        return this.memoryStates[studentId] || {};
      }
      const raw = localStorage.getItem(`${STORAGE_KEY_STATE}_${studentId}`);
      return raw ? JSON.parse(raw) : (this.memoryStates[studentId] || {});
    } catch {
      return this.memoryStates[studentId] || {};
    }
  }

  /**
   * Menyimpan state pengumuman mahasiswa ke local storage
   */
  private saveStudentStates(studentId: string, states: Record<string, StudentAnnouncementState>): void {
    this.memoryStates[studentId] = states;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_STATE}_${studentId}`, JSON.stringify(states));
      }
    } catch (e) {
      console.warn('Gagal menyimpan status pengumuman:', e);
    }
  }

  /**
   * Mengambil daftar pengumuman untuk mahasiswa beserta status baca & bookmark
   */
  public getAnnouncements(studentId: string = 'usr-mhs-01'): (AnnouncementItem & { isRead: boolean; isBookmarked: boolean })[] {
    const states = this.getStudentStates(studentId);

    return this.announcements.map((item) => {
      const state = states[item.id];
      return {
        ...item,
        isRead: state ? state.isRead : false,
        isBookmarked: state ? state.isBookmarked : false
      };
    });
  }

  /**
   * Mengambil satu pengumuman berdasarkan ID atau Slug
   */
  public getAnnouncementById(idOrSlug: string, studentId: string = 'usr-mhs-01'): (AnnouncementItem & { isRead: boolean; isBookmarked: boolean }) | null {
    const item = this.announcements.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
    if (!item) return null;

    const states = this.getStudentStates(studentId);
    const state = states[item.id];

    return {
      ...item,
      isRead: state ? state.isRead : false,
      isBookmarked: state ? state.isBookmarked : false
    };
  }

  /**
   * Menandai pengumuman sebagai telah dibaca
   */
  public markAsRead(announcementId: string, studentId: string = 'usr-mhs-01'): void {
    const states = this.getStudentStates(studentId);
    states[announcementId] = {
      announcementId,
      isRead: true,
      readAt: new Date().toISOString(),
      isBookmarked: states[announcementId]?.isBookmarked || false
    };
    this.saveStudentStates(studentId, states);
  }

  /**
   * Menandai SEMUA pengumuman sebagai telah dibaca
   */
  public markAllAsRead(studentId: string = 'usr-mhs-01'): void {
    const states = this.getStudentStates(studentId);
    const now = new Date().toISOString();

    this.announcements.forEach((item) => {
      states[item.id] = {
        announcementId: item.id,
        isRead: true,
        readAt: states[item.id]?.readAt || now,
        isBookmarked: states[item.id]?.isBookmarked || false
      };
    });

    this.saveStudentStates(studentId, states);
  }

  /**
   * Mengubah status bookmark / simpan pengumuman
   */
  public toggleBookmark(announcementId: string, studentId: string = 'usr-mhs-01'): boolean {
    const states = this.getStudentStates(studentId);
    const current = states[announcementId];
    const newBookmarked = current ? !current.isBookmarked : true;

    states[announcementId] = {
      announcementId,
      isRead: current ? current.isRead : false,
      readAt: current?.readAt,
      isBookmarked: newBookmarked
    };

    this.saveStudentStates(studentId, states);
    return newBookmarked;
  }

  /**
   * Mengambil statistik ringkasan pengumuman untuk badge & dashboard
   */
  public getAnnouncementStats(studentId: string = 'usr-mhs-01'): {
    total: number;
    unreadCount: number;
    pinnedCount: number;
    bookmarkedCount: number;
    urgentCount: number;
  } {
    const items = this.getAnnouncements(studentId);
    const total = items.length;
    const unreadCount = items.filter((i) => !i.isRead).length;
    const pinnedCount = items.filter((i) => i.isPinned).length;
    const bookmarkedCount = items.filter((i) => i.isBookmarked).length;
    const urgentCount = items.filter((i) => i.urgency === 'PENTING').length;

    return {
      total,
      unreadCount,
      pinnedCount,
      bookmarkedCount,
      urgentCount
    };
  }
}

export const announcementService = new AnnouncementService();
