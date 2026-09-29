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
import { TRAITS } from '../src/simulation/traits.ts'
import { SeededRandom } from '../src/simulation/SeededRandom.ts'
import { damageMultiplier } from '../src/simulation/damage.ts'
import { BASE_DAMAGE, HIT_COOLDOWN } from '../src/simulation/tuning.ts'
import { breedSurvivors } from '../src/simulation/evolution.ts'
import { Game } from '../src/game/Game.ts'

const spike: TrapDefinition = {id:'spike',type:'spike',damageType:'piercing',position:{x:896,y:416},radius:64,rotationSpeed:1.5,armCount:4}
const track: TrapDefinition = {id:'track',type:'track',position:{x:992,y:448},strength:165}
const platform: TrapDefinition = {id:'platform',type:'platform',position:{x:1120,y:448},minY:320,maxY:448,speed:80}
function run(defs: TrapDefinition[] = []) {
  const w = new World(level01)
  w.traps = defs.map(d => createTrap(structuredClone(d)))
  while (!w.complete) w.step()
  return w
}

test('100 independently seeded critters share one starting point', () => {
  const a = new World(level01), b = new World(level01), c = new World(level01,12)
  assert.deepEqual(a.runners,b.runners)
  assert.notDeepEqual(a.runners,c.runners)
  assert.equal(a.runners.length,100)
  assert.notEqual(a.runners[0].stats,a.runners[1].stats)
  for (const r of a.runners) assert.deepEqual(r.position, a.runners[0].position)
  assert.notEqual(a.runners[0].position, a.runners[1].position, 'positions remain independent objects')
  for (const r of a.runners) for (const trait of TRAITS) assert.ok(r.stats[trait.key]>=trait.min&&r.stats[trait.key]<=trait.max)
})

test('EVERY registered level is safe for all 100 runners without player devices, across 100 seeds', () => {
  for (const level of levels) for (let seed=0;seed<100;seed++) {
    const w = new World(level,seed)
    w.traps = level.initialTraps.map(createTrap)
    while (!w.complete) w.step()
    assert.deepEqual(w.counts,{alive:0,dead:0,escaped:100},level.id+' seed '+seed)
  }
})

test('baseline is safe at every extreme combination of registered traits from the shared spawn point', () => {
  for (const level of levels) for (let mask=0;mask<2**TRAITS.length;mask++) {
    const w = new World(level)
    w.traps = level.initialTraps.map(createTrap)
    for (const r of w.runners) {
      for (const [i, trait] of TRAITS.entries()) r.stats[trait.key] = mask & (1<<i) ? trait.max : trait.min
      r.hp = r.stats.hp
    }
    while (!w.complete) w.step()
    assert.equal(w.counts.escaped,100,JSON.stringify({level:level.id,mask}))
  }
})

test('normal initial HP sampling stays in bounds and centers on 100', () => {
  const rng = new SeededRandom(42)
  const hp = TRAITS.find(t=>t.key==='hp')!
  const values = Array.from({length:10000},()=>Math.max(hp.min,Math.min(hp.max,rng.normal(100,10))))
  assert.ok(Math.abs(values.reduce((sum,n)=>sum+n,0)/values.length-100)<=1)
  assert.ok(values.every(n=>n>=70&&n<=130))
})

test('opposed damage multipliers are bounded for both damage types', () => {
  for (const shell of [-1,0,1]) {
    assert.equal(damageMultiplier('piercing',shell),1-.5*shell)
    assert.equal(damageMultiplier('blunt',shell),1+.5*shell)
  }
  for (const shell of [-10,-1,0,1,10]) for (const type of ['blunt','piercing'] as const) {
    assert.ok(damageMultiplier(type,shell)>=.5 && damageMultiplier(type,shell)<=1.5)
  }
})

test('one runner jumps the hill and finishes at the exit', () => {
  const w=new World(level01,240519,[new World(level01).runners[0].stats])
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

test('player-placed spikes damage runners; the wheel hub is harmless', () => {
  const w=run([spike])
  assert.ok(w.runners.some(r=>r.hp<r.stats.hp))
  assert.ok(w.runners.filter(r=>!r.alive).every(r=>r.deathCause==='piercing'))
  const wheel=createTrap(spike),near=new World(level01,240519,[new World(level01).runners[0].stats])
  near.runners[0].position={x:spike.position.x-6,y:spike.position.y-9}
  wheel.update(FIXED_DT,0);wheel.interact(near.runners[0],near)
  assert.equal(near.runners[0].alive,true)
})

test('one passing wheel arm hits once and cooldown is per device', () => {
  const w = new World(level01), r=w.runners[0]
  const a={...spike,id:'one'}, b={...spike,id:'two',damageType:'blunt' as const}
  const wheel=createTrap(a)
  r.position={x:spike.position.x+spike.radius!-6,y:spike.position.y-9}
  wheel.update(0,0)
  wheel.interact(r,w)
  const hp=r.hp
  for(let i=0;i<10;i++){w.tick++;wheel.interact(r,w)}
  assert.equal(r.hp,hp)
  w.hit(r,b)
  assert.ok(r.hp<hp)
  w.tick+=Math.ceil(HIT_COOLDOWN/FIXED_DT)
  w.hit(r,a)
  assert.ok(r.hp<=hp-BASE_DAMAGE*.5)
})

test('only finished runners breed and children stay inside every trait bound', () => {
  const w=new World(level01)
  w.runners[0].finished=true
  for(const trait of TRAITS) w.runners[0].stats[trait.key]=trait.max
  for(const r of w.runners.slice(1)) for(const trait of TRAITS) r.stats[trait.key]=trait.min
  const children=breedSurvivors(w.runners,1)!
  assert.equal(children.length,100)
  for(const child of children) for(const trait of TRAITS) {
    assert.ok(child[trait.key]>=trait.min && child[trait.key]<=trait.max)
    assert.ok(child[trait.key]>=trait.max-6*trait.mutationSd)
  }
})

test('extinction freezes generation; an aborted run does not breed', () => {
  const game=Object.create(Game.prototype) as Game
  game.world=new World({...level01,terrain:[...level01.terrain,{x:416,y:0,width:32,height:448}]})
  game.generation=1;game.extinct=false;game.currentGenomes=undefined
  game.world.step()
  assert.equal(game.generation,1)
  assert.equal(game.world.complete,false)
  while(!game.world.complete)game.world.step()
  assert.equal(game.world.counts.escaped,0)
  game.completeRun()
  assert.equal(game.generation,1)
  assert.equal(game.extinct,true)
  assert.equal(game.currentGenomes,undefined)
})

test('same seed and devices produce identical genomes through generation 5', () => {
  const lineage=()=>{
    let genomes: NonNullable<ReturnType<typeof breedSurvivors>> | undefined
    for(let generation=1;generation<=4;generation++){
      const w=new World(level01,240519,genomes??undefined)
      w.traps=[track,platform].map(d=>createTrap(structuredClone(d)))
      while(!w.complete)w.step()
      genomes=breedSurvivors(w.runners,generation)
      assert.ok(genomes)
    }
    return genomes
  }
  assert.deepEqual(lineage(),lineage())
})

test('conveyor slows traversal without direct damage', () => {
  const w=run([track])
  assert.ok(w.time>run().time+3)
  assert.ok(w.runners.filter(r=>!r.alive).every(r=>r.deathCause==='fall'||r.deathCause==='timeout'))
})

test('platforms move only vertically and carry standing runners', () => {
  const lift=createTrap(platform);lift.update(FIXED_DT,1)
  assert.equal(lift.position.x,1120);assert.equal(lift.position.y,368)
  const r=new World(level01).runners[0]
  r.position={x:20,y:182};r.supportId='lift';r.grounded=true
  updateRunner(r,FIXED_DT,[{x:0,y:199,width:96,height:12,id:'lift',oneWay:true,deltaY:-1}],0)
  assert.equal(r.position.y,181);assert.equal(r.supportId,'lift');assert.equal(r.grounded,true)
})

test('moving platforms allow runners to pass from below', () => {
  const r=new World(level01).runners[0]
  r.position={x:30,y:205};r.velocity.y=-300;r.grounded=false
  for(let i=0;i<10;i++)updateRunner(r,FIXED_DT,[{x:0,y:200,width:96,height:12,id:'lift',oneWay:true,deltaY:0}],0)
  assert.ok(r.position.y<190);assert.ok(!r.grounded)
})

test('editor validates the shortened course, protects start/exit, moves and removes', () => {
  const ed=new Editor(level01),d=ed.candidate('spike',890,409)
  assert.deepEqual(d.position,{x:896,y:416});assert.ok(ed.place(d))
  assert.ok(!ed.place(ed.candidate('spike',100,300)))
  assert.ok(!ed.place(ed.candidate('spike',1472,320)))
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
  const w=new World(level01);w.traps=[spike,track,platform].map(createTrap)
  while(!w.complete){w.step();const c=w.counts;assert.equal(c.alive+c.dead+c.escaped,100)}
  const state=structuredClone(w.runners);w.step();assert.deepEqual(w.runners,state)
})
