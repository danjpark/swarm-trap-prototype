import type { Runner } from './Runner.ts'
import { RUNNER_HEIGHT, RUNNER_WIDTH, bounds } from './Runner.ts'
import { overlaps } from '../types/geometry.ts'
import type { Rectangle } from '../types/geometry.ts'
export interface Surface extends Rectangle { id?: string; oneWay?: boolean; deltaY?: number }
export const GRAVITY = 1100
export function integrate(r: Runner, dt: number, surfaces: Surface[]) {
  const oldY = r.position.y
  const previousBottom = oldY + RUNNER_HEIGHT
  r.velocity.y += GRAVITY * dt
  r.position.x += r.velocity.x * dt
  for (const s of surfaces) {
    if (s.oneWay || !overlaps(bounds(r), s)) continue
    if (r.velocity.x > 0) r.position.x = s.x - RUNNER_WIDTH
    else if (r.velocity.x < 0) r.position.x = s.x + s.width
    r.velocity.x = 0
  }
  r.position.x = Math.max(0, r.position.x)
  r.position.y += r.velocity.y * dt
  r.grounded = false
  r.supportId = null
  for (const s of surfaces) {
    if (!overlaps(bounds(r), s)) continue
    if (r.velocity.y >= 0 && previousBottom <= s.y - (s.deltaY ?? 0) + 3) {
      r.position.y = s.y - RUNNER_HEIGHT
      r.velocity.y = 0
      r.grounded = true
      r.supportId = s.id ?? null
    } else if (!s.oneWay && r.velocity.y < 0 && oldY >= s.y + s.height - 1) {
      r.position.y = s.y + s.height
      r.velocity.y = 0
    }
  }
}

