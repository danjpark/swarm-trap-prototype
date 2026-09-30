import type { Trap, TrapDefinition, TrapContext } from './Trap.ts'
import type { Runner } from '../simulation/Runner.ts'
import { RUNNER_WIDTH, RUNNER_HEIGHT } from '../simulation/Runner.ts'
import { WHEEL_RADIUS, WHEEL_ROTATION, WHEEL_ARMS, WHEEL_REACHES, WHEEL_CONTACT_RADIUS_SQUARED } from '../simulation/tuning.ts'
import { clamp } from '../types/geometry.ts'
export class DamageWheel implements Trap {
  definition: TrapDefinition
  position: {x: number; y: number}
  deltaY = 0
  angle = 0
  constructor(def: TrapDefinition) { this.definition = def; this.position = { ...def.position } }
  update(_dt: number, time: number) { this.angle = time * (this.definition.rotationSpeed ?? WHEEL_ROTATION) }
  surface() { return null }
  interact(r: Runner, w: TrapContext) {
    const radius = this.definition.radius ?? WHEEL_RADIUS
    const arms = this.definition.armCount ?? WHEEL_ARMS
    for (let a = 0; a < arms; a++) {
      const angle = this.angle + a * Math.PI * 2 / arms
      for (const reach of WHEEL_REACHES) {
        const x = this.position.x + Math.cos(angle) * radius * reach
        const y = this.position.y + Math.sin(angle) * radius * reach
        const dx = x - clamp(x, r.position.x, r.position.x + RUNNER_WIDTH)
        const dy = y - clamp(y, r.position.y, r.position.y + RUNNER_HEIGHT)
        if (dx * dx + dy * dy < WHEEL_CONTACT_RADIUS_SQUARED) { w.hit(r, this.definition); return }
      }
    }
  }
}

