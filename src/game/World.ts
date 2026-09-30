import type { LevelDefinition } from '../levels/LevelDefinition.ts'
import type { Runner } from '../simulation/Runner.ts'
import { RUNNER_HEIGHT, bounds } from '../simulation/Runner.ts'
import { SeededRandom } from '../simulation/SeededRandom.ts'
import { sampleGenome } from '../simulation/traits.ts'
import type { Genome } from '../simulation/traits.ts'
import { FIXED_DT, DEFAULT_SEED, POPULATION, RUN_TIMEOUT } from '../simulation/tuning.ts'
import { averageStats } from '../simulation/RunnerStats.ts'
import { updateRunner } from '../simulation/RunnerSystem.ts'
import { overlaps } from '../types/geometry.ts'
import type { Trap, TrapDefinition } from '../traps/Trap.ts'
import { damageMultiplier } from '../simulation/damage.ts'
import { BASE_DAMAGE, HIT_COOLDOWN } from '../simulation/tuning.ts'
import type { Surface } from '../simulation/Physics.ts'
export { FIXED_DT, DEFAULT_SEED }
export class World {
  level: LevelDefinition
  seed: number
  runners: Runner[]
  traps: Trap[] = []
  tick = 0
  complete = false
  constructor(level: LevelDefinition, seed = DEFAULT_SEED, genomes?: Genome[]) {
    this.level = level
    this.seed = seed
    const rng = new SeededRandom(seed)
    this.runners = Array.from({ length: genomes?.length ?? POPULATION }, (_, id) => {
      const stats = genomes ? { ...genomes[id] } : sampleGenome(rng)
      return ({
      id, position: { x: level.spawnPoint.x, y: level.spawnPoint.y - RUNNER_HEIGHT },
      velocity: { x: 0, y: 0 }, grounded: true, alive: true, finished: false,
      stats, hp: stats.hp,
      state: 'running', supportId: null, pendingJump: -1, jumpCooldown: 0, deathTime: -1, deathCause: null, lastHit: {}, hitTime: -1,
    })})
  }
  get time() { return this.tick * FIXED_DT }
  get counts() {
    let dead = 0, escaped = 0
    for (const r of this.runners) { if (!r.alive) dead++; if (r.finished) escaped++ }
    return { alive: this.runners.length - dead - escaped, dead, escaped }
  }
  get survivorStats() { return averageStats(this.runners.filter(r => r.finished).map(r => r.stats)) }
  hit(r: Runner, device: TrapDefinition) {
    if (!r.alive || r.finished || !device.damageType || this.time - (r.lastHit[device.id] ?? -Infinity) < HIT_COOLDOWN) return
    r.lastHit[device.id] = this.time
    r.hitTime = this.time
    r.hp = Math.max(0, r.hp - BASE_DAMAGE * damageMultiplier(device.damageType, r.stats.shell))
    if (r.hp <= 0) this.kill(r, device.damageType)
  }
  kill(r: Runner, cause: 'blunt' | 'piercing' | 'fall' | 'timeout') {
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
      if (this.time >= RUN_TIMEOUT) this.kill(r, 'timeout')
    }
    this.complete = this.runners.every(r => !r.alive || r.finished)
  }
}
