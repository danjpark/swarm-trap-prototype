import type { World } from '../game/World.ts'
export interface Recording { frames: Float32Array[]; ticksPerSample: number; duration: number; stopped: number }
export class RunRecorder {
  frames: Float32Array[] = []
  capture(w: World) {
    if (w.tick % 8 !== 0 && !w.complete) return
    const frame = new Float32Array(w.runners.length * 3)
    for (const r of w.runners) {
      frame[r.id*3] = r.position.x; frame[r.id*3+1] = r.position.y
      frame[r.id*3+2] = r.alive && !r.finished ? 1 : 0
    }
    this.frames.push(frame)
  }
  finish(w: World): Recording { return { frames:this.frames, ticksPerSample:8, duration:w.time, stopped:w.counts.dead } }
}

