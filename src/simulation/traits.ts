import { SeededRandom } from './SeededRandom.ts'
export type TraitKey = 'speed' | 'reaction' | 'agility' | 'hp' | 'shell'
export type InitialDistribution = { kind: 'uniform'; min: number; max: number } | { kind: 'normal'; mean: number; sd: number }
export interface TraitDef {
  key: TraitKey
  initial: InitialDistribution
  min: number
  max: number
  mutationSd: number
}
export type Genome = Record<TraitKey, number>
export const TRAITS: readonly TraitDef[] = [
  { key: 'speed', initial: { kind: 'uniform', min: .4, max: .6 }, min: .4, max: .6, mutationSd: .02 },
  { key: 'reaction', initial: { kind: 'uniform', min: .4, max: .6 }, min: .4, max: .6, mutationSd: .02 },
  { key: 'agility', initial: { kind: 'uniform', min: .4, max: .6 }, min: .4, max: .6, mutationSd: .02 },
  { key: 'hp', initial: { kind: 'normal', mean: 100, sd: 10 }, min: 70, max: 130, mutationSd: 3 },
  { key: 'shell', initial: { kind: 'normal', mean: 0, sd: .15 }, min: -1, max: 1, mutationSd: .05 },
]
export const clampTrait = (value: number, trait: TraitDef) => Math.max(trait.min, Math.min(trait.max, value))
export function sampleGenome(rng: SeededRandom): Genome {
  const genome = {} as Genome
  for (const trait of TRAITS) {
    const d = trait.initial
    genome[trait.key] = clampTrait(d.kind === 'uniform' ? rng.between(d.min, d.max) : rng.normal(d.mean, d.sd), trait)
  }
  return genome
}
