import { level01 } from '../levels/level01.ts'
import { World } from './World.ts'
import { Camera } from './Camera.ts'
import { Editor } from './Editor.ts'
import { GameLoop, FixedStepper } from './GameLoop.ts'
import { Renderer } from '../rendering/Renderer.ts'
import { GameUI } from '../ui/GameUI.ts'
import { createTrap } from '../traps/factory.ts'
import type { TrapType, TrapDefinition } from '../traps/Trap.ts'
import { RunRecorder } from '../replay/RunRecorder.ts'
import type { Recording } from '../replay/RunRecorder.ts'
import { GhostReplay } from '../replay/GhostReplay.ts'
import { breedSurvivors } from '../simulation/evolution.ts'
import type { Genome } from '../simulation/traits.ts'
import { DEFAULT_SEED } from '../simulation/tuning.ts'
export type GameMode='BUILD'|'PREVIEW'|'RUN'
export class Game {
  world=new World(level01)
  editor=new Editor(level01)
  camera=new Camera()
  loop=new GameLoop()
  stepper=new FixedStepper()
  ui: GameUI
  renderer: Renderer
  recorder=new RunRecorder()
  latestRecording: Recording|null=null
  previousRecording: Recording|null=null
  ghost: GhostReplay|null=null
  mode:GameMode='BUILD'
  generation=1
  currentGenomes:Genome[]|undefined
  completedGeneration:number|null=null
  extinct=false
  previousAverages:Genome|null=null
  resultAverages:Genome|null=null
  paused=false
  speed=1
  debug=false
  showGhost=true
  selectedRunner:number|null=null
  runFrames=0
  runSeconds=0
  runCost=0
  get performanceReport(){return {fps:this.runSeconds?this.runFrames/this.runSeconds:0,frameMs:this.runFrames?this.runCost/this.runFrames:0,frames:this.runFrames}}
  private candidate:TrapDefinition|null=null
  private pointer:{x:number;y:number}|null=null
  private dragging:{id:string;startX:number;startY:number;offsetX:number;offsetY:number}|null=null
  private uiTime=0
  constructor(){
    this.ui=new GameUI(this)
    this.renderer=new Renderer(this.ui.el<HTMLCanvasElement>('world'))
    this.bindCanvas()
    this.syncTraps()
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.mode!=='BUILD'){this.paused=true;this.stepper.reset()}})
    this.loop.start(dt=>this.frame(dt))
  }
  syncTraps(){this.world.traps=this.editor.definitions.map(d=>createTrap(structuredClone(d)))}
  start(mode:'PREVIEW'|'RUN'){
    if(this.extinct)return
    if(this.latestRecording){this.previousRecording=this.latestRecording;this.ghost=new GhostReplay(this.latestRecording)}
    this.world=new World(level01,DEFAULT_SEED,this.currentGenomes);this.syncTraps()
    this.mode=mode;this.paused=false;this.camera.x=0;this.camera.fit(level01.width)
    this.runFrames=0;this.runSeconds=0;this.runCost=0
    this.selectedRunner=null;this.candidate=null
    this.recorder=new RunRecorder();this.recorder.capture(this.world);this.stepper.reset()
    this.ui.inspect();this.ui.update()
  }
  build(){
    this.mode='BUILD';this.paused=false;this.world=new World(level01,DEFAULT_SEED,this.currentGenomes);this.syncTraps();this.stepper.reset()
    this.ui.inspect();this.ui.update()
  }
  reset(){if(this.mode==='BUILD'){this.world=new World(level01,DEFAULT_SEED,this.currentGenomes);this.syncTraps();this.camera.x=0}else this.start(this.mode)}
  startOver(){
    this.generation=1;this.currentGenomes=undefined;this.completedGeneration=null;this.extinct=false
    this.previousAverages=null;this.resultAverages=null;this.latestRecording=null;this.previousRecording=null;this.ghost=null
    this.build();this.ui.el('results-content').innerHTML='<p>Run the swarm to see what happens.</p>'
  }
  completeRun(){
    this.completedGeneration=this.generation
    this.previousAverages=this.resultAverages
    this.resultAverages=this.world.survivorStats
    const children=breedSurvivors(this.world.runners,this.generation)
    if(children){
      this.currentGenomes=children
      this.generation++
    }else this.extinct=true
  }
  togglePause(){if(this.mode!=='BUILD'&&!this.world.complete){this.paused=!this.paused;this.stepper.reset();this.ui.update()}}
  selectTool(tool:TrapType|'select'){
    if(this.mode!=='BUILD')return
    this.editor.tool=tool;this.editor.selectedId=null;this.candidate=null;this.ui.inspect();this.ui.update()
  }
  deleteSelected(){
    if(this.mode!=='BUILD'||!this.editor.selectedId)return
    this.editor.removeSelected();this.syncTraps();this.ui.inspect();this.ui.toast('Device removed.')
  }
  point(event:PointerEvent){const r=this.renderer.canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/this.renderer.scale+this.camera.x,y:(event.clientY-r.top)/this.renderer.scale}}
  bindCanvas(){
    const canvas=this.renderer.canvas
    canvas.onpointermove=e=>{
      const p=this.point(e);this.pointer=p
      if(this.mode==='BUILD'&&!this.dragging&&this.editor.tool!=='select')this.candidate=this.editor.candidate(this.editor.tool,p.x,p.y)
    }
    canvas.onpointerleave=()=>{this.candidate=null;this.pointer=null}
    canvas.onpointerdown=e=>{
      canvas.focus({preventScroll:true})
      if(e.button!==0)return
      const p=this.point(e)
      if(this.debug&&this.mode!=='BUILD'){
        const r=this.world.runners.filter(r=>r.alive&&!r.finished).sort((a,b)=>Math.hypot(a.position.x-p.x,a.position.y-p.y)-Math.hypot(b.position.x-p.x,b.position.y-p.y))[0]
        if(r&&Math.hypot(r.position.x-p.x,r.position.y-p.y)<40)this.selectedRunner=r.id
      }
      if(this.mode!=='BUILD')return
      const hit=this.editor.hit(p.x,p.y)
      if(hit){
        this.editor.selectedId=hit.id;this.editor.tool='select';this.candidate=null
        this.dragging={id:hit.id,startX:p.x,startY:p.y,offsetX:p.x-hit.position.x,offsetY:p.y-hit.position.y}
        canvas.setPointerCapture(e.pointerId);this.ui.inspect();this.ui.update()
      }else if(this.editor.tool!=='select'){
        const d=this.editor.candidate(this.editor.tool,p.x,p.y)
        if(this.editor.place(d)){this.syncTraps();this.ui.inspect();this.ui.toast('Device placed. Run the swarm to see what changes.')}
        else this.ui.toast('Place in open space. Tracks need solid ground. Start and exit stay clear.')
      }else{this.editor.selectedId=null;this.ui.inspect()}
    }
    canvas.onpointerup=e=>{
      if(!this.dragging)return
      const p=this.point(e),drag=this.dragging
      if(Math.hypot(p.x-drag.startX,p.y-drag.startY)>8){
        if(!this.editor.move(drag.id,p.x-drag.offsetX,p.y-drag.offsetY))this.ui.toast('That position is blocked. Device kept in place.')
        this.syncTraps();this.ui.inspect()
      }
      this.dragging=null
      if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)
    }
    canvas.onpointercancel=()=>{this.dragging=null}
    canvas.oncontextmenu=e=>{
      e.preventDefault();if(this.mode!=='BUILD')return
      const p=this.point(e as PointerEvent),hit=this.editor.hit(p.x,p.y)
      if(hit){this.editor.selectedId=hit.id;this.deleteSelected()}
    }
    window.addEventListener('keydown',e=>{
      if((e.target as HTMLElement).matches('input,select,textarea'))return
      if([' ','Delete','Backspace'].includes(e.key))e.preventDefault()
      if(e.repeat)return
      if(e.key===' ')this.togglePause()
      if(e.key==='Escape')this.selectTool('select')
      if(e.key==='Delete'||e.key==='Backspace')this.deleteSelected()
      if(e.key==='1')this.selectTool('spike')
      if(e.key==='2')this.selectTool('hammer')
      if(e.key==='3')this.selectTool('track')
      if(e.key==='4')this.selectTool('platform')
    })
  }
  frame(dt:number){
    const frameStart=performance.now(), measure=this.mode!=='BUILD'&&!this.paused&&!this.world.complete
    if(this.mode!=='BUILD'&&!this.paused&&!this.world.complete){
      this.stepper.advance(dt,this.speed,()=>{
        if(this.world.complete)return
        this.world.step();this.recorder.capture(this.world)
        if(this.world.complete){this.latestRecording=this.recorder.finish(this.world);this.completeRun();this.ui.results()}
      })
    }
    let candidate=this.candidate
    if(this.dragging&&this.pointer){
      const d=this.editor.selected!
      candidate=this.editor.candidate(d.type,this.pointer.x-this.dragging.offsetX,this.pointer.y-this.dragging.offsetY)
    }
    this.renderer.draw(this.world,this.camera,{build:this.mode==='BUILD',debug:this.debug,selected:this.editor.selectedId,ghost:this.showGhost&&this.mode!=='BUILD'?this.ghost:null,candidate,valid:candidate?this.editor.valid(candidate,this.dragging?.id):false,selectedRunner:this.selectedRunner})
    this.uiTime+=dt
    if(this.uiTime>.1){this.ui.update();this.uiTime=0}
    if(measure){this.runFrames++;this.runSeconds+=dt;this.runCost+=performance.now()-frameStart}
  }
}
