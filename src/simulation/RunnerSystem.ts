import { ACCELERATION, JUMP_DELAY, JUMP_BASE, JUMP_GAIN, JUMP_COOLDOWN } from './tuning.ts'
import type { Runner } from './Runner.ts'
import { RUNNER_WIDTH, RUNNER_HEIGHT, lookAhead, runningSpeed } from './Runner.ts'
import { integrate } from './Physics.ts'
import type { Surface } from './Physics.ts'
export function updateRunner(r: Runner, dt: number, surfaces: Surface[], force: number) {
  const carrying = surfaces.find(s => s.id && s.id === r.supportId)
  if (carrying && r.grounded) r.position.y += carrying.deltaY ?? 0
  r.velocity.x += (runningSpeed(r) - force - r.velocity.x) * Math.min(1, dt * ACCELERATION)
  r.jumpCooldown = Math.max(0, r.jumpCooldown - dt)
  if (r.grounded && r.jumpCooldown === 0) {
    const front = r.position.x + RUNNER_WIDTH
    const feet = r.position.y + RUNNER_HEIGHT
    const probe = front + lookAhead(r)
    const wall = surfaces.some(s => s.x >= front - 1 && s.x <= probe && s.y < feet - 8 && s.y > feet - 105)
    const floor = surfaces.some(s => probe >= s.x && probe <= s.x + s.width && Math.abs(s.y - feet) < 8)
    if ((wall || !floor) && r.pendingJump < 0) r.pendingJump = (1 - r.stats.reaction) * JUMP_DELAY
  }
  if (r.pendingJump >= 0) {
    r.pendingJump -= dt
    if (r.pendingJump <= 0) {
      if (r.grounded) {
        r.velocity.y = -(JUMP_BASE + r.stats.agility * JUMP_GAIN)
        r.grounded = false
        r.supportId = null
        r.jumpCooldown = JUMP_COOLDOWN
      }
      r.pendingJump = -1
    }
  }
  integrate(r, dt, surfaces)
  r.state = r.grounded ? 'running' : r.velocity.y < 0 ? 'jumping' : 'falling'
}

