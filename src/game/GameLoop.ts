import { FIXED_DT } from './World.ts'
export class FixedStepper {
  accumulator = 0
  advance(seconds: number, speed: number, step: () => void) {
    this.accumulator += Math.min(seconds, 0.1) * speed
    while (this.accumulator + 1e-10 >= FIXED_DT) {
      step()
      this.accumulator -= FIXED_DT
    }
  }
  reset() { this.accumulator = 0 }
}
export class GameLoop {
  fps = 60
  frameMs = 0
  private last = 0
  private handle = 0
  start(frame: (dt: number) => void) {
    const run = (now: number) => {
      const elapsed = this.last ? (now - this.last) / 1000 : 1/60
      this.last = now
      this.fps += (1 / Math.max(elapsed, 0.001) - this.fps) * 0.05
      const begin = performance.now()
      frame(Math.min(elapsed, 0.1))
      this.frameMs += (performance.now() - begin - this.frameMs) * 0.05
      this.handle = requestAnimationFrame(run)
    }
    this.handle = requestAnimationFrame(run)
  }
  stop() { cancelAnimationFrame(this.handle) }
}

