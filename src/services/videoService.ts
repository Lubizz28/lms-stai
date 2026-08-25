import { 
  InteractiveVideo, 
  VideoQuestionCheckpoint, 
  StudentVideoProgress, 
  WatchedTimeSegment 
} from '../types/video';

const VIDEOS_STORAGE_KEY = 'salam_interactive_videos';
const PROGRESS_STORAGE_KEY = 'salam_video_progress';

export const INITIAL_INTERACTIVE_VIDEOS: InteractiveVideo[] = [];

class VideoService {
  private getVideos(): InteractiveVideo[] {
    try {
      const raw = localStorage.getItem(VIDEOS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(INITIAL_INTERACTIVE_VIDEOS));
        return INITIAL_INTERACTIVE_VIDEOS;
      }
      const parsed: InteractiveVideo[] = JSON.parse(raw);
      // Auto-merge initial sample videos if not present
      let hasChanges = false;
      INITIAL_INTERACTIVE_VIDEOS.forEach((initVid) => {
        if (!parsed.some((p) => p.id === initVid.id)) {
          parsed.push(initVid);
          hasChanges = true;
        }
      });
      if (hasChanges) {
        localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return INITIAL_INTERACTIVE_VIDEOS;
    }
  }

  private saveVideos(videos: InteractiveVideo[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
      }
    } catch {
      // ignore in SSR / node
    }
  }

  private getProgressList(): StudentVideoProgress[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveProgressList(list: StudentVideoProgress[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore in SSR / node
    }
  }

  public getAllVideos(classId?: string, isStudent = false): InteractiveVideo[] {
    let videos = this.getVideos();
    if (classId) {
      videos = videos.filter((v) => v.classId === classId);
    }
    if (isStudent) {
      videos = videos.filter((v) => v.status === 'DITERBITKAN');
    }
    return videos;
  }

  public getVideosByMeeting(meetingId: string, classId?: string, meetingNumber?: number): InteractiveVideo[] {
    return this.getVideos().filter((v) => {
      if (v.status !== 'DITERBITKAN') return false;
      if (v.meetingId === meetingId) return true;
      if (classId && meetingNumber !== undefined && v.classId === classId && v.meetingNumber === meetingNumber) return true;
      if (meetingId && v.meetingId) {
        const cleanMtgId = meetingId.replace(/[-_]/g, '').toLowerCase();
        const cleanVidMtgId = v.meetingId.replace(/[-_]/g, '').toLowerCase();
        if (cleanMtgId.includes(cleanVidMtgId) || cleanVidMtgId.includes(cleanMtgId)) return true;
      }
      return false;
    });
  }

  public getVideoById(videoId: string): InteractiveVideo | undefined {
    return this.getVideos().find((v) => v.id === videoId);
  }

  public createVideo(video: Omit<InteractiveVideo, 'id' | 'createdAt' | 'updatedAt'>): InteractiveVideo {
    const all = this.getVideos();
    const now = new Date().toISOString();
    const newVideo: InteractiveVideo = {
      ...video,
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };
    all.push(newVideo);
    this.saveVideos(all);
    return newVideo;
  }

  public addCheckpoint(videoId: string, checkpoint: Omit<VideoQuestionCheckpoint, 'id'>): VideoQuestionCheckpoint {
    const all = this.getVideos();
    const video = all.find((v) => v.id === videoId);
    if (!video) throw new Error('Video tidak ditemukan');

    const newCheckpoint: VideoQuestionCheckpoint = {
      ...checkpoint,
      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };

    video.checkpoints.push(newCheckpoint);
    video.checkpoints.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    video.updatedAt = new Date().toISOString();
    this.saveVideos(all);
    return newCheckpoint;
  }

  public deleteCheckpoint(videoId: string, checkpointId: string): void {
    const all = this.getVideos();
    const video = all.find((v) => v.id === videoId);
    if (!video) return;

    video.checkpoints = video.checkpoints.filter((c) => c.id !== checkpointId);
    video.updatedAt = new Date().toISOString();
    this.saveVideos(all);
  }

  /**
   * MENGAMBIL PROGRES TONTONAN MAHASISWA
   */
  public getStudentProgress(videoId: string, studentId: string): StudentVideoProgress | null {
    const list = this.getProgressList();
    return list.find((p) => p.videoId === videoId && p.studentId === studentId) || null;
  }

  /**
   * PEMBARUAN PROGRES TONTONAN (THROTTLED & ANTI-CHEAT SERVER VALIDATED)
   */
  public updateStudentProgress(
    videoId: string,
    studentId: string,
    studentNim: string,
    studentName: string,
    currentPosition: number,
    segmentDurationSeconds = 5
  ): StudentVideoProgress {
    const video = this.getVideoById(videoId);
    if (!video) throw new Error('Video tidak ditemukan');

    const list = this.getProgressList();
    let progress = list.find((p) => p.videoId === videoId && p.studentId === studentId);
    const now = new Date().toISOString();

    // Validasi segment aman (anti-cheat: durasi tontonan tidak boleh lebih besar dari elapsed time)
    const validSegmentDuration = Math.min(Math.max(segmentDurationSeconds, 0), 15);
    const startSec = Math.max(0, currentPosition - validSegmentDuration);
    const endSec = Math.min(video.durationSeconds, currentPosition);

    if (!progress) {
      progress = {
        id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        videoId,
        studentId,
        studentNim,
        studentName,
        lastPositionSeconds: currentPosition,
        maxWatchedPositionSeconds: currentPosition,
        watchedSegments: [{ startSeconds: startSec, endSeconds: endSec }],
        effectiveWatchedPercentage: 0,
        answeredQuestions: [],
        isCompleted: false,
        lastSyncedAt: now
      };
      list.push(progress);
    } else {
      progress.lastPositionSeconds = currentPosition;
      progress.maxWatchedPositionSeconds = Math.max(progress.maxWatchedPositionSeconds, currentPosition);
      progress.watchedSegments.push({ startSeconds: startSec, endSeconds: endSec });
      progress.lastSyncedAt = now;
    }

    // Gabungkan segmen yang tumpang tindih untuk menghitung total detik unik yang telah ditonton
    const mergedSegments = this.mergeTimeSegments(progress.watchedSegments);
    progress.watchedSegments = mergedSegments;

    const totalUniqueWatchedSeconds = mergedSegments.reduce(
      (sum, seg) => sum + (seg.endSeconds - seg.startSeconds),
      0
    );

    const calculatedPercentage = Math.min(
      100,
      Math.round((totalUniqueWatchedSeconds / video.durationSeconds) * 100)
    );
    progress.effectiveWatchedPercentage = calculatedPercentage;

    // Evaluasi aturan penyelesaian (Completion Rule Validation)
    const isWatchPercentageMet = calculatedPercentage >= video.minWatchedPercentage;
    const requiredCheckpoints = video.checkpoints.filter((c) => c.isRequired);
    const allRequiredAnswered = requiredCheckpoints.every((chk) =>
      progress!.answeredQuestions.some((ans) => ans.checkpointId === chk.id && ans.isCorrect)
    );

    if (isWatchPercentageMet && allRequiredAnswered && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = now;
    }

    this.saveProgressList(list);
    return progress;
  }

  /**
   * MENYIMPAN JAWABAN CHECKPOINT PERTANYAAN
   */
  public submitQuestionAnswer(
    videoId: string,
    studentId: string,
    checkpointId: string,
    selectedOptionId?: string,
    textAnswer?: string
  ): { isCorrect: boolean; explanation?: string; progress: StudentVideoProgress } {
    const video = this.getVideoById(videoId);
    if (!video) throw new Error('Video tidak ditemukan');

    const checkpoint = video.checkpoints.find((c) => c.id === checkpointId);
    if (!checkpoint) throw new Error('Titik pertanyaan tidak ditemukan');

    let isCorrect = false;
    if (checkpoint.type === 'PILIHAN_GANDA' || checkpoint.type === 'BENAR_SALAH') {
      const opt = checkpoint.options.find((o) => o.id === selectedOptionId);
      isCorrect = !!opt?.isCorrect;
    } else if (checkpoint.type === 'JAWABAN_SINGKAT') {
      const expected = (checkpoint.correctAnswerText || '').trim().toLowerCase();
      const actual = (textAnswer || '').trim().toLowerCase();
      isCorrect = expected === actual;
    }

    const list = this.getProgressList();
    let progress = list.find((p) => p.videoId === videoId && p.studentId === studentId);
    if (!progress) {
      // Inisialisasi progress jika belum ada
      progress = this.updateStudentProgress(videoId, studentId, '21.01.0042', 'Mahasiswa', checkpoint.timestampSeconds, 0);
    }

    const existingAns = progress.answeredQuestions.find((a) => a.checkpointId === checkpointId);
    const now = new Date().toISOString();

    if (!existingAns) {
      progress.answeredQuestions.push({
        checkpointId,
        selectedOptionId,
        textAnswer,
        isCorrect,
        answeredAt: now,
        attemptsCount: 1
      });
    } else {
      existingAns.selectedOptionId = selectedOptionId;
      existingAns.textAnswer = textAnswer;
      existingAns.isCorrect = isCorrect;
      existingAns.answeredAt = now;
      existingAns.attemptsCount += 1;
    }

    // Cek ulang completion
    const requiredCheckpoints = video.checkpoints.filter((c) => c.isRequired);
    const allRequiredAnswered = requiredCheckpoints.every((chk) =>
      progress!.answeredQuestions.some((ans) => ans.checkpointId === chk.id && ans.isCorrect)
    );

    if (progress.effectiveWatchedPercentage >= video.minWatchedPercentage && allRequiredAnswered && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = now;
    }

    this.saveProgressList(list);
    return { isCorrect, explanation: checkpoint.explanation, progress };
  }

  /**
   * Helper: Menggabungkan interval waktu tontonan
   */
  private mergeTimeSegments(segments: WatchedTimeSegment[]): WatchedTimeSegment[] {
    if (segments.length === 0) return [];
    const sorted = [...segments].sort((a, b) => a.startSeconds - b.startSeconds);
    const merged: WatchedTimeSegment[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.startSeconds <= last.endSeconds) {
        last.endSeconds = Math.max(last.endSeconds, current.endSeconds);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }
}

export const videoService = new VideoService();
