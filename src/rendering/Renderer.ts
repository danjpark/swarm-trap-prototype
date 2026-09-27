import type { World } from '../game/World.ts'
import type { Camera } from '../game/Camera.ts'
import type { TrapDefinition } from '../traps/Trap.ts'
import type { GhostReplay } from '../replay/GhostReplay.ts'
import { createTrap } from '../traps/factory.ts'
import { ProceduralRunnerRenderer } from './RunnerRenderer.ts'
import type { RunnerRenderer } from './RunnerRenderer.ts'
import { drawTerrain } from './TerrainRenderer.ts'
import { drawTrap } from './TrapRenderer.ts'
export class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  runnerRenderer: RunnerRenderer = new ProceduralRunnerRenderer()
  scale = 1
  height = 560
  constructor(canvas: HTMLCanvasElement) { this.canvas=canvas;this.ctx=canvas.getContext('2d')! }
  resize(camera: Camera, worldWidth: number) {
    const rect=this.canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio,2)
    if(this.canvas.width!==Math.round(rect.width*dpr)||this.canvas.height!==Math.round(rect.height*dpr)){
      this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr)
    }
    this.scale=rect.width/worldWidth
    camera.fit(worldWidth)
  }
  draw(w: World, camera: Camera, options: { build: boolean; debug: boolean; selected: string|null; ghost: GhostReplay|null; candidate: TrapDefinition|null; valid: boolean; selectedRunner: number|null }) {
    this.resize(camera, w.level.width)
    const c=this.ctx, dpr=Math.min(window.devicePixelRatio,2), width=this.canvas.width/dpr
    c.setTransform(dpr,0,0,dpr,0,0)
    c.fillStyle='#edf0e5';c.fillRect(0,0,width,this.canvas.height/dpr)
    c.scale(this.scale,this.scale);c.translate(-camera.x,0)
    if(options.build){
      c.fillStyle='#d4dccc'
      for(let x=Math.floor(camera.x/32)*32;x<camera.x+camera.width;x+=32)for(let y=32;y<448;y+=32)c.fillRect(x,y,1.5,1.5)
    }
    c.fillStyle='#e3e8d9';c.beginPath();c.arc(920+camera.x*.5,118,39,0,Math.PI*2);c.fill()
    c.strokeStyle='#dce3d3';c.lineWidth=1
    c.beginPath();c.moveTo(camera.x,280);c.lineTo(camera.x+camera.width,280);c.stroke()
    drawTerrain(c,w.level)
    if(options.ghost){
      const frame=options.ghost.frame(w.tick)
      if(frame){
        c.fillStyle='#9990c0';c.globalAlpha=.27
        for(let i=0;i<frame.length;i+=3)if(frame[i+2]&&frame[i]>camera.x-20&&frame[i]<camera.x+camera.width){
          c.beginPath();c.roundRect(frame[i],frame[i+1],12,18,[6,6,2,2]);c.fill()
        }
        c.globalAlpha=1
      }
    }
    for(const t of w.traps)drawTrap(c,t,w.time,t.definition.id===options.selected)
    for(const r of w.runners)if(r.position.x>camera.x-40&&r.position.x<camera.x+camera.width+40)this.runnerRenderer.draw(c,r,w.time,options.debug)
    if(options.selectedRunner!==null){
      const r=w.runners[options.selectedRunner]
      c.strokeStyle='#678384';c.lineWidth=2;c.beginPath();c.arc(r.position.x+6,r.position.y+7,17,0,Math.PI*2);c.stroke()
    }
    if(options.candidate){
      c.globalAlpha=options.valid?.55:.22
      drawTrap(c,createTrap(options.candidate),0,true)
      c.globalAlpha=1
      c.fillStyle=options.valid?'#365c47':'#b86246';c.font='11px system-ui'
      c.fillText(options.valid?'Click to place':'Choose open space / a valid surface',options.candidate.position.x-30,options.candidate.position.y-85)
    }
    c.setTransform(1,0,0,1,0,0)
  }
}
