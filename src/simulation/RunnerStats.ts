import { TRAITS } from './traits.ts'
import type { Genome } from './traits.ts'
export type RunnerStats = Genome
export function averageStats(stats: Genome[]): Genome | null {
  if (!stats.length) return null
  const average = {} as Genome
  for (const trait of TRAITS) average[trait.key] = stats.reduce((sum, genome) => sum + genome[trait.key], 0) / stats.length
  return average
}
