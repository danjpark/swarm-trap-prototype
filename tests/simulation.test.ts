import test from 'node:test'
import assert from 'node:assert/strict'
import { World, FIXED_DT } from '../src/game/World.ts'
import { FixedStepper } from '../src/game/GameLoop.ts'
import { Editor } from '../src/game/Editor.ts'
import { level01 } from '../src/levels/level01.ts'
import { createTrap } from '../src/traps/factory.ts'
import { RunRecorder } from '../src/replay/RunRecorder.ts'
import { GhostReplay } from '../src/replay/GhostReplay.ts'
import { updateRunner } from '../src/simulation/RunnerSystem.ts'
import type { TrapDefinition } from '../src/traps/Trap.ts'
const fire: TrapDefinition={id:'fire',type:'fire',position:{x:1216,y:416},radius:64,rotationSpeed:1.5,armCount:4}
const track: TrapDefinition={id:'track',type:'track',position:{x:1568,y:448},strength:165}
const platform: TrapDefinition={id:'platform',type:'platform',position:{x:1728,y:448},minY:320,maxY:448,speed:80}
function run(defs:TrapDefinition[]=[]){
 const w=new World(level01);w.traps=defs.map(d=>createTrap(structuredClone(d)))
 while(!w.complete)w.step()
 return w
}
test('100 independent bounded traits are reproducible; a new seed changes the population',()=>{
 const a=new World(level01),b=new World(level01),c=new World(level01,12)
 assert.deepEqual(a.runners,b.runners);assert.notDeepEqual(a.runners,c.runners)
 assert.equal(a.runners.length,100);assert.notEqual(a.runners[0].stats,a.runners[1].stats)
 for(const r of a.runners)for(const v of Object.values(r.stats))assert.ok(v>=.4&&v<=.6)
})
test('one runner jumps the hill and can finish; less capable runners fall at the gap',()=>{
 const w=new World(level01,240519,1);w.runners[0].stats={speed:.55,reaction:.55,agility:.55}
 let high=448
 while(!w.complete){w.step();high=Math.min(high,w.runners[0].position.y)}
 assert.ok(high<300);assert.equal(w.counts.escaped,1)
 const weak=new World(level01,240519,1)
 weak.runners[0].stats.reaction=.4
 while(!weak.complete)weak.step()
 assert.equal(weak.runners[0].deathCause,'fall')
})
test('baseline has both deaths and survivors with consistent accounting',()=>{
 const w=run();assert.deepEqual(w.counts,{alive:0,dead:39,escaped:61})
 assert.ok(w.survivorStats!.reaction>.52)
 assert.ok(w.runners.every(r=>!(r.finished&&!r.alive)))
})
test('speed multipliers and varying render cadence produce identical full states',()=>{
 const expected=run([track,platform])
 for(const speed of [.5,1,2,4]){
  const w=new World(level01);w.traps=[track,platform].map(d=>createTrap(structuredClone(d)))
  const loop=new FixedStepper();let frame=0
  while(!w.complete){loop.advance([1/30,1/60,1/144][frame++%3],speed,()=>w.step())}
  assert.deepEqual(w.runners,expected.runners);assert.equal(w.tick,expected.tick)
 }
})
test('fire kills through the rotating outer arms',()=>{
 const w=run([fire]);assert.equal(w.counts.dead,100)
 assert.ok(w.runners.every(r=>r.deathCause==='fire'))
 const wheel=createTrap(fire),near=new World(level01,240519,1)
 near.runners[0].position={x:fire.position.x-6,y:fire.position.y-9}
 wheel.update(FIXED_DT,0);wheel.interact(near.runners[0],near)
 assert.equal(near.runners[0].alive,true,'hub is not hazardous')
})
test('conveyor changes gap outcomes without directly killing',()=>{
 const w=run([track]);assert.ok(w.counts.escaped<10)
 assert.ok(w.runners.filter(r=>!r.alive).every(r=>r.deathCause==='fall'))
})
test('vertical platform catches runners and changes traversal outcomes',()=>{
 const w=run([platform]);assert.ok(w.counts.escaped>run().counts.escaped)
 const lift=createTrap(platform);lift.update(FIXED_DT,1)
 assert.equal(lift.position.x,1728);assert.equal(lift.position.y,368)
})
test('standing runners are carried vertically by platform surfaces',()=>{
 const r=new World(level01,240519,1).runners[0]
 r.position={x:20,y:182};r.supportId='lift';r.grounded=true
 updateRunner(r,FIXED_DT,[{x:0,y:199,width:96,height:12,id:'lift',oneWay:true,deltaY:-1}],0)
 assert.equal(r.position.y,181);assert.equal(r.supportId,'lift');assert.equal(r.grounded,true)
})
test('moving platforms are one-way and do not block runners from below',()=>{
 const r=new World(level01,240519,1).runners[0];r.position={x:30,y:205};r.velocity.y=-300;r.grounded=false
 for(let i=0;i<10;i++)updateRunner(r,FIXED_DT,[{x:0,y:200,width:96,height:12,id:'lift',oneWay:true,deltaY:0}],0)
 assert.ok(r.position.y<190);assert.ok(!r.grounded)
})
test('editor snaps, validates terrain, protects spawn, moves and removes',()=>{
 const ed=new Editor(level01),d=ed.candidate('fire',1210,409)
 assert.deepEqual(d.position,{x:1216,y:416});assert.ok(ed.place(d))
 assert.ok(!ed.place(ed.candidate('fire',100,300)))
 assert.ok(!ed.place(ed.candidate('track',1728,448)))
 assert.ok(!ed.place(ed.candidate('platform',704,448)))
 assert.ok(ed.move(ed.selectedId!,1280,384));assert.equal(ed.selected!.position.x,1280)
 ed.removeSelected();assert.equal(ed.definitions.length,0)
})
test('15Hz ghost recordings are bounded, time-aligned and do not affect physics',()=>{
 const w=new World(level01),rec=new RunRecorder();rec.capture(w)
 while(!w.complete){w.step();rec.capture(w)}
 const recording=rec.finish(w),ghost=new GhostReplay(recording)
 assert.equal(recording.frames[0][0],64);assert.ok(recording.frames.length<=w.time*15+2)
 assert.ok(recording.frames.every(f=>f.length===300))
 assert.equal(ghost.frame(0),recording.frames[0]);assert.equal(ghost.frame(8),recording.frames[1])
 assert.equal(ghost.frame(w.tick+120),null)
 assert.deepEqual(w.runners,run().runners)
 assert.ok(Array.from(recording.frames.at(-1)!).filter((_,i)=>i%3===2).every(v=>v===0))
})
test('stalled runners end at 60 seconds and are reported as contained',()=>{
 const w=new World({...level01,terrain:[...level01.terrain,{x:416,y:0,width:32,height:448}]})
 while(!w.complete)w.step()
 assert.equal(w.time,60);assert.equal(w.counts.dead,100)
 assert.ok(w.runners.every(r=>r.deathCause==='timeout'));assert.equal(w.survivorStats,null)
})


test('each trait measurably affects traversal, with better reaction and agility improving survival',()=>{
 for(const key of ['speed','reaction','agility'] as const){
  const counts=[]
  for(const value of [.4,.6]){
   const w=new World(level01);for(const r of w.runners)r.stats[key]=value
   while(!w.complete)w.step()
   counts.push(w.counts.escaped)
  }
  assert.ok(counts[1]>counts[0],key+' should improve aggregate traversal in this fixture')
 }
})

test('population accounting holds on every tick, including terminal states',()=>{
 const w=new World(level01);w.traps=[fire,track,platform].map(createTrap)
 while(!w.complete){w.step();const c=w.counts;assert.equal(c.alive+c.dead+c.escaped,100)}
 const state=structuredClone(w.runners);w.step();assert.deepEqual(w.runners,state)
})
