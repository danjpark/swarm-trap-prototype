import test from 'node:test'
import assert from 'node:assert/strict'
import { World, FIXED_DT } from '../src/game/World.ts'
import { FixedStepper } from '../src/game/GameLoop.ts'
import { Camera } from '../src/game/Camera.ts'
import { Editor } from '../src/game/Editor.ts'
import { level01 } from '../src/levels/level01.ts'
import { levels } from '../src/levels/index.ts'
import { createTrap } from '../src/traps/factory.ts'
import { RunRecorder } from '../src/replay/RunRecorder.ts'
import { GhostReplay } from '../src/replay/GhostReplay.ts'
import { updateRunner } from '../src/simulation/RunnerSystem.ts'
import type { TrapDefinition } from '../src/traps/Trap.ts'

const fire: TrapDefinition = {id:'fire',type:'fire',position:{x:896,y:416},radius:64,rotationSpeed:1.5,armCount:4}
const track: TrapDefinition = {id:'track',type:'track',position:{x:992,y:448},strength:165}
const platform: TrapDefinition = {id:'platform',type:'platform',position:{x:1120,y:448},minY:320,maxY:448,speed:80}
function run(defs: TrapDefinition[] = []) {
  const w = new World(level01)
  w.traps = defs.map(d => createTrap(structuredClone(d)))
  while (!w.complete) w.step()
  return w
}

test('100 independent bounded traits are reproducible', () => {
  const a = new World(level01), b = new World(level01), c = new World(level01,12)
  assert.deepEqual(a.runners,b.runners)
  assert.notDeepEqual(a.runners,c.runners)
  assert.equal(a.runners.length,100)
  assert.notEqual(a.runners[0].stats,a.runners[1].stats)
  for (const r of a.runners) for (const v of Object.values(r.stats)) assert.ok(v>=.4&&v<=.6)
})

test('EVERY registered level is safe for all 100 runners without player devices, across 100 seeds', () => {
  for (const level of levels) for (let seed=0;seed<100;seed++) {
    const w = new World(level,seed)
    w.traps = level.initialTraps.map(createTrap)
    while (!w.complete) w.step()
    assert.deepEqual(w.counts,{alive:0,dead:0,escaped:100},level.id+' seed '+seed)
  }
})

test('baseline is safe at every extreme combination of supported traits and spawn positions', () => {
  for (const level of levels) for (const speed of [.4,.6]) for (const reaction of [.4,.6]) for (const agility of [.4,.6]) {
    const w = new World(level)
    w.traps = level.initialTraps.map(createTrap)
    for (const r of w.runners) r.stats={speed,reaction,agility}
    while (!w.complete) w.step()
    assert.equal(w.counts.escaped,100,JSON.stringify({level:level.id,speed,reaction,agility}))
  }
})

test('one runner jumps the hill and finishes at the exit', () => {
  const w=new World(level01,240519,1)
  let highest=448
  while(!w.complete){w.step();highest=Math.min(highest,w.runners[0].position.y)}
  assert.ok(highest<300)
  assert.equal(w.counts.escaped,1)
})

test('fixed-step outcomes match across playback rates and render cadences', () => {
  const expected=run([track,platform])
  for(const speed of [.5,1,2,4]){
    const w=new World(level01);w.traps=[track,platform].map(d=>createTrap(structuredClone(d)))
    const loop=new FixedStepper();let frame=0
    while(!w.complete)loop.advance([1/30,1/60,1/144][frame++%3],speed,()=>w.step())
    assert.deepEqual(w.runners,expected.runners)
    assert.equal(w.tick,expected.tick)
  }
})

test('player-placed fire stops runners; the wheel hub is harmless', () => {
  const w=run([fire])
  assert.ok(w.counts.dead>0)
  assert.ok(w.runners.filter(r=>!r.alive).every(r=>r.deathCause==='fire'))
  const wheel=createTrap(fire),near=new World(level01,240519,1)
  near.runners[0].position={x:fire.position.x-6,y:fire.position.y-9}
  wheel.update(FIXED_DT,0);wheel.interact(near.runners[0],near)
  assert.equal(near.runners[0].alive,true)
})

test('conveyor slows traversal without direct damage', () => {
  const w=run([track])
  assert.ok(w.time>run().time+3)
  assert.ok(w.runners.filter(r=>!r.alive).every(r=>r.deathCause==='fall'||r.deathCause==='timeout'))
})

test('platforms move only vertically and carry standing runners', () => {
  const lift=createTrap(platform);lift.update(FIXED_DT,1)
  assert.equal(lift.position.x,1120);assert.equal(lift.position.y,368)
  const r=new World(level01,240519,1).runners[0]
  r.position={x:20,y:182};r.supportId='lift';r.grounded=true
  updateRunner(r,FIXED_DT,[{x:0,y:199,width:96,height:12,id:'lift',oneWay:true,deltaY:-1}],0)
  assert.equal(r.position.y,181);assert.equal(r.supportId,'lift');assert.equal(r.grounded,true)
})

test('moving platforms allow runners to pass from below', () => {
  const r=new World(level01,240519,1).runners[0]
  r.position={x:30,y:205};r.velocity.y=-300;r.grounded=false
  for(let i=0;i<10;i++)updateRunner(r,FIXED_DT,[{x:0,y:200,width:96,height:12,id:'lift',oneWay:true,deltaY:0}],0)
  assert.ok(r.position.y<190);assert.ok(!r.grounded)
})

test('editor validates the shortened course, protects start/exit, moves and removes', () => {
  const ed=new Editor(level01),d=ed.candidate('fire',890,409)
  assert.deepEqual(d.position,{x:896,y:416});assert.ok(ed.place(d))
  assert.ok(!ed.place(ed.candidate('fire',100,300)))
  assert.ok(!ed.place(ed.candidate('fire',1472,320)))
  assert.ok(!ed.place(ed.candidate('track',1120,448)))
  assert.ok(!ed.place(ed.candidate('platform',576,448)))
  assert.ok(ed.move(ed.selectedId!,960,384));assert.equal(ed.selected!.position.x,960)
  ed.removeSelected();assert.equal(ed.definitions.length,0)
})

test('15Hz previous-run recordings are time-aligned and do not affect simulation', () => {
  const w=new World(level01),rec=new RunRecorder();rec.capture(w)
  while(!w.complete){w.step();rec.capture(w)}
  const recording=rec.finish(w),ghost=new GhostReplay(recording)
  assert.equal(recording.frames[0][0],64)
  assert.ok(recording.frames.length<=w.time*15+2)
  assert.ok(recording.frames.every(f=>f.length===300))
  assert.equal(ghost.frame(0),recording.frames[0]);assert.equal(ghost.frame(8),recording.frames[1])
  assert.equal(ghost.frame(w.tick+120),null)
  assert.deepEqual(w.runners,run().runners)
  assert.ok(Array.from(recording.frames.at(-1)!).filter((_,i)=>i%3===2).every(v=>v===0))
})

test('blocked runners stop at 60 seconds', () => {
  const w=new World({...level01,terrain:[...level01.terrain,{x:416,y:0,width:32,height:448}]})
  while(!w.complete)w.step()
  assert.equal(w.time,60);assert.equal(w.counts.dead,100)
  assert.ok(w.runners.every(r=>r.deathCause==='timeout'))
})

test('full-course framing stays anchored at the start and includes the exit', () => {
  const camera=new Camera();camera.x=900;camera.fit(level01.width)
  assert.equal(camera.x,0)
  assert.equal(camera.width,level01.width)
  assert.ok(camera.width>=level01.exitArea.x+level01.exitArea.width)
})

test('population accounting holds on every tick and stops changing after completion', () => {
  const w=new World(level01);w.traps=[fire,track,platform].map(createTrap)
  while(!w.complete){w.step();const c=w.counts;assert.equal(c.alive+c.dead+c.escaped,100)}
  const state=structuredClone(w.runners);w.step();assert.deepEqual(w.runners,state)
})
