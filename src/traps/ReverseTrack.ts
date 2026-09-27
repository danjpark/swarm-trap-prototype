import type { Trap, TrapDefinition } from './Trap.ts'
import type { Runner } from '../simulation/Runner.ts'
import { RUNNER_HEIGHT, RUNNER_WIDTH } from '../simulation/Runner.ts'
export class ReverseTrack implements Trap {
  definition: TrapDefinition
  position: {x: number; y: number}
  deltaY = 0
  constructor(def: TrapDefinition) { this.definition = def; this.position = { ...def.position } }
  update() {}
  surface() { return null }
  horizontalForce(r: Runner) {
    return r.grounded && r.position.x + RUNNER_WIDTH > this.position.x && r.position.x < this.position.x + 128 &&
      Math.abs(r.position.y + RUNNER_HEIGHT - this.position.y) < 4 ? this.definition.strength ?? 165 : 0
  }
  interact() {} // Force is applied before integration; there is no contact damage.
}

