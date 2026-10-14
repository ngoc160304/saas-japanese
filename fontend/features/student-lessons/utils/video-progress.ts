import type { UpdateLessonProgress } from '@/apis/study/study.type';

interface PlaybackSample {
  currentTime: number;
  duration: number;
  now: number;
  playing: boolean;
  seeking: boolean;
  playbackRate: number;
}

/** Count real playback deltas, excluding seeks. Never use the playhead as watched time. */
export class VideoWatchTracker {
  private previous: PlaybackSample | null = null;
  private watched: number;
  private duration = 0;
  private played = false;

  constructor(baseline: number) {
    this.watched = baseline;
  }

  resetAnchor() {
    this.previous = null;
  }

  sample(sample: PlaybackSample) {
    const previous = this.previous;
    this.previous = sample;
    if (
      !Number.isFinite(sample.duration) ||
      sample.duration <= 0 ||
      sample.duration > 2_147_483_647
    )
      return;
    this.duration = sample.duration;
    if (!previous?.playing || previous.seeking || sample.seeking) return;
    const delta = sample.currentTime - previous.currentTime;
    const elapsed = Math.max(0, (sample.now - previous.now) / 1000);
    const maximum = elapsed * Math.max(0, sample.playbackRate);
    if (delta <= 0 || delta > maximum + 0.75) return;
    this.watched = Math.min(sample.duration, this.watched + Math.min(delta, maximum));
    this.played = true;
  }

  read(): UpdateLessonProgress | null {
    if (!this.played || this.duration <= 0) return null;
    return {
      watchDuration: Math.min(Math.floor(this.watched), Math.ceil(this.duration)),
      videoDuration: Math.ceil(this.duration),
    };
  }
}

/** One request at a time; coalesce newer samples and stop on failure until explicit retry. */
export class ProgressWriter {
  private queued: UpdateLessonProgress | null = null;
  private busy = false;
  private blocked = false;
  private pendingWatch = 0;
  private savedWatch: number;

  constructor(
    private readonly save: (data: UpdateLessonProgress) => Promise<unknown>,
    baseline: number,
  ) {
    this.savedWatch = baseline;
  }

  enqueue(data: UpdateLessonProgress) {
    if (data.watchDuration <= Math.max(this.savedWatch, this.pendingWatch)) return;
    this.retainLatest(data);
    if (!this.blocked) void this.drain();
  }

  retry() {
    this.blocked = false;
    void this.drain();
  }

  private retainLatest(data: UpdateLessonProgress) {
    if (!this.queued || data.watchDuration >= this.queued.watchDuration) this.queued = data;
  }

  private async drain() {
    if (this.busy) return;
    this.busy = true;
    try {
      while (this.queued) {
        const data = this.queued;
        this.queued = null;
        this.pendingWatch = data.watchDuration;
        try {
          await this.save(data);
          this.savedWatch = Math.max(this.savedWatch, data.watchDuration);
        } catch {
          this.retainLatest(data);
          this.blocked = true;
          return;
        }
      }
    } finally {
      this.pendingWatch = 0;
      this.busy = false;
    }
  }
}
