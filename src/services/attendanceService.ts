import { attendanceApi } from '../api/attendanceApi';
import { 
  MeetingAttendanceData, 
  ClassAttendanceSummaryData, 
  StudentCourseAttendanceHistory,
  LearningDeliveryMode,
  AttendanceStatus,
  AttendanceRecordMethod,
  StudentAttendanceRecord
} from '../types/attendance';
import { learningService } from './learningService';
import { academicService } from './academicService';

const ATT_STORAGE_KEY_PREFIX = 'salam_att_session_';

export const MASTER_STUDENTS_LIST = [
  { studentId: 'usr-mhs-01', studentName: 'Ahmad Fauzi Rahman', studentNim: '21.01.0042', studentEmail: 'ahmad.fauzi@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-02', studentName: 'Siti Fatimah Zahra', studentNim: '22.01.0015', studentEmail: 'fatimah.zahra@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-03', studentName: 'Habibullah Al-Habsyi', studentNim: '23.01.0028', studentEmail: 'habibullah@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-04', studentName: 'Muhammad Ridwan Nur', studentNim: '22.02.0008', studentEmail: 'm.ridwan.nur@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-05', studentName: 'Aulia Rahmawati', studentNim: '23.02.0019', studentEmail: 'aulia.rahma@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-06', studentName: 'Ali Haidar Rasyid', studentNim: '22.03.0012', studentEmail: 'ali.haidar@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-07', studentName: 'Nurul Izzah Fitriani', studentNim: '23.03.0033', studentEmail: 'nurul.izzah@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-08', studentName: 'Zahid Abdul Malik', studentNim: '23.04.0005', studentEmail: 'zahid.malik@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-09', studentName: 'Salma Mutmainnah', studentNim: '24.04.0022', studentEmail: 'salma.mutmainnah@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-10', studentName: 'Farhan Ramadhan', studentNim: '23.05.0014', studentEmail: 'farhan.ramadhan@student.stai-alittihad.ac.id' },
  { studentId: 'usr-mhs-11', studentName: 'Nabilah Husna', studentNim: '24.05.0009', studentEmail: 'nabilah.husna@student.stai-alittihad.ac.id' }
];

function generateLocalSessionFallback(meetingId: string): MeetingAttendanceData {
  const mtg = learningService.getMeetingById(meetingId);
  const classes = academicService.getClasses();
  const cls = classes.find(c => c.id === mtg?.classId) || classes[0];

  const meetingNumber = mtg?.meetingNumber || 1;
  const savedRaw = localStorage.getItem(`${ATT_STORAGE_KEY_PREFIX}${meetingId}`);
  const savedState = savedRaw ? JSON.parse(savedRaw) : null;

  // Generate students attendance with sample initial status
  const students: StudentAttendanceRecord[] = MASTER_STUDENTS_LIST.map((st, idx) => {
    let defaultStatus: AttendanceStatus = 'HADIR';
    let method: AttendanceRecordMethod | undefined = 'QR_SCAN';
    let notes: string | undefined = 'Presensi QR Dinamis';

    if (meetingNumber === 2 && idx === 3) {
      defaultStatus = 'SAKIT';
      method = 'SURAT_IZIN';
      notes = 'Izin Sakit Surat Dokter';
    } else if (meetingNumber === 1 && idx === 6) {
      defaultStatus = 'IZIN';
      method = 'MANUAL_DOSEN';
      notes = 'Izin Acara Keluarga';
    } else if (meetingNumber > 2) {
      defaultStatus = idx % 5 === 0 ? 'HADIR' : (idx % 7 === 0 ? 'IZIN' : 'ALPA');
      method = defaultStatus === 'HADIR' ? 'QR_SCAN' : undefined;
      notes = undefined;
    }

    if (savedState?.students) {
      const found = savedState.students.find((s: any) => s.studentId === st.studentId);
      if (found) {
        defaultStatus = found.status;
        method = found.method;
        notes = found.notes;
      }
    }

    return {
      studentId: st.studentId,
      studentName: st.studentName,
      studentNim: st.studentNim,
      studentEmail: st.studentEmail,
      status: defaultStatus,
      method,
      recordedAt: defaultStatus !== 'ALPA' ? new Date(Date.now() - 3600000).toISOString() : undefined,
      notes,
      attachmentUrl: defaultStatus === 'SAKIT' ? 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800' : undefined
    };
  });

  const countHadir = students.filter(s => s.status === 'HADIR').length;
  const countSakit = students.filter(s => s.status === 'SAKIT').length;
  const countIzin = students.filter(s => s.status === 'IZIN').length;
  const countAlpa = students.filter(s => s.status === 'ALPA').length;
  const totalStudents = students.length;
  const attendancePercentage = Math.round((countHadir / totalStudents) * 100);

  return {
    meeting: {
      id: meetingId,
      classId: cls?.id || 'cls-pai301-a',
      className: cls?.name || 'Kelas A',
      classCode: cls?.code || 'PAI-301-A',
      courseName: cls?.courseName || 'Ushul Fiqih & Qawaid Fiqhiyyah',
      credits: cls?.credits || 3,
      lecturerName: cls?.lecturerName || 'Dr. H. M. Ridwan, M.Ag',
      lecturerId: cls?.lecturerId || 'usr-dsn-01',
      meetingNumber,
      title: mtg?.title || `Pertemuan #${meetingNumber}`,
      topic: mtg?.topic || 'Pokok Bahasan Perkuliahan',
      scheduledDate: mtg?.scheduledDate || new Date().toISOString().split('T')[0],
      startTime: mtg?.startTime || '08:00',
      endTime: mtg?.endTime || '10:30'
    },
    session: {
      id: `ses-${meetingId}`,
      meetingId,
      classId: cls?.id || 'cls-pai301-a',
      lecturerId: cls?.lecturerId || 'usr-dsn-01',
      sessionStatus: savedState?.sessionStatus || (meetingNumber === 1 ? 'DITUTUP' : (meetingNumber === 2 ? 'DIBUKA' : 'BELUM_DIBUKA')),
      deliveryMode: savedState?.deliveryMode || 'TATAP_MUKA',
      qrToken: `QR_TOKEN_STAI_${meetingId}`,
      qrExpiresAt: new Date(Date.now() + 30000).toISOString(),
      passcode: savedState?.passcode || `84920${meetingNumber % 10}`,
      openedAt: meetingNumber <= 2 ? new Date(Date.now() - 7200000).toISOString() : undefined,
      closedAt: meetingNumber === 1 ? new Date(Date.now() - 1800000).toISOString() : undefined,
      teachingJournal: savedState?.teachingJournal || `Materi realisasi sesi #${meetingNumber}: ${mtg?.topic || 'Kajian Silabus'}`,
      journalNotes: savedState?.journalNotes || 'Mahasiswa aktif berpartisipasi dalam diskusi kelas.',
      studentAttendanceRate: attendancePercentage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    students,
    summary: {
      totalStudents,
      countHadir,
      countSakit,
      countIzin,
      countAlpa,
      attendancePercentage
    }
  };
}

export const attendanceService = {
  getMeetingSession: async (meetingId: string): Promise<MeetingAttendanceData> => {
    try {
      const data = await attendanceApi.getMeetingSession(meetingId);
      if (data && data.students && data.students.length > 0) {
        // Sync local storage
        localStorage.setItem(`${ATT_STORAGE_KEY_PREFIX}${meetingId}`, JSON.stringify({
          sessionStatus: data.session.sessionStatus,
          deliveryMode: data.session.deliveryMode,
          teachingJournal: data.session.teachingJournal,
          journalNotes: data.session.journalNotes,
          passcode: data.session.passcode,
          students: data.students
        }));
        return data;
      }
      return generateLocalSessionFallback(meetingId);
    } catch {
      return generateLocalSessionFallback(meetingId);
    }
  },

  openSession: async (meetingId: string, payload: { deliveryMode?: LearningDeliveryMode; teachingJournal?: string }) => {
    // Update local storage first
    const current = generateLocalSessionFallback(meetingId);
    current.session.sessionStatus = 'DIBUKA';
    if (payload.deliveryMode) current.session.deliveryMode = payload.deliveryMode;
    if (payload.teachingJournal) current.session.teachingJournal = payload.teachingJournal;
    localStorage.setItem(`${ATT_STORAGE_KEY_PREFIX}${meetingId}`, JSON.stringify({
      sessionStatus: 'DIBUKA',
      deliveryMode: current.session.deliveryMode,
      teachingJournal: current.session.teachingJournal,
      passcode: current.session.passcode,
      students: current.students
    }));

    try {
      return await attendanceApi.openSession(meetingId, payload);
    } catch {
      return {
        session: current.session,
        qrToken: current.session.qrToken || `QR_${meetingId}`,
        qrExpiresAt: new Date(Date.now() + 30000).toISOString(),
        passcode: current.session.passcode || '849201'
      };
    }
  },

  refreshQrToken: async (meetingId: string) => {
    try {
      return await attendanceApi.refreshQrToken(meetingId);
    } catch {
      return {
        qrToken: `QR_REFRESH_${meetingId}_${Date.now()}`,
        qrExpiresAt: new Date(Date.now() + 30000).toISOString(),
        passcode: Math.floor(100000 + Math.random() * 900000).toString()
      };
    }
  },

  closeSession: async (meetingId: string, payload?: { teachingJournal?: string; journalNotes?: string }) => {
    const current = generateLocalSessionFallback(meetingId);
    current.session.sessionStatus = 'DITUTUP';
    if (payload?.teachingJournal) current.session.teachingJournal = payload.teachingJournal;
    if (payload?.journalNotes) current.session.journalNotes = payload.journalNotes;
    localStorage.setItem(`${ATT_STORAGE_KEY_PREFIX}${meetingId}`, JSON.stringify({
      sessionStatus: 'DITUTUP',
      deliveryMode: current.session.deliveryMode,
      teachingJournal: current.session.teachingJournal,
      journalNotes: current.session.journalNotes,
      passcode: current.session.passcode,
      students: current.students
    }));

    try {
      return await attendanceApi.closeSession(meetingId, payload);
    } catch {
      return {
        session: current.session,
        finalAttendanceRate: current.summary.attendancePercentage
      };
    }
  },

  recordStudentAttendance: async (
    meetingId: string,
    payload: {
      qrToken?: string;
      passcode?: string;
      method?: AttendanceRecordMethod;
      status?: AttendanceStatus;
      notes?: string;
      attachmentUrl?: string;
    }
  ) => {
    try {
      return await attendanceApi.recordStudentAttendance(meetingId, payload);
    } catch {
      return {
        message: 'Presensi berhasil dicatat.',
        attendance: { status: payload.status || 'HADIR', recordedAt: new Date().toISOString() }
      };
    }
  },

  updateStudentManual: async (meetingId: string, studentId: string, payload: { status: AttendanceStatus; notes?: string }) => {
    // Update local storage
    const current = generateLocalSessionFallback(meetingId);
    const stIdx = current.students.findIndex(s => s.studentId === studentId);
    if (stIdx !== -1) {
      current.students[stIdx].status = payload.status;
      current.students[stIdx].method = 'MANUAL_DOSEN';
      if (payload.notes !== undefined) current.students[stIdx].notes = payload.notes;
      current.students[stIdx].recordedAt = new Date().toISOString();
    }
    localStorage.setItem(`${ATT_STORAGE_KEY_PREFIX}${meetingId}`, JSON.stringify({
      sessionStatus: current.session.sessionStatus,
      deliveryMode: current.session.deliveryMode,
      teachingJournal: current.session.teachingJournal,
      journalNotes: current.session.journalNotes,
      passcode: current.session.passcode,
      students: current.students
    }));

    try {
      return await attendanceApi.updateStudentManual(meetingId, studentId, payload);
    } catch {
      return {
        message: `Status berhasil diubah menjadi ${payload.status}.`,
        attendance: current.students[stIdx]
      };
    }
  },

  getClassSummary: async (classId: string): Promise<ClassAttendanceSummaryData> => {
    try {
      const data = await attendanceApi.getClassSummary(classId);
      if (data && data.recap && data.recap.length > 0) {
        return data;
      }
    } catch {
      // Fallback below
    }

    const classes = academicService.getClasses();
    const cls = classes.find(c => c.id === classId) || classes[0];
    const meetings = learningService.getMeetingsByClass(classId);

    const recap = MASTER_STUDENTS_LIST.map((st, sIdx) => {
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      const meetingStatuses: Record<string | number, AttendanceStatus> = {};

      meetings.forEach((m) => {
        const savedRaw = localStorage.getItem(`${ATT_STORAGE_KEY_PREFIX}${m.id}`);
        let stStatus: AttendanceStatus = 'ALPA';

        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw);
            const found = parsed.students?.find((s: any) => s.studentId === st.studentId);
            if (found) stStatus = found.status;
          } catch {}
        } else {
          // Default initial mock distribution
          if (m.meetingNumber === 1) {
            stStatus = sIdx === 6 ? 'IZIN' : 'HADIR';
          } else if (m.meetingNumber === 2) {
            stStatus = sIdx === 3 ? 'SAKIT' : (sIdx === 10 ? 'ALPA' : 'HADIR');
          } else {
            stStatus = (sIdx + m.meetingNumber) % 4 === 0 ? 'HADIR' : ((sIdx + m.meetingNumber) % 7 === 0 ? 'IZIN' : 'ALPA');
          }
        }

        meetingStatuses[m.meetingNumber] = stStatus;
        meetingStatuses[m.id] = stStatus;

        if (stStatus === 'HADIR') hadir++;
        else if (stStatus === 'SAKIT') sakit++;
        else if (stStatus === 'IZIN') izin++;
        else alpa++;
      });

      const totalMeetings = meetings.length || 16;
      const percentage = Math.round((hadir / totalMeetings) * 100);
      const isEligibleForExam = percentage >= 75;

      return {
        studentId: st.studentId,
        studentName: st.studentName,
        studentNim: st.studentNim,
        hadir,
        sakit,
        izin,
        alpa,
        totalMeetings,
        percentage,
        isEligibleForExam,
        meetingStatuses
      };
    });

    return {
      classInfo: {
        id: classId,
        name: cls?.name || 'Kelas A',
        code: cls?.code || 'PAI-301-A',
        courseName: cls?.courseName || 'Ushul Fiqih & Qawaid Fiqhiyyah',
        credits: cls?.credits || 3,
        lecturerName: cls?.lecturerName || 'Dr. H. M. Ridwan, M.Ag',
        lecturerNidn: cls?.lecturerNidn || '2112087501'
      },
      meetings: meetings.map(m => ({
        id: m.id,
        meetingNumber: m.meetingNumber,
        title: m.title,
        scheduledDate: m.scheduledDate,
        status: m.status
      })),
      recap
    };
  },

  getStudentHistory: async (): Promise<StudentCourseAttendanceHistory[]> => {
    try {
      const data = await attendanceApi.getStudentHistory();
      if (data && data.length > 0) return data;
    } catch {}

    const classes = academicService.getClasses();
    return classes.map(c => ({
      classId: c.id,
      className: c.name,
      courseName: c.courseName,
      courseCode: c.code,
      credits: c.credits,
      lecturerName: c.lecturerName,
      totalMeetings: 16,
      hadir: 14,
      sakit: 1,
      izin: 1,
      alpa: 0,
      percentage: 88,
      isEligibleForExam: true
    }));
  }
};
