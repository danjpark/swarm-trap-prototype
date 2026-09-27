import type { Rectangle, Vector2 } from '../types/geometry.ts'
import type { Runner } from '../simulation/Runner.ts'
export type TrapType = 'fire' | 'track' | 'platform'
export interface TrapDefinition {
  id: string
  type: TrapType
  position: Vector2
  radius?: number
  rotationSpeed?: number
  armCount?: number
  strength?: number
  minY?: number
  maxY?: number
  speed?: number
}
export interface TrapContext { time: number; kill(runner: Runner, cause: 'fire'): void }
export interface Trap {
  definition: TrapDefinition
  position: Vector2
  update(dt: number, time: number): void
  interact(runner: Runner, world: TrapContext): void
  horizontalForce?(runner: Runner): number
  surface(): Rectangle | null
  deltaY: number
}

