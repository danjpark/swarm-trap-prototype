import type { LevelDefinition } from '../levels/LevelDefinition.ts'
import type { Runner } from '../simulation/Runner.ts'
import { RUNNER_HEIGHT, bounds } from '../simulation/Runner.ts'
import { SeededRandom } from '../simulation/SeededRandom.ts'
import { averageStats } from '../simulation/RunnerStats.ts'
import { updateRunner } from '../simulation/RunnerSystem.ts'
import { overlaps } from '../types/geometry.ts'
import type { Trap } from '../traps/Trap.ts'
import type { Surface } from '../simulation/Physics.ts'
export const FIXED_DT = 1 / 120
export const DEFAULT_SEED = 240519
export class World {
  level: LevelDefinition
  seed: number
  runners: Runner[]
  traps: Trap[] = []
  tick = 0
  complete = false
  constructor(level: LevelDefinition, seed = DEFAULT_SEED, population = 100) {
    this.level = level
    this.seed = seed
    const rng = new SeededRandom(seed)
    this.runners = Array.from({ length: population }, (_, id) => ({
      id, position: { x: level.spawnPoint.x + id * 3.1, y: level.spawnPoint.y - RUNNER_HEIGHT },
      velocity: { x: 0, y: 0 }, grounded: true, alive: true, finished: false,
      stats: { speed: rng.between(0.4, 0.6), reaction: rng.between(0.4, 0.6), agility: rng.between(0.4, 0.6) },
      state: 'running', supportId: null, pendingJump: -1, jumpCooldown: 0, deathTime: -1, deathCause: null,
    }))
  }
  get time() { return this.tick * FIXED_DT }
  get counts() {
    let dead = 0, escaped = 0
    for (const r of this.runners) { if (!r.alive) dead++; if (r.finished) escaped++ }
    return { alive: this.runners.length - dead - escaped, dead, escaped }
  }
  get survivorStats() { return averageStats(this.runners.filter(r => r.finished).map(r => r.stats)) }
  kill(r: Runner, cause: 'fire' | 'fall' | 'timeout') {
    if (!r.alive || r.finished) return
    r.alive = false; r.state = 'dead'; r.deathTime = this.time; r.deathCause = cause
  }
  step() {
    if (this.complete) return
    this.tick++
    for (const t of this.traps) t.update(FIXED_DT, this.time)
    const surfaces: Surface[] = [...this.level.terrain]
    for (const t of this.traps) {
      const s = t.surface()
      if (s) surfaces.push({ ...s, id: t.definition.id, oneWay: true, deltaY: t.deltaY })
    }
    for (const r of this.runners) {
      if (!r.alive || r.finished) continue
      let force = 0
      for (const t of this.traps) force += t.horizontalForce?.(r) ?? 0
      updateRunner(r, FIXED_DT, surfaces, force)
      for (const t of this.traps) t.interact(r, this)
      if (r.position.y > this.level.height + 32) this.kill(r, 'fall')
      if (r.alive && overlaps(bounds(r), this.level.exitArea)) { r.finished = true; r.state = 'finished' }
      if (this.time >= 60) this.kill(r, 'timeout')
    }
    this.complete = this.runners.every(r => !r.alive || r.finished)
  }
}

