import type { LevelDefinition } from './LevelDefinition.ts'
export const level01: LevelDefinition = {
  id: 'level01', width: 3072, height: 640,
  spawnPoint: { x: 64, y: 448 },
  exitArea: { x: 2912, y: 320, width: 64, height: 128 },
  terrain: [
    { x: 0, y: 448, width: 1696, height: 192 },
    { x: 704, y: 384, width: 256, height: 64 },
    { x: 1840, y: 448, width: 1232, height: 192 },
  ],
  initialTraps: [],
}

