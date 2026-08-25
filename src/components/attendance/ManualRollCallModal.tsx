import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Stethoscope, 
  Clock, 
  AlertCircle, 
  Check, 
  Search, 
  ShieldCheck,
  Save,
  RotateCcw
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { StudentAttendanceRecord, AttendanceStatus } from '../../types/attendance';

export interface ManualRollCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingNumber: number;
  meetingTitle: string;
  courseName: string;
  className: string;
  students: StudentAttendanceRecord[];
  onSaveBatch: (updatedRecords: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>) => Promise<void>;
  isLoading?: boolean;
}

export const ManualRollCallModal: React.FC<ManualRollCallModalProps> = ({
  isOpen,
  onClose,
  meetingNumber,
  meetingTitle,
  courseName,
  className,
  students,
  onSaveBatch,
  isLoading = false
}) => {
  // Local state of attendances being edited in roll call
  const [recordsMap, setRecordsMap] = useState<Record<string, { status: AttendanceStatus; notes: string; changed: boolean }>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  // Initialize records when students prop changes or modal opens
  useEffect(() => {
    if (isOpen && students.length > 0) {
      const initialMap: Record<string, { status: AttendanceStatus; notes: string; changed: boolean }> = {};
      students.forEach(st => {
        initialMap[st.studentId] = {
          status: st.status || 'ALPA',
          notes: st.notes || '',
          changed: false
        };
      });
      setRecordsMap(initialMap);
      setSearchQuery('');
      setFilterStatus('SEMUA');
    }
  }, [isOpen, students]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setRecordsMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        changed: true
      }
    }));
  };

  const handleSetNotes = (studentId: string, notes: string) => {
    setRecordsMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
        changed: true
      }
    }));
  };

  // Bulk actions
  const handleSetAllHadir = () => {
    setRecordsMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(sId => {
        next[sId] = { ...next[sId], status: 'HADIR', changed: true };
      });
      return next;
    });
  };

  const handleSetUnmarkedToAlpa = () => {
    setRecordsMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(sId => {
        if (next[sId].status !== 'HADIR' && next[sId].status !== 'SAKIT' && next[sId].status !== 'IZIN') {
          next[sId] = { ...next[sId], status: 'ALPA', changed: true };
        }
      });
      return next;
    });
  };

  const handleResetToOriginal = () => {
    const initialMap: Record<string, { status: AttendanceStatus; notes: string; changed: boolean }> = {};
    students.forEach(st => {
      initialMap[st.studentId] = {
        status: st.status || 'ALPA',
        notes: st.notes || '',
        changed: false
      };
    });
    setRecordsMap(initialMap);
  };

  // Save all changed or all records
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.entries(recordsMap).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      notes: data.notes
    }));
    await onSaveBatch(payload);
  };

  // Filtered student list
  const filteredStudents = students.filter(st => {
    const matchSearch = st.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || st.studentNim.includes(searchQuery);
    const currentStatus = recordsMap[st.studentId]?.status || st.status;
    const matchFilter = filterStatus === 'SEMUA' || currentStatus === filterStatus;
    return matchSearch && matchFilter;
  });

  // Calculate live statistics
  const liveStats = {
    hadir: Object.values(recordsMap).filter(r => r.status === 'HADIR').length,
    sakit: Object.values(recordsMap).filter(r => r.status === 'SAKIT').length,
    izin: Object.values(recordsMap).filter(r => r.status === 'IZIN').length,
    alpa: Object.values(recordsMap).filter(r => r.status === 'ALPA').length,
    total: students.length
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lembar Presensi Manual (Roll Call Dosen)"
      maxWidth="860px"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Header Summary Banner */}
        <div 
          style={{ 
            padding: 'var(--space-3) var(--space-4)', 
            backgroundColor: 'var(--color-primary-50)', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-primary-200)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary-800)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {courseName} — {className}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary-950)' }}>
                Pertemuan #{meetingNumber}: {meetingTitle}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="success">Hadir: {liveStats.hadir}</Badge>
              <Badge variant="info">Sakit: {liveStats.sakit}</Badge>
              <Badge variant="warning">Izin: {liveStats.izin}</Badge>
              <Badge variant="danger">Alpa: {liveStats.alpa}</Badge>
            </div>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} />
            <span>Fitur ini khusus Dosen Pengampu untuk verifikasi & pembaruan kehadiran tatap muka/kelas secara langsung.</span>
          </div>
        </div>

        {/* Action Controls & Fast Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Check}
              onClick={handleSetAllHadir}
            >
              Semua Hadir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={AlertCircle}
              onClick={handleSetUnmarkedToAlpa}
            >
              Sisanya Alpa
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetToOriginal}
            >
              Reset
            </Button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px', maxWidth: '300px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Cari nama / NIM mahasiswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-surface)'
              }}
            />
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {[
            { key: 'SEMUA', label: 'Semua', count: liveStats.total },
            { key: 'HADIR', label: 'Hadir', count: liveStats.hadir },
            { key: 'SAKIT', label: 'Sakit', count: liveStats.sakit },
            { key: 'IZIN', label: 'Izin', count: liveStats.izin },
            { key: 'ALPA', label: 'Alpa', count: liveStats.alpa }
          ].map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterStatus(f.key)}
              style={{
                padding: '4px 10px',
                fontSize: 'var(--text-xs)',
                fontWeight: filterStatus === f.key ? 700 : 500,
                borderRadius: 'var(--radius-md)',
                backgroundColor: filterStatus === f.key ? 'var(--color-primary-100)' : 'transparent',
                color: filterStatus === f.key ? 'var(--color-primary-900)' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Scrollable Student List */}
        <div 
          style={{ 
            maxHeight: '380px', 
            overflowY: 'auto', 
            border: '1px solid var(--border-default)', 
            borderRadius: 'var(--radius-lg)' 
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--border-default)', position: 'sticky', top: 0, zIndex: 5 }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '35%' }}>Nama Mahasiswa & NIM</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: '38%' }}>Status Kehadiran</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '27%' }}>Catatan / Dispensasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                    Tidak ada mahasiswa yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const current = recordsMap[st.studentId] || { status: st.status || 'ALPA', notes: '' };
                  const currentStatus = current.status;

                  return (
                    <tr 
                      key={st.studentId}
                      style={{ 
                        borderBottom: '1px solid var(--border-default)',
                        backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--color-slate-50)'
                      }}
                    >
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {st.studentName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          NIM: {st.studentNim}
                        </div>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div className="inline-flex rounded-md shadow-xs" role="group">
                          <button
                            type="button"
                            onClick={() => handleSetStatus(st.studentId, 'HADIR')}
                            style={{
                              padding: '5px 9px',
                              fontSize: '11px',
                              fontWeight: currentStatus === 'HADIR' ? 700 : 500,
                              borderTopLeftRadius: 'var(--radius-sm)',
                              borderBottomLeftRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-strong)',
                              borderRight: 'none',
                              backgroundColor: currentStatus === 'HADIR' ? 'var(--color-success-600)' : 'var(--bg-surface)',
                              color: currentStatus === 'HADIR' ? '#ffffff' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Tandai Hadir"
                          >
                            <CheckCircle2 size={12} />
                            Hadir
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(st.studentId, 'SAKIT')}
                            style={{
                              padding: '5px 9px',
                              fontSize: '11px',
                              fontWeight: currentStatus === 'SAKIT' ? 700 : 500,
                              border: '1px solid var(--border-strong)',
                              borderRight: 'none',
                              backgroundColor: currentStatus === 'SAKIT' ? '#0284c7' : 'var(--bg-surface)',
                              color: currentStatus === 'SAKIT' ? '#ffffff' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Tandai Sakit"
                          >
                            <Stethoscope size={12} />
                            Sakit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(st.studentId, 'IZIN')}
                            style={{
                              padding: '5px 9px',
                              fontSize: '11px',
                              fontWeight: currentStatus === 'IZIN' ? 700 : 500,
                              border: '1px solid var(--border-strong)',
                              borderRight: 'none',
                              backgroundColor: currentStatus === 'IZIN' ? '#d97706' : 'var(--bg-surface)',
                              color: currentStatus === 'IZIN' ? '#ffffff' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Tandai Izin"
                          >
                            <Clock size={12} />
                            Izin
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatus(st.studentId, 'ALPA')}
                            style={{
                              padding: '5px 9px',
                              fontSize: '11px',
                              fontWeight: currentStatus === 'ALPA' ? 700 : 500,
                              borderTopRightRadius: 'var(--radius-sm)',
                              borderBottomRightRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-strong)',
                              backgroundColor: currentStatus === 'ALPA' ? 'var(--color-danger-600)' : 'var(--bg-surface)',
                              color: currentStatus === 'ALPA' ? '#ffffff' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Tandai Alpa"
                          >
                            <AlertCircle size={12} />
                            Alpa
                          </button>
                        </div>
                      </td>

                      {/* Notes input */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          placeholder="Catatan..."
                          value={current.notes || ''}
                          onChange={(e) => handleSetNotes(st.studentId, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: 'var(--bg-surface)'
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer" style={{ margin: '0 calc(-1 * var(--space-5)) calc(-1 * var(--space-5))' }}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={isLoading}>
            Tutup
          </Button>
          <Button variant="primary" type="submit" icon={Save} isLoading={isLoading}>
            Simpan Seluruh Rekap Presensi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
