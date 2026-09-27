import type { Trap, TrapDefinition, TrapContext } from './Trap.ts'
import type { Runner } from '../simulation/Runner.ts'
import { clamp } from '../types/geometry.ts'
export class FireWheel implements Trap {
  definition: TrapDefinition
  position: {x: number; y: number}
  deltaY = 0
  angle = 0
  constructor(def: TrapDefinition) { this.definition = def; this.position = { ...def.position } }
  update(_dt: number, time: number) { this.angle = time * (this.definition.rotationSpeed ?? 1.5) }
  surface() { return null }
  interact(r: Runner, w: TrapContext) {
    const radius = this.definition.radius ?? 64
    const arms = this.definition.armCount ?? 4
    for (let a = 0; a < arms; a++) {
      const angle = this.angle + a * Math.PI * 2 / arms
      for (const reach of [0.72, 0.86, 1]) {
        const x = this.position.x + Math.cos(angle) * radius * reach
        const y = this.position.y + Math.sin(angle) * radius * reach
        const dx = x - clamp(x, r.position.x, r.position.x + 12)
        const dy = y - clamp(y, r.position.y, r.position.y + 18)
        if (dx * dx + dy * dy < 100) { w.kill(r, 'fire'); return }
      }
    }
  }
}

