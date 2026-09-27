import type { LevelDefinition } from '../levels/LevelDefinition.ts'
export function drawTerrain(ctx: CanvasRenderingContext2D, level: LevelDefinition) {
  for(const t of level.terrain){
    ctx.fillStyle='#344d42';ctx.fillRect(t.x,t.y,t.width,t.height)
    ctx.fillStyle='#a7c594';ctx.fillRect(t.x,t.y,t.width,5)
    ctx.fillStyle='#496154'
    for(let x=t.x+16;x<t.x+t.width;x+=32) for(let y=t.y+24;y<t.y+t.height;y+=32)ctx.fillRect(x,y,2,2)
    ctx.strokeStyle='#587060';ctx.lineWidth=1
    for(let x=t.x+64;x<t.x+t.width;x+=64){ctx.beginPath();ctx.moveTo(x,t.y+7);ctx.lineTo(x,t.y+18);ctx.stroke()}
  }
  ctx.font='10px ui-monospace, monospace';ctx.letterSpacing='1px'
  ctx.fillStyle='#7b8a77';ctx.fillText('01 / THE RISE',708,353);ctx.fillText('02 / THE LEAP',1684,300)
  ctx.strokeStyle='#aebdaa';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(1696,324);ctx.lineTo(1840,324);ctx.stroke();ctx.setLineDash([])
  ctx.fillStyle='#829480';ctx.fillText('144 px',1742,315)
  ctx.letterSpacing='0px'
  // Original, procedural start and exit markers.
  ctx.fillStyle='#74937a';ctx.fillRect(48,365,3,83)
  ctx.fillStyle='#b7cc9e';ctx.beginPath();ctx.moveTo(51,365);ctx.lineTo(100,365);ctx.lineTo(89,387);ctx.lineTo(51,387);ctx.fill()
  ctx.fillStyle='#355242';ctx.fillText('IN',61,380)
  const e=level.exitArea
  ctx.fillStyle='#deead0';ctx.beginPath();ctx.roundRect(e.x,e.y+48,56,80,[28,28,0,0]);ctx.fill()
  ctx.strokeStyle='#6f9477';ctx.lineWidth=3;ctx.stroke()
  ctx.fillStyle='#365940';ctx.font='22px system-ui';ctx.fillText('→',e.x+17,e.y+98)
  ctx.font='10px ui-monospace, monospace';ctx.fillText('EXIT',e.x+14,e.y+35)
}

