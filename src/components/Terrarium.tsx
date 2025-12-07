"use client";

import { useEffect, useRef, useState } from "react";
import { Entity, Player, Enemy, Laser, Particle, InputState } from "@/lib/species";

type GameState = "MENU" | "PLAYING" | "GAMEOVER";

export default function Terrarium() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [score, setScore] = useState(0);
    const [finalScore, setFinalScore] = useState(0);

    // Game State Refs (avoid stale closures)
    const entitiesRef = useRef<Entity[]>([]);
    const playerRef = useRef<Player | null>(null);
    const frameRef = useRef<number>(0);
    const scoreRef = useRef<number>(0);
    const inputRef = useRef<InputState>({
        up: false,
        down: false,
        left: false,
        right: false,
        shoot: false
    });

    // Touch/Mouse control fallback
    const mouseRef = useRef({ x: 0, y: 0, active: false });

    // --- INPUT HANDLING ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case "ArrowUp": case "KeyW": inputRef.current.up = true; break;
                case "ArrowDown": case "KeyS": inputRef.current.down = true; break;
                case "ArrowLeft": case "KeyA": inputRef.current.left = true; break;
                case "ArrowRight": case "KeyD": inputRef.current.right = true; break;
                case "Space": inputRef.current.shoot = true; break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case "ArrowUp": case "KeyW": inputRef.current.up = false; break;
                case "ArrowDown": case "KeyS": inputRef.current.down = false; break;
                case "ArrowLeft": case "KeyA": inputRef.current.left = false; break;
                case "ArrowRight": case "KeyD": inputRef.current.right = false; break;
                case "Space": inputRef.current.shoot = false; break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // --- GAME LOOP ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        let difficultyTimer = 0;

        const spawnEnemy = () => {
            const x = Math.random() * (canvas.width - 50) + 25;
            const diff = Math.floor(scoreRef.current / 500) + 1; // Difficulty ramps up
            entitiesRef.current.push(new Enemy(x, -50, diff));
        };

        const resetGame = () => {
            const player = new Player(canvas.width / 2, canvas.height - 100);
            playerRef.current = player;
            entitiesRef.current = [player];
            scoreRef.current = 0;
            inputRef.current = { up: false, down: false, left: false, right: false, shoot: false };
            setScore(0);
        };

        const animate = () => {
            if (gameState !== "PLAYING") {
                // Just draw a cool background or pause
                if (gameState === "MENU" || gameState === "GAMEOVER") {
                    // We can still animate particles or something if we want, but let's just hold basic state
                }
                // Continue loop for menu visuals if needed, but for now just single frame req
                if (gameState === "MENU") {
                    // Draw Menu
                    drawMenu(ctx, canvas);
                } else if (gameState === "GAMEOVER") {
                    drawGameOver(ctx, canvas);
                }
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            // --- UPDATE LOGIC ---

            // Spawn Enemies
            difficultyTimer++;
            if (difficultyTimer % 60 === 0) { // Every second-ish
                spawnEnemy();
            }

            // Sync mouse to input if active (simple follow)
            if (mouseRef.current.active && playerRef.current) {
                const player = playerRef.current;
                const dx = mouseRef.current.x - player.x;
                const dy = mouseRef.current.y - player.y;

                // Deadzone
                if (Math.abs(dx) > 5) inputRef.current.right = dx > 0;
                else { inputRef.current.right = false; inputRef.current.left = false; }
                if (Math.abs(dx) > 5) inputRef.current.left = dx < 0;

                if (Math.abs(dy) > 5) inputRef.current.down = dy > 0;
                else { inputRef.current.down = false; inputRef.current.up = false; }
                if (Math.abs(dy) > 5) inputRef.current.up = dy < 0;

                inputRef.current.shoot = true; // Auto shoot on mouse/touch
            }

            // Clear
            ctx.fillStyle = "rgba(0, 5, 20, 0.4)"; // Trails
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear screen

            // Check Collisions
            const lasers = entitiesRef.current.filter(e => e.type === "laser");
            const enemies = entitiesRef.current.filter(e => e.type === "enemy");
            const player = playerRef.current;

            // Lasers hit Enemies
            lasers.forEach(l => {
                enemies.forEach(e => {
                    if (!l.isDead && !e.isDead && checkRectCollision(l, e)) {
                        l.isDead = true;
                        e.hp--;
                        // Bat hit effect
                        spawnExplosion(l.x, l.y, "#fff", 5);

                        if (e.hp <= 0) {
                            e.isDead = true;
                            scoreRef.current += 100;
                            setScore(scoreRef.current);
                            spawnExplosion(e.x, e.y, "#ff0055", 20);
                        }
                    }
                });
            });

            // Player hit by Enemy
            if (player && !player.isDead) {
                enemies.forEach(e => {
                    if (!e.isDead && checkRectCollision(player, e)) {
                        e.isDead = true;
                        player.hp--;
                        spawnExplosion(player.x, player.y, "#ff0000", 30);
                        if (player.hp <= 0) {
                            player.isDead = true;
                            setFinalScore(scoreRef.current);
                            setGameState("GAMEOVER");
                        }
                    }
                });
            }

            // Update Entities
            entitiesRef.current.forEach(e => {
                if (!e.isDead) {
                    // Pass input only to player
                    if (e.type === "player") e.update(canvas, entitiesRef.current, inputRef.current);
                    else e.update(canvas, entitiesRef.current);

                    e.draw(ctx);
                }
            });

            // Cleanup
            entitiesRef.current = entitiesRef.current.filter(e => !e.isDead);

            frameRef.current = requestAnimationFrame(animate);
        };

        const drawMenu = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#00f3ff";
            ctx.font = "bold 60px Courier New";
            ctx.textAlign = "center";
            ctx.fillText("NEON ACE", canvas.width / 2, canvas.height / 2 - 50);

            ctx.font = "20px Courier New";
            ctx.fillStyle = "#fff";
            ctx.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillStyle = "#888";
            ctx.fillText("WASD/ARROWS to Move", canvas.width / 2, canvas.height / 2 + 60);
            ctx.fillText("SPACE to Shoot", canvas.width / 2, canvas.height / 2 + 90);
        };

        const drawGameOver = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
            // Red tint
            ctx.fillStyle = "rgba(50, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#ff0055";
            ctx.font = "bold 60px Courier New";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);

            ctx.fillStyle = "#fff";
            ctx.font = "30px Courier New";
            ctx.fillText(`SCORE: ${scoreRef.current}`, canvas.width / 2, canvas.height / 2 + 10);

            ctx.font = "20px Courier New";
            ctx.fillText("PRESS SPACE TO RESTART", canvas.width / 2, canvas.height / 2 + 60);
        };

        // Utility
        const checkRectCollision = (e1: Entity, e2: Entity) => {
            return (
                e1.x < e2.x + e2.width / 2 &&
                e1.x + e1.width / 2 > e2.x - e2.width / 2 && // Approximate width center
                e1.y < e2.y + e2.height / 2 &&
                e1.height + e1.y > e2.y - e2.height / 2
            );
        };

        const spawnExplosion = (x: number, y: number, color: string, count: number) => {
            for (let i = 0; i < count; i++) {
                entitiesRef.current.push(new Particle(x, y, color));
            }
        };

        // Start Loop
        frameRef.current = requestAnimationFrame(animate);

        // Listeners for Menu/Game Over
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                if (gameState === "MENU" || gameState === "GAMEOVER") {
                    resetGame();
                    setGameState("PLAYING");
                }
            }
        };
        window.addEventListener("keydown", handleGlobalKeys);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("keydown", handleGlobalKeys);
            cancelAnimationFrame(frameRef.current);
        };
    }, [gameState]);

    // Mouse/Touch Handlers
    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (gameState !== "PLAYING") return;
        mouseRef.current.active = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        mouseRef.current.x = clientX;
        mouseRef.current.y = clientY;
    };

    const handleTouchEnd = () => {
        mouseRef.current.active = false;
        inputRef.current.shoot = false;
        inputRef.current.up = false;
        inputRef.current.down = false;
        inputRef.current.left = false;
        inputRef.current.right = false;
    };

    return (
        <div
            className="fixed inset-0 overflow-hidden bg-black"
            onMouseMove={handleTouchMove}
            onTouchMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onTouchEnd={handleTouchEnd}
        >
            <canvas
                ref={canvasRef}
                className="block cursor-none"
            />

            {/* HUD */}
            {gameState === "PLAYING" && (
                <div className="pointer-events-none absolute left-4 top-4 font-mono text-xs text-cyan-500/80">
                    <div className="border border-cyan-500/30 bg-black/80 p-4 backdrop-blur">
                        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-cyan-400">
                            PILOT DATA
                        </h2>
                        <div className="space-y-1">
                            <p className="text-xl text-white">SCORE: {score}</p>
                            <div className="flex gap-1">
                                <p>HP:</p>
                                <div className="flex">
                                    {playerRef.current && Array.from({ length: Math.max(0, playerRef.current.hp) }).map((_, i) => (
                                        <div key={i} className="h-3 w-3 bg-red-500 mr-1"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

