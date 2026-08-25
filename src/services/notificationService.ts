import { InAppNotification, NotificationFilter } from '../types/notification';
import { UserRole } from '../types/roles';

const NOTIFICATIONS_STORAGE_KEY = 'salam_in_app_notifications';

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [];

class NotificationService {
  /**
   * Mengambil seluruh notifikasi yang relevan dengan user dan perannya
   */
  public getNotifications(userId: string, userRole?: UserRole, filter?: NotificationFilter): InAppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      let list: InAppNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;

      // Filter berdasarkan userId langsung ATAU targetRoles
      let filtered = list.filter((n) => {
        if (n.userId && n.userId === userId) return true;
        if (userRole && n.targetRoles && n.targetRoles.includes(userRole)) return true;
        // Default match untuk akun demo berdasarkan awalan id atau role
        if (userId.startsWith('usr-') && n.userId === userId) return true;
        return false;
      });

      // Filter tambahan jika disediakan
      if (filter) {
        if (filter.category && filter.category !== 'SEMUA') {
          filtered = filtered.filter((n) => n.category === filter.category);
        }
        if (filter.unreadOnly) {
          filtered = filtered.filter((n) => !n.isRead);
        }
        if (filter.priority) {
          filtered = filtered.filter((n) => n.priority === filter.priority);
        }
        if (filter.search && filter.search.trim()) {
          const q = filter.search.toLowerCase();
          filtered = filtered.filter((n) => 
            n.title.toLowerCase().includes(q) || 
            n.message.toLowerCase().includes(q) ||
            (n.senderName && n.senderName.toLowerCase().includes(q))
          );
        }
      }

      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return INITIAL_NOTIFICATIONS.filter((n) => n.userId === userId);
    }
  }

  /**
   * Mengambil total notifikasi yang belum dibaca
   */
  public getUnreadCount(userId: string, userRole?: UserRole): number {
    return this.getNotifications(userId, userRole, { unreadOnly: true }).length;
  }

  /**
   * Menandai satu notifikasi sebagai telah dibaca
   */
  public markAsRead(notificationId: string): void {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const item = list.find((n) => n.id === notificationId);
    if (item) {
      item.isRead = true;
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      this.broadcastUpdate();
    }
  }

  /**
   * Menandai satu notifikasi sebagai belum dibaca
   */
  public markAsUnread(notificationId: string): void {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const item = list.find((n) => n.id === notificationId);
    if (item) {
      item.isRead = false;
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      this.broadcastUpdate();
    }
  }

  /**
   * Menandai seluruh notifikasi user/role sebagai telah dibaca
   */
  public markAllAsRead(userId: string, userRole?: UserRole): void {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    list.forEach((n) => {
      if (n.userId === userId || (userRole && n.targetRoles?.includes(userRole))) {
        n.isRead = true;
      }
    });
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    this.broadcastUpdate();
  }

  /**
   * Menghapus satu notifikasi
   */
  public deleteNotification(notificationId: string): void {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const updated = list.filter((n) => n.id !== notificationId);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    this.broadcastUpdate();
  }

  /**
   * Menghapus seluruh notifikasi yang telah dibaca
   */
  public clearReadNotifications(userId: string, userRole?: UserRole): void {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const updated = list.filter((n) => {
      const isTarget = n.userId === userId || (userRole && n.targetRoles?.includes(userRole));
      return !(isTarget && n.isRead);
    });
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    this.broadcastUpdate();
  }

  /**
   * Membuat notifikasi baru secara dinamis
   */
  public createNotification(notification: Omit<InAppNotification, 'id' | 'isRead' | 'createdAt'>): InAppNotification {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    const newNotif: InAppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    list.unshift(newNotif);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    this.broadcastUpdate();
    return newNotif;
  }

  // =========================================================================
  // HELPER METODE REAKTIF UNTUK EVENT SISTEM
  // =========================================================================

  public notifyAssignmentGraded(studentId: string, assignmentTitle: string, score: number, lecturerName: string): InAppNotification {
    return this.createNotification({
      userId: studentId,
      targetRoles: ['mahasiswa'],
      title: 'Tugas Selesai Dinilai',
      message: `${lecturerName} telah menerbitkan nilai untuk "${assignmentTitle}". Nilai Anda: ${score}/100.`,
      category: 'NILAI',
      priority: 'TINGGI',
      deepLinkPath: '/buku-nilai',
      actionLabel: 'Lihat Lembar Nilai',
      senderName: lecturerName,
      senderRole: 'Dosen Pengampu'
    });
  }

  public notifyAssignmentSubmitted(lecturerId: string, studentName: string, assignmentTitle: string): InAppNotification {
    return this.createNotification({
      userId: lecturerId,
      targetRoles: ['dosen'],
      title: 'Pengumpulan Tugas Baru',
      message: `${studentName} telah mengumpulkan berkas tugas pada "${assignmentTitle}".`,
      category: 'TUGAS',
      priority: 'SEDANG',
      deepLinkPath: '/tugas',
      actionLabel: 'Buka Lembar Penilaian',
      senderName: studentName,
      senderRole: 'Mahasiswa'
    });
  }

  public notifyKrsSubmitted(advisorId: string, studentName: string, totalSks: number): InAppNotification {
    return this.createNotification({
      userId: advisorId,
      targetRoles: ['dosen_pa'],
      title: 'Pengajuan KRS Mahasiswa Bimbingan',
      message: `${studentName} mengajukan persetujuan paket rencana studi (${totalSks} SKS).`,
      category: 'KRS',
      priority: 'TINGGI',
      deepLinkPath: '/krs',
      actionLabel: 'Tinjau & Setujui KRS',
      senderName: studentName,
      senderRole: 'Mahasiswa'
    });
  }

  public notifyKrsApproved(studentId: string, advisorName: string): InAppNotification {
    return this.createNotification({
      userId: studentId,
      targetRoles: ['mahasiswa'],
      title: 'KRS Akademik Disetujui',
      message: `Dosen Pembimbing Akademik (${advisorName}) telah menyetujui dan mengesahkan KRS Anda.`,
      category: 'KRS',
      priority: 'TINGGI',
      deepLinkPath: '/krs',
      actionLabel: 'Cetak Lembar KRS',
      senderName: advisorName,
      senderRole: 'Dosen Pembimbing Akademik'
    });
  }

  public notifyEwsAlert(targetUserId: string, targetRole: UserRole, studentName: string, issue: string): InAppNotification {
    return this.createNotification({
      userId: targetUserId,
      targetRoles: [targetRole],
      title: 'Peringatan Dini Akademik (EWS)',
      message: `Sistem EWS mendeteksi indikator risiko pada mahasiswa ${studentName}: ${issue}.`,
      category: 'EWS',
      priority: 'TINGGI',
      deepLinkPath: '/laporan-monitoring',
      actionLabel: 'Buka Monitoring EWS',
      senderName: 'Early Warning System'
    });
  }

  public notifySecurityAlert(title: string, message: string): InAppNotification {
    return this.createNotification({
      targetRoles: ['administrator_sistem'],
      title,
      message,
      category: 'KEAMANAN',
      priority: 'TINGGI',
      deepLinkPath: '/admin/audit-logs',
      actionLabel: 'Buka Audit Logs',
      senderName: 'Sistem Keamanan SALAM'
    });
  }

  public notifySystemBroadcast(title: string, message: string, targetRoles: UserRole[], deepLinkPath = '/'): InAppNotification {
    return this.createNotification({
      targetRoles,
      title,
      message,
      category: 'PENGUMUMAN',
      priority: 'SEDANG',
      deepLinkPath,
      actionLabel: 'Buka Pengumuman',
      senderName: 'Pusat Informasi STAI AL-ITTIHAD'
    });
  }

  private broadcastUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('salam_notification_updated'));
    }
  }
}

export const notificationService = new NotificationService();
