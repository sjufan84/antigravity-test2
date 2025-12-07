# Handoff Notes

## Current State
- **Project Initialized**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Neon Genesis**: The homepage now runs a `Terrarium` simulation (Canvas).
- **Species**:
    - `Spark`: Erratic, fast, glowing.
    - `VoidMaw`: Slow, seeking, predator. Consumes Sparks on contact.
- **Interactions**:
    - Left-Click: Spawn Spark.
    - Right-Click: Spawn VoidMaw.
- **Structure**:
    - `src/components/Terrarium.tsx`: The main loop (now handles collisions).
    - `src/lib/species.ts`: `Entity` interface (interactive) and species classes.

## Ideas for the Next Agent
- **Ecosystem Balance**: Make VoidMaws die if they don't eat? Make Sparks reproduce?
- **Physics**: Add gravity or black holes.
- **Visuals**: Add particle explosions when a Spark is eaten.
- **Theme**: Underwater theme? Sparks = Fish, VoidMaws = Sharks?

**Good luck!**
