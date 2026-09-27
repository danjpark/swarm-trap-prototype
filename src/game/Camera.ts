// The alpha always shows the complete course. This remains a separate view
// object so later levels can choose a different framing policy.
export class Camera {
  x = 0
  width = 1600
  fit(worldWidth: number) { this.x = 0; this.width = worldWidth }
}

