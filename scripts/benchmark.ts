import { World } from '../src/game/World.ts'
import { level01 } from '../src/levels/level01.ts'
import { createTrap } from '../src/traps/factory.ts'
import type { TrapDefinition } from '../src/traps/Trap.ts'
const layouts: Record<string,TrapDefinition[]> = {
  baseline: [],
  spike: [{id:'wheel',type:'spike',damageType:'piercing',position:{x:896,y:416},radius:64,rotationSpeed:1.5,armCount:4}],
  conveyor: [{id:'belt',type:'track',position:{x:992,y:448},strength:165}],
  platform: [{id:'lift',type:'platform',position:{x:1120,y:448},minY:320,maxY:448,speed:80}],
}
for(const [name,defs] of Object.entries(layouts)){
  const samples:number[]=[]
  let result:World|undefined
  for(let n=0;n<25;n++){
    const w=new World(level01);w.traps=defs.map(d=>createTrap(structuredClone(d)))
    const start=performance.now()
    while(!w.complete)w.step()
    if(n>=5)samples.push(performance.now()-start)
    result=w
  }
  const mean=samples.reduce((sum,n)=>sum+n,0)/samples.length
  console.log(JSON.stringify({layout:name,runners:100,counts:result!.counts,simulationSeconds:result!.time,meanWholeRunMs:+mean.toFixed(2),meanTickMs:+(mean/result!.tick).toFixed(4),survivorStats:result!.survivorStats}))
}

