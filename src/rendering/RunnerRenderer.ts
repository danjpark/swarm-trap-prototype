import type { Runner } from '../simulation/Runner.ts'
import { HIT_FLASH } from '../simulation/tuning.ts'
export interface RunnerRenderer {
  draw(ctx: CanvasRenderingContext2D, runner: Runner, time: number, debug: boolean): void
}
export class ProceduralRunnerRenderer implements RunnerRenderer {
  draw(ctx: CanvasRenderingContext2D, r: Runner, time: number, debug: boolean) {
    if (r.finished) return
    const deathAge = time-r.deathTime
    if (!r.alive && deathAge > 0.45) return
    const bounce = r.grounded ? Math.sin(time*19+r.id)*1.5 : 0
    const x=r.position.x, y=r.position.y + bounce
    if (!r.alive) {
      ctx.globalAlpha = Math.max(0,1-deathAge/0.45)
      ctx.strokeStyle='#e27550'; ctx.lineWidth=2
      ctx.beginPath(); ctx.arc(x+6,y+8,6+deathAge*30,0,Math.PI*2);ctx.stroke()
      ctx.globalAlpha=1
      return
    }
    const scale=.9+(r.stats.hp-70)/300
    const shell=r.stats.shell
    const flash=time-r.hitTime<HIT_FLASH
    ctx.save()
    ctx.translate(x+6,y+9);ctx.scale(scale,scale);ctx.translate(-6,-9)
    ctx.fillStyle=flash?'#fff5da':shell>.05?'#6e9369':shell<-.05?'#d5e9b1':['#b6d67a','#a7c965','#cee693','#82b99d'][r.id%4]
    ctx.strokeStyle=shell>.05?'#263e37':'#385547'; ctx.lineWidth=shell>.05?2:1
    ctx.beginPath();ctx.roundRect(0,0,12,14,shell<-.05?7:5);ctx.fill();ctx.stroke()
    if(shell>.05){ctx.strokeStyle='#b1c8a2';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(2,3);ctx.lineTo(5,4);ctx.moveTo(2,8);ctx.lineTo(5,9);ctx.stroke()}
    ctx.fillStyle='#213c34'
    ctx.fillRect(7,4,2,3);ctx.fillRect(10,4,2,3)
    const leg = r.grounded ? Math.sin(time*22+r.id)*2.5 : 2
    ctx.lineWidth=2;ctx.beginPath()
    ctx.moveTo(3,13);ctx.lineTo(3-leg,18)
    ctx.moveTo(9,13);ctx.lineTo(9+leg,18);ctx.stroke()
    ctx.restore()
    if(r.hp<r.stats.hp){
      ctx.fillStyle='#263e37';ctx.fillRect(x,y-4,12,2)
      ctx.fillStyle='#efb66b';ctx.fillRect(x,y-4,12*Math.max(0,r.hp/r.stats.hp),2)
    }
    if(debug) {
      ctx.strokeStyle='#ed735a';ctx.lineWidth=0.7;ctx.strokeRect(x,r.position.y,12,18)
      ctx.beginPath();ctx.moveTo(x+12,y+8);ctx.lineTo(x+20+r.stats.reaction*28,y+8);ctx.stroke()
    }
  }
}
