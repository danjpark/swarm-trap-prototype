import type { Recording } from './RunRecorder.ts'
export class GhostReplay {
  recording: Recording
  constructor(recording: Recording) { this.recording = recording }
  frame(tick: number) {
    if (tick / 120 > this.recording.duration) return null
    return this.recording.frames[Math.floor(tick / this.recording.ticksPerSample)] ?? null
  }
}

