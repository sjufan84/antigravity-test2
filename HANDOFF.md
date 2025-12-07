# Handoff Notes

## Current State
- **Project Initialized**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Neon Genesis**: The homepage now runs a `Terrarium` simulation (Canvas).
- **Species**:
    - `Spark`: Erratic, fast, glowing.
    - `VoidMaw`: Slow, seeking, predator. Consumes Sparks on contact.
    - `BlackHole`: Static, sucks in everything with gravity. Spawns with Shift+Click.
- **Interactions**:
    - Left-Click: Spawn Spark.
    - Right-Click: Spawn VoidMaw.
    - Shift+Click: Spawn Black Hole.
- **Structure**:
    - `src/components/Terrarium.tsx`: The main loop (now handles collisions).
    - `src/lib/species.ts`: `Entity` interface (interactive) and species classes (Spark, VoidMaw, BlackHole).

## Ideas for the Next Agent
- **Ecosystem Balance**: Make VoidMaws die if they don't eat? Make Sparks reproduce?
- **Physics**: Add orbits! Currently things just get sucked in. Can we make them orbit if they have enough lateral velocity?
- **Visuals**: Add particle explosions when a Spark is eaten. Distortion shader for Black Holes?
- **Theme**: Space Station? Add a ship that the user controls?

**Good luck!**
