import type { Trap } from '../traps/Trap.ts'
import type { DamageWheel } from '../traps/DamageWheel.ts'
export function drawTrap(ctx: CanvasRenderingContext2D, t: Trap, time: number, selected = false) {
  const {x,y}=t.position, d=t.definition
  ctx.save()
  if ((d.type === 'spike' || d.type === 'hammer')) {
    const radius=d.radius??64, arms=d.armCount??4, angle=(t as DamageWheel).angle
    ctx.strokeStyle=selected?'#db6a43':'#d8d4bd';ctx.lineWidth=1
    ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(x,y,radius+12,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])
    for(let i=0;i<arms;i++){
      const a=angle+i*Math.PI*2/arms, ex=x+Math.cos(a)*radius, ey=y+Math.sin(a)*radius
      ctx.strokeStyle='#6c7668';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke()
      ctx.strokeStyle='#ee9463';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath()
      ctx.moveTo(x+Math.cos(a)*radius*.72,y+Math.sin(a)*radius*.72);ctx.lineTo(ex,ey);ctx.stroke()
      ctx.fillStyle=d.type==='spike'?'#e7ded0':'#f9c07e';ctx.beginPath();if(d.type==='spike'){const tip=radius+8;ctx.moveTo(x+Math.cos(a)*tip,y+Math.sin(a)*tip);ctx.lineTo(ex+Math.cos(a+2.3)*8,ey+Math.sin(a+2.3)*8);ctx.lineTo(ex+Math.cos(a-2.3)*8,ey+Math.sin(a-2.3)*8);ctx.closePath()}else ctx.arc(ex,ey,7,0,Math.PI*2);ctx.fill()
    }
    ctx.fillStyle='#314c40';ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#f5f4e9';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill()
  } else if(d.type==='track'){
    ctx.fillStyle='#d7ae5b';ctx.beginPath();ctx.roundRect(x,y-10,128,12,5);ctx.fill()
    ctx.fillStyle='#485343';ctx.fillRect(x+5,y-7,118,5)
    ctx.strokeStyle='#e6c579';ctx.lineWidth=2
    for(let i=0;i<8;i++){const px=x+8+((i*16-time*60)%112+112)%112;ctx.beginPath();ctx.moveTo(px+4,y-7);ctx.lineTo(px,y-4);ctx.lineTo(px+4,y-1);ctx.stroke()}
  } else {
    ctx.strokeStyle='#7ba5ab';ctx.lineWidth=1;ctx.setLineDash([4,5])
    for(const px of [x+12,x+84]){ctx.beginPath();ctx.moveTo(px,d.minY??y-128);ctx.lineTo(px,d.maxY??y);ctx.stroke()}
    ctx.setLineDash([]);ctx.fillStyle='#6da0a5';ctx.beginPath();ctx.roundRect(x,y,96,12,4);ctx.fill()
    ctx.fillStyle='#bbd9d4';ctx.fillRect(x+4,y,88,3)
    ctx.strokeStyle='#3d6d73';ctx.beginPath();ctx.moveTo(x+44,y+8);ctx.lineTo(x+48,y+4);ctx.lineTo(x+52,y+8);ctx.stroke()
  }
  if(selected){ctx.strokeStyle='#365c47';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);if(d.type!=='spike' && d.type!=='hammer')ctx.strokeRect(x-5,y-16,d.type==='track'?138:106,34)}
  ctx.restore()
}

