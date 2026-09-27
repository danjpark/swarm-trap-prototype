import type { Runner } from '../simulation/Runner.ts'
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
    ctx.fillStyle = ['#b6d67a','#a7c965','#cee693','#82b99d'][r.id%4]
    ctx.strokeStyle='#385547'; ctx.lineWidth=1
    ctx.beginPath();ctx.roundRect(x,y,12,14,5);ctx.fill();ctx.stroke()
    ctx.fillStyle='#213c34'
    ctx.fillRect(x+7,y+4,2,3);ctx.fillRect(x+10,y+4,2,3)
    const leg = r.grounded ? Math.sin(time*22+r.id)*2.5 : 2
    ctx.lineWidth=2;ctx.beginPath()
    ctx.moveTo(x+3,y+13);ctx.lineTo(x+3-leg,y+18)
    ctx.moveTo(x+9,y+13);ctx.lineTo(x+9+leg,y+18);ctx.stroke()
    if(debug) {
      ctx.strokeStyle='#ed735a';ctx.lineWidth=0.7;ctx.strokeRect(x,r.position.y,12,18)
      ctx.beginPath();ctx.moveTo(x+12,y+8);ctx.lineTo(x+20+r.stats.reaction*28,y+8);ctx.stroke()
    }
  }
}

