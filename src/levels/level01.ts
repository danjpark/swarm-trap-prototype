import type { LevelDefinition } from './LevelDefinition.ts'
export const level01: LevelDefinition = {
  // Baseline rule for every level: all 100 unmodified runners must finish
  // without player-placed devices. Challenge comes from the player's edits.
  id: 'level01', width: 1600, height: 640,
  spawnPoint: { x: 64, y: 448 },
  exitArea: { x: 1504, y: 320, width: 64, height: 128 },
  terrain: [
    { x: 0, y: 448, width: 1120, height: 192 },
    { x: 576, y: 384, width: 192, height: 64 },
    { x: 1216, y: 448, width: 384, height: 192 },
  ],
  initialTraps: [],
}

