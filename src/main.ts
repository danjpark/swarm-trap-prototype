import './style.css'
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `<h1>SWARM / TRAP</h1><p>Level 01 · Prototype v0.1</p><canvas width="1200" height="500"></canvas>`
const ctx = document.querySelector('canvas')!.getContext('2d')!
ctx.fillStyle = '#101d25'
ctx.fillRect(0, 0, 1200, 500)
ctx.fillStyle = '#b9d895'
for (const [x, y, w, h] of [[0, 400, 690, 100], [310, 328, 170, 72], [820, 400, 380, 100]]) ctx.fillRect(x, y, w, h)

