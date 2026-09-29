import { RUNNER_WIDTH, RUNNER_HEIGHT, LOOK_AHEAD_BASE, LOOK_AHEAD_GAIN, SPEED_BASE, SPEED_GAIN } from './tuning.ts'
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
  hp: number
  state: RunnerState
  supportId: string | null
  pendingJump: number
  jumpCooldown: number
  deathTime: number
  deathCause: 'blunt' | 'piercing' | 'fall' | 'timeout' | null
  lastHit: Record<string, number>
  hitTime: number
}
export { RUNNER_WIDTH, RUNNER_HEIGHT }
export function bounds(r: Runner): Rectangle {
  return { x: r.position.x, y: r.position.y, width: RUNNER_WIDTH, height: RUNNER_HEIGHT }
}
export const lookAhead = (r: Runner) => LOOK_AHEAD_BASE + r.stats.reaction * LOOK_AHEAD_GAIN
export const runningSpeed = (r: Runner) => SPEED_BASE + r.stats.speed * SPEED_GAIN
