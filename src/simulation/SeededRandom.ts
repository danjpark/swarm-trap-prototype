export class SeededRandom {
  private value: number
  constructor(seed: number) { this.value = seed >>> 0 }
  next() {
    let t = this.value += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
  between(min: number, max: number) { return min + this.next() * (max - min) }
  normal(mean: number, sd: number) {
    const u = 1 - this.next(), v = this.next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}
