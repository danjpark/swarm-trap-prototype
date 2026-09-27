export interface Vector2 { x: number; y: number }
export interface Rectangle extends Vector2 { width: number; height: number }
export const overlaps = (a: Rectangle, b: Rectangle) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

