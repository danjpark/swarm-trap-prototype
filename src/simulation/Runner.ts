import type { Vector2, Rectangle } from '../types/geometry.ts'
import type { RunnerStats } from './RunnerStats.ts'
export type RunnerState = 'running' | 'jumping' | 'falling' | 'dead' | 'finished'
export interface Runner {
  id: number
  position: Vector2
  velocity: Vector2
  grounded: boolean
  alive: boolean
  finished: boolean
  stats: RunnerStats
  state: RunnerState
  supportId: string | null
  pendingJump: number
  jumpCooldown: number
  deathTime: number
  deathCause: 'fire' | 'fall' | 'timeout' | null
}
export const RUNNER_WIDTH = 12
export const RUNNER_HEIGHT = 18
export function bounds(r: Runner): Rectangle {
  return { x: r.position.x, y: r.position.y, width: RUNNER_WIDTH, height: RUNNER_HEIGHT }
}
export const lookAhead = (r: Runner) => 8 + r.stats.reaction * 28
export const runningSpeed = (r: Runner) => 100 + r.stats.speed * 200

