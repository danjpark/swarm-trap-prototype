import type { DamageType } from '../traps/Trap.ts'
import { SHELL_EFFECT } from './tuning.ts'
export function damageMultiplier(type: DamageType, shell: number) {
  return Math.max(1 - SHELL_EFFECT, Math.min(1 + SHELL_EFFECT,
    1 + (type === 'blunt' ? 1 : -1) * SHELL_EFFECT * shell))
}
