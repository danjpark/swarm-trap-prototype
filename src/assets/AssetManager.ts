export interface AnimationDefinition { frames: number[]; fps: number; loop: boolean }
export interface SpriteDefinition {
  src: string // PNG or WebP sheet; no gameplay dependency on any asset.
  frameWidth: number
  frameHeight: number
  animations: Record<string, AnimationDefinition>
}
export class AssetManager {
  private images = new Map<string, HTMLImageElement>()
  async load(definition: SpriteDefinition) {
    const existing = this.images.get(definition.src)
    if (existing) return existing
    const image = new Image()
    image.src = definition.src
    await image.decode()
    this.images.set(definition.src, image)
    return image
  }
}

