import { clamp } from '../types/geometry.ts'
import type { World } from './World.ts'
export class Camera {
  x = 0
  width = 1100
  follow = true
  pan(amount: number, worldWidth: number) { this.x = clamp(this.x + amount, 0, Math.max(0, worldWidth-this.width)) }
  update(w: World, dt: number) {
    if (!this.follow) return
    const active = w.runners.filter(r => r.alive && !r.finished).map(r => r.position.x).sort((a,b)=>a-b)
    if (!active.length) return
    const target = clamp(active[Math.floor(active.length*0.65)] - this.width * 0.42, 0, w.level.width-this.width)
    this.x += (target-this.x) * Math.min(1, dt*4)
  }
}

