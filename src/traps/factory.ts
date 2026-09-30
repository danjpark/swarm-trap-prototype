import type { TrapDefinition, Trap } from './Trap.ts'
import { DamageWheel } from './DamageWheel.ts'
import { ReverseTrack } from './ReverseTrack.ts'
import { VerticalPlatform } from './VerticalPlatform.ts'
export function createTrap(def: TrapDefinition): Trap {
  switch (def.type) {
    case 'spike':
    case 'hammer': return new DamageWheel(def)
    case 'track': return new ReverseTrack(def)
    case 'platform': return new VerticalPlatform(def)
  }
}

