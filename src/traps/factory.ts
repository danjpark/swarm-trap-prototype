import type { TrapDefinition, Trap } from './Trap.ts'
import { FireWheel } from './FireWheel.ts'
import { ReverseTrack } from './ReverseTrack.ts'
import { VerticalPlatform } from './VerticalPlatform.ts'
export function createTrap(def: TrapDefinition): Trap {
  switch (def.type) {
    case 'fire': return new FireWheel(def)
    case 'track': return new ReverseTrack(def)
    case 'platform': return new VerticalPlatform(def)
  }
}

