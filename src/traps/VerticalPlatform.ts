import type { Trap, TrapDefinition } from './Trap.ts'
export class VerticalPlatform implements Trap {
  definition: TrapDefinition
  position: {x: number; y: number}
  deltaY = 0
  constructor(def: TrapDefinition) { this.definition = def; this.position = { ...def.position } }
  update(_dt: number, time: number) {
    const min = this.definition.minY ?? this.definition.position.y - 128
    const max = this.definition.maxY ?? this.definition.position.y
    const range = Math.max(1, max - min)
    const phase = (time * (this.definition.speed ?? 80)) % (range * 2)
    const y = max - (phase <= range ? phase : range * 2 - phase)
    this.deltaY = y - this.position.y
    this.position.y = y
  }
  surface() { return { x: this.position.x, y: this.position.y, width: 96, height: 12 } }
  interact() {}
}

