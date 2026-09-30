import type { Runner } from './Runner.ts'
import type { Genome } from './traits.ts'
import { TRAITS, clampTrait } from './traits.ts'
import { SeededRandom } from './SeededRandom.ts'
import { DEFAULT_SEED, POPULATION } from './tuning.ts'

export function breedSurvivors(runners: readonly Runner[], generation: number): Genome[] | null {
  const parents = runners.filter(r => r.finished)
  if (!parents.length) return null
  const rng = new SeededRandom(DEFAULT_SEED + generation)
  return Array.from({length: POPULATION}, () => {
    const a = parents[Math.floor(rng.next() * parents.length)].stats
    const b = parents[Math.floor(rng.next() * parents.length)].stats
    const child = {} as Genome
    for (const trait of TRAITS) {
      child[trait.key] = clampTrait((rng.next() < .5 ? a : b)[trait.key] + rng.normal(0, trait.mutationSd), trait)
    }
    return child
  })
}
