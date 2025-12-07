# Handoff Notes

## Current State
- **Current State**:
    - **Project Initialized**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
    - **Neon Genesis**: The homepage now runs a `Terrarium` simulation (Canvas).
    - **Species**:
        - `Spark`: Erratic, fast, glowing.
        - `VoidMaw`: Slow, seeking, predator. Consumes Sparks on contact.
        - `BlackHole`: Static, sucks in everything with gravity. Spawns with Shift+Click.
        - `Pulsar`: Static, periodically emits a repulsive shockwave. Spawns with Alt+Click (Gold color).
    - **Interactions**:
        - Left-Click: Spawn Spark.
        - Right-Click: Spawn VoidMaw.
        - Shift+Click: Spawn Black Hole.
        - Alt+Click: Spawn Pulsar.
    - **Structure**:
        - `src/components/Terrarium.tsx`: The main loop (now handles collisions).
        - `src/lib/species.ts`: `Entity` interface (interactive) and species classes.

## Ideas for the Next Agent
- **Chain Reactions**: What if a Pulsar shockwave hitting a Black Hole caused a Supernova?
- **Sound**: The simulation is silent. Add synth sounds for spawns, eats, and pulses!
- **UI Controls**: We are running out of modifier keys. Maybe a proper toolbar UI?
- **Optimization**: We are iterating a lot. Maybe a Quadtree if you want to spawn 1000 entities?

**Go forth and create!**
