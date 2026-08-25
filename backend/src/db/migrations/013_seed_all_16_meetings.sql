-- =========================================================================
-- MIGRATION 013: SEED 16 PERTEMUAN LENGKAP & ENROLLMENT MAHASISWA
-- =========================================================================

-- 1. Pastikan courses tambahan ada
INSERT INTO courses (id, study_program_id, code, name, credits, semester_recommended, description)
VALUES 
  ('crs-pai302', 'prodi-pai', 'PAI-302', 'Hadits Tarbawi', 2, 3, 'Kajian hadits-hadits tematik mengenai pendidikan dan akhlak.'),
  ('crs-pai303', 'prodi-pai', 'PAI-303', 'Pengembangan Kurikulum PAI', 3, 3, 'Desain, perancangan, dan implementasi kurikulum pendidikan Islam.')
ON CONFLICT (id) DO NOTHING;

-- 2. Pastikan seluruh kelas dari SIAKAD ada di course_classes
INSERT INTO course_classes (id, course_id, semester_id, class_name, academic_year, capacity)
VALUES 
  ('cls-pai301-a', 'crs-pai301', 'sem-2026-ganjil', 'Kelas A', '2026/2027', 40),
  ('cls-pai301-b', 'crs-pai301', 'sem-2026-ganjil', 'Kelas B', '2026/2027', 40),
  ('cls-pai302-a', 'crs-pai302', 'sem-2026-ganjil', 'Kelas A', '2026/2027', 40),
  ('cls-pai303-a', 'crs-pai303', 'sem-2026-ganjil', 'Kelas A', '2026/2027', 40),
  ('cls-pai101-a', 'crs-pai101', 'sem-2026-ganjil', 'Kelas A', '2026/2027', 40),
  ('cls-mpi101-a', 'crs-mpi101', 'sem-2026-ganjil', 'Kelas A', '2026/2027', 40),
  ('cls-hes101-a', 'crs-hes101', 'sem-2026-ganjil', 'Kelas A', '2026/2027', 40),
  ('cls-mku101-a', 'crs-mku101', 'sem-2026-ganjil', 'Kelas A Reguler', '2026/2027', 40)
ON CONFLICT (id) DO NOTHING;

-- 3. Pastikan dosen terhubung ke setiap kelas
INSERT INTO class_lecturers (id, class_id, lecturer_id, is_primary)
SELECT 'cl-' || c.id || '-usr-dsn-01', c.id, 'usr-dsn-01', true
FROM course_classes c
ON CONFLICT (class_id, lecturer_id) DO NOTHING;

-- 4. Enroll semua mahasiswa ke setiap kelas
INSERT INTO class_enrollments (id, class_id, student_id, status, source_system, enrolled_at)
SELECT 
  'enr-' || c.id || '-' || u.id,
  c.id,
  u.id,
  'TERDAFTAR',
  'SIAKAD_STAI',
  CURRENT_TIMESTAMP
FROM course_classes c
CROSS JOIN users u
WHERE u.role = 'mahasiswa'
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 5. Generate 16 pertemuan lengkap untuk setiap kelas
DO $$
DECLARE
  cls RECORD;
  i INT;
  mtg_id VARCHAR(64);
  sched_date DATE;
  topics TEXT[] := ARRAY[
    'Kontrak Belajar & Pengantar Silabus RPS',
    'Kaidah Pokok & Struktur Konsep Dasar',
    'Sumber Rujukan Primer & Dalil Nash',
    'Metodologi Analisis Kebahasaan & Istinbath',
    'Perbandingan Pendekatan Mazhab Fiqih',
    'Studi Kasus Konseptual & Problematika Kontemporer',
    'Pendalaman Dalil Sekunder & Kaidah Ijtihad',
    'Review Materi Paruh Semester & Persiapan UTS',
    'Evaluasi Tengah Semester (UTS)',
    'Analisis Formulasi Kaidah Terapan',
    'Diskusi Kelompok & Presentasi Makalah',
    'Kajian Naskah Turats & Transformasi Digital',
    'Studi Lapangan & Implementasi Keilmuan',
    'Integrasi Keilmuan Islam dan Realitas Sosial',
    'Review Komprehensif & Refleksi Semester',
    'Evaluasi Akhir Semester (UAS)'
  ];
BEGIN
  FOR cls IN SELECT id FROM course_classes LOOP
    FOR i IN 1..16 LOOP
      -- Format ID agar seragam dengan mtg-pai301a-01 dsb
      IF cls.id = 'cls-pai301-a' THEN
        mtg_id := 'mtg-pai301a-' || LPAD(i::text, 2, '0');
      ELSE
        mtg_id := 'mtg-' || REPLACE(cls.id, 'cls-', '') || '-' || LPAD(i::text, 2, '0');
      END IF;

      sched_date := DATE '2026-09-01' + ((i - 1) * 7);
      
      INSERT INTO course_meetings (
        id, class_id, meeting_number, title, topic, description, scheduled_date, start_time, end_time, status, order_index
      ) VALUES (
        mtg_id,
        cls.id,
        i,
        'Pertemuan #' || i || ' — ' || topics[i],
        topics[i],
        'Kajian perkuliahan tatap muka dan daring sesi #' || i || ' mengenai ' || topics[i],
        sched_date,
        '08:00:00',
        '10:30:00',
        CASE WHEN i <= 3 THEN 'DITERBITKAN'::publish_status_enum ELSE 'DRAF'::publish_status_enum END,
        i
      )
      ON CONFLICT (class_id, meeting_number) DO UPDATE SET
        id = EXCLUDED.id,
        title = EXCLUDED.title,
        topic = EXCLUDED.topic,
        scheduled_date = EXCLUDED.scheduled_date;

      -- Generate sesi presensi untuk setiap pertemuan
      INSERT INTO meeting_attendance_sessions (
        id, meeting_id, class_id, lecturer_id, session_status, delivery_mode, qr_token, passcode, opened_at, closed_at, teaching_journal
      ) VALUES (
        'ses-' || mtg_id,
        mtg_id,
        cls.id,
        'usr-dsn-01',
        CASE WHEN i = 1 THEN 'DITUTUP'::attendance_session_status_enum WHEN i = 2 THEN 'DIBUKA'::attendance_session_status_enum ELSE 'BELUM_DIBUKA'::attendance_session_status_enum END,
        'TATAP_MUKA',
        'QR_TOKEN_STAI_' || mtg_id,
        '84920' || (i % 10),
        CASE WHEN i <= 2 THEN CURRENT_TIMESTAMP - INTERVAL '2 hours' ELSE NULL END,
        CASE WHEN i = 1 THEN CURRENT_TIMESTAMP - INTERVAL '30 minutes' ELSE NULL END,
        'Realisasi materi sesi #' || i || ': ' || topics[i]
      )
      ON CONFLICT (meeting_id) DO UPDATE SET
        session_status = EXCLUDED.session_status,
        passcode = EXCLUDED.passcode;

      -- Generate sample data kehadiran mahasiswa untuk sesi 1 dan 2
      IF i IN (1, 2) THEN
        INSERT INTO student_attendances (
          id, session_id, meeting_id, class_id, student_id, status, method, recorded_at, notes
        )
        SELECT 
          'att-' || mtg_id || '-' || u.id,
          'ses-' || mtg_id,
          mtg_id,
          cls.id,
          u.id,
          CASE 
            WHEN (u.id = 'usr-mhs-04' AND i = 2) THEN 'SAKIT'::attendance_status_enum
            WHEN (u.id = 'usr-mhs-07' AND i = 1) THEN 'IZIN'::attendance_status_enum
            WHEN (u.id = 'usr-mhs-10' AND i = 2) THEN 'ALPA'::attendance_status_enum
            ELSE 'HADIR'::attendance_status_enum
          END,
          CASE 
            WHEN (u.id = 'usr-mhs-04') THEN 'SURAT_IZIN'
            WHEN (u.id = 'usr-mhs-07') THEN 'MANUAL_DOSEN'
            ELSE 'QR_SCAN'
          END,
          CURRENT_TIMESTAMP - INTERVAL '1 hour',
          CASE 
            WHEN (u.id = 'usr-mhs-04') THEN 'Izin Sakit dengan Surat Dokter'
            WHEN (u.id = 'usr-mhs-07') THEN 'Izin Keperluan Keluarga'
            ELSE 'Presensi QR Dinamis'
          END
        FROM users u
        WHERE u.role = 'mahasiswa'
        ON CONFLICT (meeting_id, student_id) DO UPDATE SET
          status = EXCLUDED.status,
          method = EXCLUDED.method;
      END IF;

    END LOOP;
  END LOOP;
END $$;
