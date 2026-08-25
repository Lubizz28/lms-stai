import { AuditLogEntry } from '../types/auth';
import { UserRole } from '../types/roles';

const STORAGE_KEY = 'salam_audit_logs';

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

class AuditService {
  private memoryLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

  public getLogs(): AuditLogEntry[] {
    try {
      if (typeof localStorage === 'undefined') {
        return this.memoryLogs;
      }
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      return JSON.parse(data);
    } catch {
      return this.memoryLogs;
    }
  }

  public record(
    actorId: string,
    actorName: string,
    actorRole: UserRole,
    action: string,
    resource: string,
    details?: string,
    status: 'SUKSES' | 'GAGAL' | 'DITOLAK' = 'SUKSES'
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      actorRole,
      action,
      resource,
      details,
      ipAddress: '127.0.0.1 (Klien Lokal)',
      status
    };

    const currentLogs = this.getLogs();
    const updated = [entry, ...currentLogs].slice(0, 200); // Simpan max 200 logs
    this.memoryLogs = updated;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Gagal menyimpan audit log ke localStorage:', e);
    }
    return entry;
  }

  public fetchAll(): AuditLogEntry[] {
    return this.getLogs();
  }

  public clear(): void {
    this.memoryLogs = [];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }
}

export const auditService = new AuditService();
