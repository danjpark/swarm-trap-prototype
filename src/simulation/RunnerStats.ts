export interface RunnerStats { speed: number; reaction: number; agility: number }
export function averageStats(stats: RunnerStats[]): RunnerStats | null {
  if (!stats.length) return null
  return {
    speed: stats.reduce((s, r) => s + r.speed, 0) / stats.length,
    reaction: stats.reduce((s, r) => s + r.reaction, 0) / stats.length,
    agility: stats.reduce((s, r) => s + r.agility, 0) / stats.length,
  }
}

