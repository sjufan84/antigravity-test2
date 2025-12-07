"use client";

import { useEffect, useRef, useState } from "react";
import { Entity, Spark } from "@/lib/species";

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
        entitiesRef.current = initialSparks;
        setEntities(initialSparks);

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
            entitiesRef.current.forEach((entity) => {
                entity.update(canvas);
                entity.draw(ctx);
            });

            // Update Stats (throttled)
            if (frameRef.current % 30 === 0) {
                setStats({ fps, count: entitiesRef.current.length });
            }

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        const newSpark = new Spark(e.clientX, e.clientY);
        entitiesRef.current.push(newSpark);
        // Force re-render for UI count update if needed immediately, 
        // but the loop handles stats. 
        // We intentionally don't setEntities here to avoid re-triggering the effect loop 
        // (refs are used for the loop state).
    };

    return (
        <div className="fixed inset-0 overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                onClick={handleClick}
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
                        <p className="opacity-50 mt-2">Click to spawn Spark</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
