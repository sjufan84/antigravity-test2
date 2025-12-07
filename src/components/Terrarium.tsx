"use client";

import { useEffect, useRef, useState } from "react";
import { Entity, Spark, VoidMaw, BlackHole, Pulsar } from "@/lib/species";

export default function Terrarium() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [stats, setStats] = useState({ fps: 0, count: 0 });

    // Refs for animation loop to avoid dependency staleness
    const entitiesRef = useRef<Entity[]>([]);
    const frameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    // Initialize
    useEffect(() => {
        // Initial Spawn
        const initialSparks = Array.from({ length: 20 }, () =>
            new Spark(window.innerWidth / 2, window.innerHeight / 2)
        );
        const initialMaws = Array.from({ length: 2 }, () =>
            new VoidMaw(Math.random() * window.innerWidth, Math.random() * window.innerHeight)
        );

        entitiesRef.current = [...initialSparks, ...initialMaws] as Entity[];
        setEntities(entitiesRef.current);

        const resize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener("resize", resize);
        resize();

        return () => window.removeEventListener("resize", resize);
    }, []);

    // Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const animate = (time: number) => {
            // FPS Calculation
            const delta = time - lastTimeRef.current;
            lastTimeRef.current = time;
            const fps = Math.round(1000 / delta);

            // Clear
            // Subtle trail effect
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update & Draw
            // We need to filter dead entities.
            // Since update() might mark entities as dead, we should filter next frame or right here.
            // Let's filter *after* update/draw to keep them for one frame of "death" if needed, 
            // but actually we want to remove them before the next logical step.
            // Simpler: Update all, then filter dead ones from the ref for the next frame.

            entitiesRef.current.forEach((entity) => {
                if (!entity.isDead) { // Only update living things
                    entity.update(canvas, entitiesRef.current);
                    entity.draw(ctx);
                }
            });

            // Cleanup dead entities
            entitiesRef.current = entitiesRef.current.filter(e => !e.isDead);

            // Update Stats (throttled)
            if (frameRef.current % 30 === 0) {
                setStats({ fps, count: entitiesRef.current.length });
            }

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const newMaw = new VoidMaw(e.clientX, e.clientY);
        entitiesRef.current.push(newMaw);
    };

    const handleClick = (e: React.MouseEvent) => {
        // Shift + Click = Black Hole
        if (e.shiftKey) {
            const newBlackHole = new BlackHole(e.clientX, e.clientY);
            entitiesRef.current.push(newBlackHole);
            return;
        }

        // Alt + Click = Pulsar
        if (e.altKey) {
            const newPulsar = new Pulsar(e.clientX, e.clientY);
            entitiesRef.current.push(newPulsar);
            return;
        }

        // Left click only = Spark
        if (e.button === 0) {
            const newSpark = new Spark(e.clientX, e.clientY);
            entitiesRef.current.push(newSpark);
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                className="block cursor-crosshair touch-none"
            />

            {/* HUD */}
            <div className="pointer-events-none absolute left-4 top-4 font-mono text-xs text-green-500/80">
                <div className="border border-green-500/30 bg-black/80 p-4 backdrop-blur">
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-green-400">
                        System Status
                    </h2>
                    <div className="space-y-1">
                        <p>SIMULATION: NEON GENESIS</p>
                        <p>FPS: {stats.fps}</p>
                        <p>ENTITIES: {stats.count}</p>
                        <p className="opacity-50 mt-2">L-Click: Spawn Spark</p>
                        <p className="opacity-50">R-Click: Spawn VoidMaw</p>
                        <p className="opacity-50">Shift+Click: Spawn Black Hole</p>
                        <p className="opacity-50">Alt+Click: Spawn Pulsar</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
