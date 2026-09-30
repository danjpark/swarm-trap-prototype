import type { Game } from '../game/Game.ts'
import { TRAP_NAMES } from '../game/Editor.ts'
import type { TrapType } from '../traps/Trap.ts'

const icons: Record<TrapType, string> = {
  spike: '<circle cx="24" cy="24" r="4"/><path d="M24 20V7m4 17h13M24 28v13M20 24H7"/><circle cx="24" cy="6" r="3"/><circle cx="42" cy="24" r="3"/><circle cx="24" cy="42" r="3"/><circle cx="6" cy="24" r="3"/>',
  hammer: '<circle cx="24" cy="24" r="4"/><path d="M24 20V7m4 17h13M24 28v13M20 24H7"/><circle cx="24" cy="6" r="5"/><circle cx="42" cy="24" r="5"/><circle cx="24" cy="42" r="5"/><circle cx="6" cy="24" r="5"/>',
  track: '<rect x="4" y="17" width="40" height="17" rx="8"/><path d="m16 21-5 4 5 4m12-8-5 4 5 4m10-8-5 4 5 4"/>',
  platform: '<path stroke-dasharray="3 4" d="M10 4v39M38 4v39"/><rect x="4" y="23" width="40" height="9" rx="3"/><path d="m19 14 5-5 5 5m-5-5v11"/>',
}
const descriptions = { spike: 'Piercing damage.', hammer: 'Blunt damage.', track: 'Send them the wrong way.', platform: 'Change their timing.' }

export class GameUI {
  game: Game

  constructor(game: Game) {
    this.game = game
    document.querySelector('#app')!.innerHTML = `
      <main>
        <canvas id="world" aria-label="Entire level, from start to exit. Select a device below, then click to place it. Drag a device to move it." tabindex="0"></canvas>
        <div class="controls-layout">
          <section class="build-panel" id="build-panel" aria-label="Build and run controls">
            <div class="mode-row">
              <button id="build" class="build-button" aria-pressed="true"><span class="mode-dot"></span><span id="build-label">Build mode</span></button>
              <p id="mode-description">Place a device, then run the swarm.</p>
              <div class="run-controls">
                <button id="pause" class="quiet-button" hidden>Pause</button>
                <button id="reset" class="quiet-button" hidden>Restart</button>
                <button id="preview" class="run-button">▶ Run swarm</button>
              </div>
            </div>
            <div class="toolbox" role="group" aria-label="Build tools">
              ${(['spike','hammer','track','platform'] as const).map((type, i) => `
                <button class="trap-card ${type}" data-tool="${type}" aria-pressed="false">
                  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${icons[type]}</svg>
                  <span><strong>${TRAP_NAMES[type]}</strong><small>${descriptions[type]}</small></span><kbd>${i+1}</kbd>
                </button>`).join('')}
            </div>
            <div class="edit-row">
              <div class="edit-actions">
                <button id="select" class="quiet-button" aria-pressed="true">↖ Select / move</button>
                <button id="delete-trap" class="quiet-button" disabled>Remove</button>
                <button id="clear" class="quiet-button" disabled>Clear all</button>
              </div>
              <label class="ghost-label"><input id="ghost" type="checkbox" checked> Show previous run <span class="ghost-dot"></span></label>
            </div>
            <p id="canvas-hint" class="hint" role="status">All 100 make it through the empty course. Place a device to change that.</p>
          </section>
          <aside class="results-panel" aria-label="Swarm results">
            <div class="live-counts"><div><span>On course</span><b id="alive">100</b></div><div><span>Stopped</span><b id="dead">0</b></div><div><span>Escaped</span><b id="escaped">0</b></div></div>
            <div class="last-result"><h2>Last experiment</h2><div id="results-content"><p>Run the swarm to see what happens.</p></div></div>
          </aside>
        </div>
      </main>
      <div class="toast" id="toast" role="status" hidden></div>`
    this.bind()
    this.update()
  }

  el<T extends HTMLElement = HTMLElement>(id: string) { return document.getElementById(id) as T }

  bind() {
    const g = this.game
    this.el('preview').onclick = () => g.start('PREVIEW')
    this.el('build').onclick = () => { if (g.mode !== 'BUILD') g.build() }
    this.el('pause').onclick = () => g.togglePause()
    this.el('reset').onclick = () => g.reset()
    this.el('results-content').addEventListener('click', e => {
      if ((e.target as HTMLElement).id === 'start-over') g.startOver()
    })
    this.el<HTMLInputElement>('ghost').onchange = e => { g.showGhost = (e.target as HTMLInputElement).checked }
    document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => {
      b.onclick = () => g.selectTool(b.dataset.tool as TrapType)
    })
    this.el('select').onclick = () => g.selectTool('select')
    this.el('delete-trap').onclick = () => g.deleteSelected()
    this.el('clear').onclick = () => {
      if (g.mode !== 'BUILD') return
      g.editor.definitions = []
      g.editor.selectedId = null
      g.syncTraps()
      this.update()
      this.toast('Course cleared.')
    }
  }

  inspect() { this.update() }

  toast(message: string) {
    const e = this.el('toast')
    e.textContent = message
    e.hidden = false
    window.setTimeout(() => { if (e.textContent === message) e.hidden = true }, 2400)
  }

  results() {
    const w = this.game.world, c = w.counts
    const percent = Math.round(c.dead / w.runners.length * 100)
    const avg=this.game.resultAverages, prev=this.game.previousAverages
    const delta=(now:number, before:number, decimals:number)=> {
      const diff=now-before
      return ` ${diff>=0?'▲':'▼'}${Math.abs(diff).toFixed(decimals)}`
    }
    const shell=(value:number)=>`${value>=0?'+':''}${value.toFixed(2)}`
    this.el('results-content').innerHTML = `
      <p class="result-score"><strong>${percent}%</strong> stopped</p>
      <p class="result-summary">Generation ${this.game.completedGeneration} · ${c.dead} stopped · ${c.escaped} survivors</p>
      ${avg ? `<details class="trait-details"><summary>Survivor traits</summary><p>Avg inherited HP ${avg.hp.toFixed(0)}${prev?delta(avg.hp,prev.hp,0):''} · Shell ${shell(avg.shell)}${prev?delta(avg.shell,prev.shell,2):''} (${avg.shell>0.05?'armored':avg.shell<-.05?'padded':'neutral'})</p></details>` : ''}
      ${this.game.extinct ? `<p>Extinct in generation ${this.game.completedGeneration}</p><button id="start-over" class="quiet-button">Start over</button>` : ''}`
    this.update()
  }

  update() {
    const g = this.game, c = g.world.counts, build = g.mode === 'BUILD'
    this.el('alive').textContent = String(c.alive)
    this.el('dead').textContent = String(c.dead)
    this.el('escaped').textContent = String(c.escaped)
    this.el('build-panel').classList.toggle('is-running', !build)
    this.el('build').setAttribute('aria-pressed', String(build))
    this.el('build-label').textContent = build ? 'Build mode' : '← Back to build'
    this.el('mode-description').textContent = g.extinct ? `Extinct in generation ${g.completedGeneration}. Start over to try again.` :
      build ? `Generation ${g.generation} ready. Place a device, then run the swarm.` :
      g.world.complete ? `Generation ${g.completedGeneration} complete. Generation ${g.generation} ready.` :
      g.paused ? `Generation ${g.generation} paused.` : `Generation ${g.generation} running — watch what changes.`
    this.el('pause').hidden = build || g.world.complete
    this.el('reset').hidden = build || g.world.complete
    this.el('pause').textContent = g.paused ? 'Resume' : 'Pause'
    this.el<HTMLButtonElement>('preview').disabled = g.extinct || (!build && !g.world.complete)
    this.el('preview').textContent = g.generation > 1 && !g.extinct && (build || g.world.complete) ? '▶ Run next generation' : '▶ Run swarm'
    document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => {
      b.disabled = !build
      b.setAttribute('aria-pressed', String(g.editor.tool === b.dataset.tool))
    })
    this.el<HTMLButtonElement>('select').disabled = !build
    this.el('select').setAttribute('aria-pressed', String(g.editor.tool === 'select'))
    this.el<HTMLButtonElement>('delete-trap').disabled = !build || !g.editor.selected
    this.el<HTMLButtonElement>('clear').disabled = !build || !g.editor.definitions.length
    const selected = g.editor.selected
    this.el('canvas-hint').textContent = !build ?
      (g.previousRecording && g.showGhost ? 'Previous run in lavender. This run in green.' : 'The whole course is in view. Space to pause.') :
      selected ? TRAP_NAMES[selected.type] + ' selected. Drag to move · Delete to remove.' :
      g.editor.tool !== 'select' ? TRAP_NAMES[g.editor.tool] + ' selected. Click the course to place · Esc to cancel.' :
      g.editor.definitions.length ? 'Click a device to select it. Drag to reposition.' :
      'All 100 make it through the empty course. Place a device to change that.'
  }
}
