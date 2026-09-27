import type { Game } from '../game/Game.ts'
import { TRAP_NAMES } from '../game/Editor.ts'
import type { TrapType } from '../traps/Trap.ts'
import { averageStats } from '../simulation/RunnerStats.ts'
const icon = (type: string) => {
  const paths: Record<string,string> = {
    fire:'<circle cx="24" cy="24" r="4"/><path d="M24 20V7m4 17h13M24 28v13M20 24H7"/><circle cx="24" cy="6" r="3"/><circle cx="42" cy="24" r="3"/><circle cx="24" cy="42" r="3"/><circle cx="6" cy="24" r="3"/>',
    track:'<rect x="4" y="17" width="40" height="17" rx="8"/><path d="m16 21-5 4 5 4m12-8-5 4 5 4m10-8-5 4 5 4"/>',
    platform:'<path stroke-dasharray="3 4" d="M10 4v39M38 4v39"/><rect x="4" y="23" width="40" height="9" rx="3"/><path d="m19 14 5-5 5 5m-5-5v11"/>',
  }
  return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">'+(paths[type]??'')+'</svg>'
}
export class GameUI {
  game: Game
  private lastInspector = ''
  constructor(game: Game) {
    this.game=game
    document.querySelector('#app')!.innerHTML = `
      <header class="site-header"><a class="brand" href="./" aria-label="Swarm Trap home"><span class="brand-mark"><i></i><i></i><i></i></span>SWARM<span class="slash">/</span>TRAP</a><div class="header-right"><span class="version">A PLAYABLE EXPERIMENT <b>v0.1</b></span><button class="text-button" id="help">How to play <span>↗</span></button><button class="debug-button" id="debug" aria-pressed="false" title="Toggle simulation diagnostics">⌘ <span>Debug</span></button></div></header>
      <main>
        <section class="intro"><div><div class="eyebrow"><span class="status-dot"></span> THE SWARM LAB</div><h1>Build a little chaos.</h1><p>100 tiny runners. One way out. You make the obstacles.</p></div><div class="level-label"><span class="level-number">01</span><div><strong>The first crossing</strong><span>ONE LEVEL. ENDLESS WHAT-IFS.</span></div></div></section>
        <div class="workspace">
          <section class="stage-column" aria-label="Level and simulation">
            <div class="world-toolbar"><div class="mode-indicator"><span class="status-dot"></span><b id="mode-label">BUILD MODE</b></div><div class="population"><span><i class="dot alive"></i>Alive <b id="alive">100</b></span><span><i class="dot dead"></i>Dead <b id="dead">0</b></span><span><i class="dot escaped"></i>Escaped <b id="escaped">0</b></span></div><span class="clock" id="clock">00:00.0</span></div>
            <div class="canvas-wrap"><canvas id="world" aria-label="Level 1. Select a trap, then click to place. Drag placed traps to move. Pan with A and D." tabindex="0"></canvas><div class="scene-caption"><span>LEVEL 01</span><span id="scene-caption">MAKE THEIR SHORTCUT A LONG SHOT.</span></div><div class="canvas-bottom"><span id="canvas-hint">Choose a trap to start experimenting</span><label class="follow"><input type="checkbox" id="follow" checked> Follow swarm</label></div><div id="debug-panel" class="debug-panel" hidden></div><div id="run-banner" class="run-banner" hidden></div></div>
            <div class="map-strip"><span>COURSE</span><canvas id="minimap" aria-label="Course overview. Click to pan." tabindex="0"></canvas><span>3,072 px</span></div>
            <label class="camera-control"><span>Pan course</span><input id="camera" type="range" min="0" max="2000" value="0" aria-label="Camera position"><span><kbd>A</kbd> <kbd>D</kbd> / ← →</span></label>
            <div class="simulation-controls"><div class="transport"><button id="build" class="button build-button" aria-pressed="true">↖ <span>Build</span></button><button id="pause" class="button icon-button" aria-label="Pause simulation" title="Pause / Resume (Space)" disabled>Ⅱ</button><button id="reset" class="button icon-button" aria-label="Reset simulation" title="Restart same setup">↺</button><span class="divider"></span><label class="speed-label" for="speed">SPEED</label><select id="speed" aria-label="Simulation speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></div><div class="run-actions"><button id="preview" class="button preview-button">▷ <span>Preview Future</span></button><button id="commit" class="button primary">▶ <span>Commit Run</span></button></div></div>
            <div class="timeline-bar"><label class="ghost-label"><input id="ghost" type="checkbox" checked><span class="switch"></span><span>Show Previous Run</span><span class="ghost-key"></span></label><span id="ghost-note">Your first run starts the timeline.</span></div>
          </section>
          <aside class="sidebar">
            <section class="palette"><div class="section-heading"><h2>The toolbox</h2><span>3 DEVICES</span></div><p class="section-description">Pick a device. Place it on the course.</p>
              <button class="trap-card fire" data-tool="fire" aria-pressed="false"><span class="trap-icon">${icon('fire')}</span><span class="trap-copy"><strong>Fire Wheel</strong><small>A bad time, all around.</small><em>ROTATING HAZARD</em></span><kbd>1</kbd></button>
              <button class="trap-card track" data-tool="track" aria-pressed="false"><span class="trap-icon">${icon('track')}</span><span class="trap-copy"><strong>Reverse Track</strong><small>One step forward. Two back.</small><em>REVERSE CONVEYOR</em></span><kbd>2</kbd></button>
              <button class="trap-card platform" data-tool="platform" aria-pressed="false"><span class="trap-icon">${icon('platform')}</span><span class="trap-copy"><strong>Vertical Platform</strong><small>Timing is everything.</small><em>MOVING TERRAIN</em></span><kbd>3</kbd></button>
              <div class="edit-actions"><button id="select" class="text-button" aria-pressed="true">↖ Select / move</button><button id="clear" class="text-button">Clear all</button></div>
            </section>
            <section class="inspector"><div class="section-heading"><h2 id="inspector-heading">Field notes</h2><span id="trap-count">0 PLACED</span></div><div id="inspector-content"></div></section>
            <section class="results" id="results"><div class="section-heading"><h2>Last experiment</h2><span class="result-dot"></span></div><div id="results-content"><div class="empty-result">—<span>The future is unwritten.</span></div><p>Preview your course to see who makes it.<br>Then give them a reason not to.</p></div></section>
          </aside>
        </div>
        <footer><span><span class="footer-dot"></span> SMALL CHANGES. DIFFERENT FUTURES.</span><span>100 runners · Seed <b>240519</b> · Built to be observed</span></footer>
      </main>
      <div class="toast" id="toast" role="status" hidden></div>
      <dialog id="welcome"><div class="dialog-eyebrow">WELCOME TO THE EXPERIMENT</div><div class="welcome-creatures"><i></i><i></i><i></i></div><h2>Stop the swarm.</h2><p>100 runners will try to reach the exit.<br>Let’s make that a little more interesting.</p><ol><li><b>01</b> Place traps.</li><li><b>02</b> Preview the future.</li><li><b>03</b> Change your course.</li><li><b>04</b> Stop as many runners as possible.</li></ol><button id="start" class="button primary">Start Building <span>→</span></button><span class="dialog-note">A / D to explore · Space to pause · 1 / 2 / 3 for traps</span></dialog>
    `
    this.bind()
    this.inspect()
    ;(document.querySelector('#welcome') as HTMLDialogElement).showModal()
  }
  el<T extends HTMLElement=HTMLElement>(id: string) { return document.getElementById(id) as T }
  bind() {
    const g=this.game
    this.el('start').onclick=()=>{(this.el('welcome') as HTMLDialogElement).close();this.el('world').focus()}
    this.el('help').onclick=()=>{if(g.mode!=='BUILD')g.paused=true;(this.el('welcome') as HTMLDialogElement).showModal()}
    this.el('preview').onclick=()=>g.start('PREVIEW')
    this.el('commit').onclick=()=>g.start('RUN')
    this.el('build').onclick=()=>g.build()
    this.el('pause').onclick=()=>g.togglePause()
    this.el('reset').onclick=()=>g.reset()
    this.el<HTMLSelectElement>('speed').onchange=e=>{g.speed=Number((e.target as HTMLSelectElement).value)}
    this.el<HTMLInputElement>('follow').onchange=e=>{g.camera.follow=(e.target as HTMLInputElement).checked}
    this.el<HTMLInputElement>('ghost').onchange=e=>{g.showGhost=(e.target as HTMLInputElement).checked}
    this.el('debug').onclick=()=>{g.debug=!g.debug;this.el('debug').setAttribute('aria-pressed',String(g.debug))}
    document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>g.selectTool(b.dataset.tool as TrapType))
    this.el('select').onclick=()=>g.selectTool('select')
    this.el('clear').onclick=()=>{if(g.mode==='BUILD'){g.editor.definitions=[];g.editor.selectedId=null;g.syncTraps();this.inspect();this.toast('Course cleared. A clean slate.');}}
    this.el<HTMLInputElement>('camera').oninput=e=>{g.camera.x=Number((e.target as HTMLInputElement).value);g.camera.follow=false;this.el<HTMLInputElement>('follow').checked=false}
  }
  inspect(force=false) {
    const g=this.game, d=g.editor.selected
    const signature=JSON.stringify(d??null)+g.mode
    if(signature===this.lastInspector&&!force)return
    this.lastInspector=signature
    this.el('inspector-heading').textContent=d?TRAP_NAMES[d.type]:'Field notes'
    const fields = d?.type==='fire' ? [['radius','Radius',32,128,8,'px'],['rotationSpeed','Rotation',0.5,3,0.25,'rad/s'],['armCount','Arms',2,6,1,'']] :
      d?.type==='track' ? [['strength','Reverse force',80,240,5,'px/s']] :
      d ? [['minY','Top position',32,416,32,'px'],['maxY','Bottom position',96,512,32,'px'],['speed','Travel speed',32,160,8,'px/s']] : []
    this.el('inspector-content').innerHTML=d?`<p class="inspector-location">GRID ${d.position.x} / ${d.position.y} <span>· drag to move</span></p>${fields.map(([key,label,min,max,step,unit])=>`<label class="config-row"><span>${label}</span><span><input data-config="${key}" type="number" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${d[key as keyof typeof d]}" ${g.mode!=='BUILD'?'disabled':''}> <small>${unit}</small></span></label>`).join('')}<button id="delete-trap" class="delete-button" ${g.mode!=='BUILD'?'disabled':''}>Remove device <kbd>Del</kbd></button>`:
      '<p class="field-note">Try the course without traps first.<br>Watch where the swarm struggles.<br>Then make that spot interesting.</p><div class="grid-note"><span>⊞</span> 32 px grid · Drag to reposition</div>'
    document.querySelectorAll<HTMLInputElement>('[data-config]').forEach(input=>{input.oninput=()=>{
      if(!d||g.mode!=='BUILD')return
      const next=structuredClone(d), value=Number(input.value)
      if(!Number.isFinite(value)||value<Number(input.min)||value>Number(input.max))return
      Object.assign(next,{[input.dataset.config!]:value})
      if(next.type==='platform')next.position.y=next.maxY!
      if(!g.editor.valid(next,d.id)){this.toast('That configuration intersects terrain or another device.');return}
      Object.assign(d,next);g.syncTraps()
    }; input.onblur=()=>this.inspect(true)})
    const del=this.el('delete-trap');if(del)del.onclick=()=>g.deleteSelected()
  }
  toast(message: string) { const e=this.el('toast');e.textContent=message;e.hidden=false;window.setTimeout(()=>{if(e.textContent===message)e.hidden=true},2600) }
  results() {
    const g=this.game,w=g.world,c=w.counts,s=w.survivorStats,rate=Math.round(c.dead/w.runners.length*100)
    const previous=g.previousRecording
    const delta=previous?rate-previous.stopped:null
    const timeout=w.runners.filter(r=>r.deathCause==='timeout').length
    this.el('results-content').innerHTML=`<div class="result-heading">${g.mode==='RUN'?'COMMITTED RUN':'PREVIEW COMPLETE'}<span>${w.time.toFixed(1)}s</span></div><div class="result-score">${rate}<span>% stopped</span></div><div class="result-meter"><i style="width:${rate}%"></i></div><div class="result-counts"><span>Stopped <b>${c.dead}</b></span><span>Escaped <b>${c.escaped}</b></span></div>${delta!==null?`<p class="result-delta">${delta>0?'+':''}${delta} stopped vs. previous run</p>`:''}<div class="survivors"><span>SURVIVOR AVERAGES</span><div><label>Speed<b>${s?s.speed.toFixed(3):'—'}</b></label><label>Reaction<b>${s?s.reaction.toFixed(3):'—'}</b></label><label>Agility<b>${s?s.agility.toFixed(3):'—'}</b></label></div></div>${timeout?`<p class="timeout-note">${timeout} contained at the 60s limit.</p>`:''}<button class="button result-build" id="revise">↖ Back to building</button>`
    this.el('revise').onclick=()=>g.build()
    this.el('run-banner').hidden=false
    this.el('run-banner').innerHTML=`<span>${g.mode==='RUN'?'RUN COMPLETE':'FUTURE OBSERVED'}</span><strong>${rate}% stopped.</strong><small>${c.escaped} found a way through. ${c.escaped?'Change their future.':'A very effective course.'}</small>`
  }
  update() {
    const g=this.game,w=g.world,c=w.counts,build=g.mode==='BUILD'
    this.el('alive').textContent=String(c.alive);this.el('dead').textContent=String(c.dead);this.el('escaped').textContent=String(c.escaped)
    this.el('clock').textContent='00:'+w.time.toFixed(1).padStart(4,'0')
    this.el('mode-label').textContent=build?'BUILD MODE':w.complete?'RUN COMPLETE':g.paused?'PAUSED':g.mode==='RUN'?'COMMITTED RUN':'PREVIEW FUTURE'
    this.el('build').setAttribute('aria-pressed',String(build))
    this.el<HTMLButtonElement>('pause').disabled=build||w.complete
    this.el('pause').textContent=g.paused?'▷':'Ⅱ'
    this.el('pause').setAttribute('aria-label',g.paused?'Resume simulation':'Pause simulation')
    this.el('trap-count').textContent=g.editor.definitions.length+' PLACED'
    this.el('canvas-hint').textContent=build?(g.editor.tool==='select'?'Click a device to select · Drag to reposition':TRAP_NAMES[g.editor.tool]+' selected · Click to place · Esc to deselect'):w.complete?'Experiment complete · Return to Build to revise':'Watching 100 possible futures · Space to pause'
    this.el('scene-caption').textContent=build?'MAKE THEIR SHORTCUT A LONG SHOT.':g.showGhost&&g.previousRecording?'PAST IN LAVENDER. PRESENT IN GREEN.':'EVERY RUNNER HAS A DIFFERENT WAY THROUGH.'
    this.el('ghost-note').textContent=g.previousRecording?'Previous timeline · '+g.previousRecording.stopped+' stopped':g.latestRecording?'Timeline recorded. Edit and run again.':'Your first run starts the timeline.'
    const camera=this.el<HTMLInputElement>('camera')
    camera.max=String(Math.max(0,w.level.width-g.camera.width));camera.value=String(g.camera.x)
    this.el<HTMLInputElement>('follow').checked=g.camera.follow
    document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>{b.disabled=!build;b.setAttribute('aria-pressed',String(g.editor.tool===b.dataset.tool))})
    this.el<HTMLButtonElement>('select').disabled=!build
    this.el('select').setAttribute('aria-pressed',String(g.editor.tool==='select'))
    this.el<HTMLButtonElement>('clear').disabled=!build||!g.editor.definitions.length
    this.el('debug-panel').hidden=!g.debug
    if(g.debug){
      const avg=averageStats(w.runners.map(r=>r.stats))!,r=g.selectedRunner!==null?w.runners[g.selectedRunner]:null
      this.el('debug-panel').textContent=`FPS ${g.loop.fps.toFixed(0)} · UPDATE + DRAW ${g.loop.frameMs.toFixed(2)} ms\nRUN MEAN ${g.performanceReport.fps.toFixed(0)} FPS / ${g.performanceReport.frameMs.toFixed(2)} ms / ${g.performanceReport.frames} FRAMES\nTICK ${w.tick} · SEED ${w.seed} · RUNNERS ${w.runners.length}\nMEAN S ${avg.speed.toFixed(3)} / R ${avg.reaction.toFixed(3)} / A ${avg.agility.toFixed(3)}\n${r?`RUNNER #${r.id} · ${r.state}\nS ${r.stats.speed.toFixed(3)} / R ${r.stats.reaction.toFixed(3)} / A ${r.stats.agility.toFixed(3)}`:'Click a runner to inspect traits.'}`
    }
  }
}

