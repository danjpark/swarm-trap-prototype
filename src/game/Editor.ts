import type { LevelDefinition } from '../levels/LevelDefinition.ts'
import type { TrapDefinition, TrapType } from '../traps/Trap.ts'
import { clamp, overlaps } from '../types/geometry.ts'
export const GRID = 32
export const TRAP_NAMES = { fire: 'Fire Wheel', track: 'Reverse Track', platform: 'Vertical Platform' }
export class Editor {
  definitions: TrapDefinition[] = []
  tool: TrapType | 'select' = 'select'
  selectedId: string | null = null
  private nextId = 1
  level: LevelDefinition
  constructor(level: LevelDefinition) { this.level = level; this.definitions = structuredClone(level.initialTraps) }
  get selected() { return this.definitions.find(d => d.id === this.selectedId) }
  candidate(type: TrapType, x: number, y: number): TrapDefinition {
    x = Math.round(x / GRID) * GRID
    y = clamp(Math.round(y / GRID) * GRID, 64, 448)
    if (type === 'track') {
      const floors = this.level.terrain.filter(t => x >= t.x && x + 128 <= t.x + t.width && Math.abs(t.y - y) <= 96)
      if (floors.length) y = Math.min(...floors.map(t => t.y))
    }
    return { id: 'candidate', type, position: {x, y}, ...(type === 'fire' ? {radius:64, rotationSpeed:1.5, armCount:4} :
      type === 'track' ? {strength:165} : { minY:Math.max(64, y - 128), maxY:y, speed:80 }) }
  }
  valid(d: TrapDefinition, ignoreId?: string) {
    const { x, y } = d.position
    const width = d.type === 'track' ? 128 : d.type === 'platform' ? 96 : 16
    if (x < this.level.spawnPoint.x + 352 || x + width > this.level.exitArea.x - 64 || y < 48 || y > 448) return false
    if (d.type === 'track') {
      if (!this.level.terrain.some(t => x >= t.x && x + width <= t.x + t.width && y === t.y)) return false
      if (this.level.terrain.some(t => overlaps({x,y:y-12,width,height:12}, t))) return false
    } else if (d.type === 'fire') {
      if (this.level.terrain.some(t => overlaps({x:x-8,y:y-8,width:16,height:16},t))) return false
    } else {
      const minY = d.minY ?? y - 128, maxY = d.maxY ?? y
      if (minY >= maxY || minY < 32 || maxY > 512) return false
      if (this.level.terrain.some(t => overlaps({x,y:minY,width,height:maxY-minY},t))) return false
    }
    return !this.definitions.some(other => other.id !== ignoreId && other.type === d.type &&
      Math.abs(other.position.x - x) < (d.type === 'fire' ? 24 : width) && Math.abs(other.position.y - y) < 24)
  }
  place(d: TrapDefinition) {
    if (!this.valid(d)) return false
    this.definitions.push({ ...structuredClone(d), id: 'trap-' + this.nextId++ })
    this.selectedId = this.definitions.at(-1)!.id
    return true
  }
  move(id: string, x: number, y: number) {
    const d = this.definitions.find(t => t.id === id)
    if (!d) return false
    const next = this.candidate(d.type, x, y)
    const delta = next.position.y - d.position.y
    const moved = { ...d, position: next.position, ...(d.type === 'platform' ? { minY: d.minY! + delta, maxY: d.maxY! + delta } : {}) }
    if (!this.valid(moved, id)) return false
    Object.assign(d, moved)
    return true
  }
  removeSelected() { this.definitions = this.definitions.filter(d => d.id !== this.selectedId); this.selectedId = null }
  hit(x: number, y: number) {
    return [...this.definitions].reverse().find(d => {
      const p = d.position
      return d.type === 'fire' ? Math.hypot(x-p.x,y-p.y) < (d.radius ?? 64) + 12 :
        x >= p.x - 8 && x <= p.x + (d.type === 'track' ? 128 : 96) + 8 && Math.abs(y-p.y) < 24
    })
  }
}

