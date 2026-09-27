import type { Rectangle, Vector2 } from '../types/geometry.ts'
import type { TrapDefinition } from '../traps/Trap.ts'
export interface LevelDefinition {
  id: string
  width: number
  height: number
  spawnPoint: Vector2
  exitArea: Rectangle
  terrain: Rectangle[]
  initialTraps: TrapDefinition[]
}

