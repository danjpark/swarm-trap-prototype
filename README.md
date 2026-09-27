# Swarm / Trap

**[Play the web prototype](https://danjpark.github.io/swarm-trap-prototype/)**

A small experiment: design a platforming course, watch 100 autonomous creatures, and revise your traps by watching the results.

Prototype under construction. Vite + vanilla TypeScript + Canvas 2D. No runtime dependencies.

## Local development

```sh
npm ci
npm run dev
```

Production: `npm run build`, then `npm run preview`.

## Deployment

Pushes to `main` deploy `dist` through GitHub Actions to GitHub Pages. Vite's base is `/swarm-trap-prototype/`. Pages publishing source is GitHub Actions.

The prototype repository is intentionally public. Before a future Godot project becomes private, review Pages publishing explicitly: making a repository private does not necessarily make its published site private. That transition is outside this prototype.

