"use client";

import { useEffect, useRef, useState } from "react";
import { Entity, Player, Enemy, SeekerEnemy, Laser, Particle, InputState, SHIP_PRESETS, PlayerConfig, SplitterEnemy, MiniEnemy } from "@/lib/species";

type GameState = "MENU" | "SELECT_SHIP" | "PLAYING" | "GAMEOVER";

export default function Terrarium() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [score, setScore] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [hp, setHp] = useState(3);
    const [maxHp, setMaxHp] = useState(3);

    // Game State Refs (avoid stale closures)
    const entitiesRef = useRef<Entity[]>([]);
    const playerRef = useRef<Player | null>(null);
    const selectedShipRef = useRef<PlayerConfig>(SHIP_PRESETS.ACE); // Default
    const frameRef = useRef<number>(0);
    const scoreRef = useRef<number>(0);
    const inputRef = useRef<InputState>({
        up: false,
        down: false,
        left: false,
        right: false,
        shoot: false,
        supercharge: false
    });
    // DOM Ref for smoother UI updates
    const chargeBarRef = useRef<HTMLDivElement>(null);

    const resetGame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const config = selectedShipRef.current;
        const player = new Player(canvas.width / 2, canvas.height - 100, config);
        playerRef.current = player;
        entitiesRef.current = [player];

        // Reset State
        scoreRef.current = 0;
        setScore(0);
        setHp(config.maxHp);
        setMaxHp(config.maxHp);

        setMaxHp(config.maxHp);

        // Reset Charge
        player.charge = 0;

        inputRef.current = { up: false, down: false, left: false, right: false, shoot: false, supercharge: false };
    };

    // Touch/Mouse control fallback
    const mouseRef = useRef({ x: 0, y: 0, active: false });

    // --- GAME LOOP & LOGIC ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // If playing, keep player on screen
            if (playerRef.current) {
                playerRef.current.y = Math.min(playerRef.current.y, canvas.height - 50);
            }
        };
        window.addEventListener("resize", resize);
        resize();

        // Input Handlers
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case "ArrowUp": case "KeyW": inputRef.current.up = true; break;
                case "ArrowDown": case "KeyS": inputRef.current.down = true; break;
                case "ArrowLeft": case "KeyA": inputRef.current.left = true; break;
                case "ArrowRight": case "KeyD": inputRef.current.right = true; break;
                case "Space": inputRef.current.shoot = true; break;
                case "ShiftLeft": case "ShiftRight": case "KeyE": inputRef.current.supercharge = true; break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case "ArrowUp": case "KeyW": inputRef.current.up = false; break;
                case "ArrowDown": case "KeyS": inputRef.current.down = false; break;
                case "ArrowLeft": case "KeyA": inputRef.current.left = false; break;
                case "ArrowRight": case "KeyD": inputRef.current.right = false; break;
                case "Space": inputRef.current.shoot = false; break;
                case "ShiftLeft": case "ShiftRight": case "KeyE": inputRef.current.supercharge = false; break;
            }
        };

        // Screen Drawing Functions
        const drawMenu = () => {
            // Background
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid effect
            ctx.strokeStyle = "#111";
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
            for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

            // Title
            ctx.fillStyle = "#fff";
            ctx.font = "bold 80px Courier New";
            ctx.textAlign = "center";
            ctx.shadowColor = "#0ff";
            ctx.shadowBlur = 20;
            ctx.fillText("NEON ACE", canvas.width / 2, canvas.height / 2 - 50);
            ctx.shadowBlur = 0;

            ctx.font = "20px Courier New";
            ctx.fillStyle = "#ccc";
            ctx.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2 + 50);

            ctx.font = "14px Courier New";
            ctx.fillStyle = "#666";
            ctx.fillText("v1.0.0 // SYSTEM READY", canvas.width / 2, canvas.height - 50);
        };

        const drawShipSelection = () => {
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 40px Courier New";
            ctx.textAlign = "center";
            ctx.fillText("SELECT YOUR SHIP", canvas.width / 2, 100);

            const presets = Object.values(SHIP_PRESETS);
            const cardWidth = 220;
            const cardHeight = 350;
            const gap = 40;
            const startX = (canvas.width - (presets.length * (cardWidth + gap) - gap)) / 2;
            const startY = canvas.height / 2 - 175;

            // Define Rows manually for perfect centering
            const row1 = presets.slice(0, 3);
            const row2 = presets.slice(3, 5);
            const rows = [row1, row2];

            let globalIndex = 0;

            rows.forEach((rowItems, rowIndex) => {
                const rowWidth = rowItems.length * cardWidth + (rowItems.length - 1) * gap;
                const startX = (canvas.width - rowWidth) / 2;
                const y = startY + rowIndex * (cardHeight + 20);

                rowItems.forEach((preset, colIndex) => {
                    const x = startX + colIndex * (cardWidth + gap);
                    // Use correct global index for display/logic
                    const index = globalIndex++;

                    // Selection Highlight
                    if (selectedShipRef.current.name === preset.name) {
                        ctx.shadowBlur = 30;
                        ctx.shadowColor = preset.color;
                    } else {
                        ctx.shadowBlur = 0;
                    }

                    // Card Background
                    ctx.fillStyle = "#1a1a1a";
                    ctx.strokeStyle = preset.color;
                    ctx.lineWidth = 2;
                    ctx.fillRect(x, y, cardWidth, cardHeight);
                    ctx.strokeRect(x, y, cardWidth, cardHeight);
                    ctx.shadowBlur = 0;

                    // Ship Preview Helper (Simple triangle)
                    ctx.save();
                    ctx.translate(x + cardWidth / 2, y + 80);
                    ctx.fillStyle = preset.color;
                    // Draw based on type (simple approximation)
                    ctx.beginPath();
                    if (preset.name === "PHANTOM") {
                        ctx.moveTo(0, -20); ctx.lineTo(10, 5); ctx.lineTo(0, 15); ctx.lineTo(-10, 5);
                    } else if (preset.name === "INFERNO") {
                        ctx.moveTo(0, -20); ctx.lineTo(15, 0); ctx.lineTo(0, 10); ctx.lineTo(-15, 0);
                    } else {
                        ctx.moveTo(0, -20); ctx.lineTo(15, 10); ctx.lineTo(-15, 10);
                    }
                    ctx.fill();
                    ctx.restore();

                    // Name
                    ctx.fillStyle = preset.color;
                    ctx.font = "bold 24px Courier New";
                    ctx.fillText(preset.name, x + cardWidth / 2, y + 150);

                    // Stats
                    ctx.textAlign = "left";
                    ctx.font = "14px Courier New";
                    ctx.fillStyle = "#ccc";
                    const statX = x + 30;

                    // Helper to draw bars
                    const drawBar = (label: string, val: number, max: number, py: number) => {
                        ctx.fillStyle = "#888";
                        ctx.fillText(label, statX, py);

                        ctx.fillStyle = "#333";
                        ctx.fillRect(statX + 60, py - 10, 100, 8);
                        ctx.fillStyle = preset.color;
                        ctx.fillRect(statX + 60, py - 10, Math.min(1, val / max) * 100, 8);
                    };

                    drawBar("SPD", preset.speed, 12, y + 190);
                    drawBar("HP", preset.maxHp, 6, y + 215);
                    drawBar("DMG", preset.bulletDamage * preset.bulletCount, 10, y + 240);

                    // Description
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#aaa";
                    ctx.font = "italic 12px Courier New";

                    // Simple word wrap
                    const words = preset.description.split(" ");
                    let line = "";
                    let ly = y + 280;
                    for (let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + " ";
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > cardWidth - 20 && n > 0) {
                            ctx.fillText(line, x + cardWidth / 2, ly);
                            line = words[n] + " ";
                            ly += 16;
                        }
                        else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, x + cardWidth / 2, ly);

                    // Key Hint
                    ctx.fillStyle = "#fff";
                    ctx.font = "bold 16px Courier New";
                    ctx.fillText(`PRESS [${index + 1}]`, x + cardWidth / 2, y + cardHeight - 20);

                });
            });
        };

        const drawGameOver = () => {
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
        const spawnExplosion = (x: number, y: number, color: string, count: number) => {
            for (let i = 0; i < count; i++) {
                entitiesRef.current.push(new Particle(x, y, color));
            }
        };

        // Listeners for Menu/Game Over
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if (gameState === "MENU") {
                if (e.code === "Space") {
                    setGameState("SELECT_SHIP");
                }
            } else if (gameState === "SELECT_SHIP") {
                // Support NumRow and Numpad
                if (e.key === "1" || e.code === "Digit1" || e.code === "Numpad1") {
                    selectedShipRef.current = SHIP_PRESETS.ACE;
                    resetGame();
                    setGameState("PLAYING");
                } else if (e.key === "2" || e.code === "Digit2" || e.code === "Numpad2") {
                    selectedShipRef.current = SHIP_PRESETS.VIPER;
                    resetGame();
                    setGameState("PLAYING");
                } else if (e.key === "3" || e.code === "Digit3" || e.code === "Numpad3") {
                    selectedShipRef.current = SHIP_PRESETS.TITAN;
                    resetGame();
                    setGameState("PLAYING");
                } else if (e.key === "4" || e.code === "Digit4" || e.code === "Numpad4") {
                    selectedShipRef.current = SHIP_PRESETS.PHANTOM;
                    resetGame();
                    setGameState("PLAYING");
                } else if (e.key === "5" || e.code === "Digit5" || e.code === "Numpad5") {
                    selectedShipRef.current = SHIP_PRESETS.INFERNO;
                    resetGame();
                    setGameState("PLAYING");
                }
            } else if (gameState === "GAMEOVER") {
                if (e.code === "Space") {
                    setGameState("MENU");
                }
            }
        };

        // Mouse interactions for Selection
        const handleMouseDown = (e: MouseEvent) => {
            if (gameState === "SELECT_SHIP") {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const presets = Object.values(SHIP_PRESETS);
                const cardWidth = 220;
                const cardHeight = 350;
                const gap = 40;
                const startY = canvas.height / 2 - 250;

                // Define Rows manually for perfect centering
                const row1 = presets.slice(0, 3);
                const row2 = presets.slice(3, 5);
                const rows = [row1, row2];

                let globalIndex = 0;

                rows.forEach((rowItems, rowIndex) => {
                    // Calculate startX for this specific row
                    const rowWidth = rowItems.length * cardWidth + (rowItems.length - 1) * gap;
                    const startX = (canvas.width - rowWidth) / 2;
                    const y = startY + rowIndex * (cardHeight + 20);

                    rowItems.forEach((preset, colIndex) => {
                        const x = startX + colIndex * (cardWidth + gap);
                        const index = globalIndex++;

                        if (
                            mouseX >= x &&
                            mouseX <= x + cardWidth &&
                            mouseY >= y &&
                            mouseY <= y + cardHeight
                        ) {
                            selectedShipRef.current = preset;
                            resetGame();
                            setGameState("PLAYING");
                        }
                    });
                });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("keydown", handleGlobalKeys);
        window.addEventListener("mousedown", handleMouseDown);

        // --- MAIN LOOP ---
        const loop = () => {
            // Clear
            if (gameState !== "GAMEOVER") {
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (gameState === "MENU") {
                drawMenu();
            }
            else if (gameState === "SELECT_SHIP") {
                drawShipSelection();
            }
            else if (gameState === "PLAYING") {
                // Update Charge Bar imperatively for 60fps smoothness
                if (chargeBarRef.current && playerRef.current) {
                    const pct = playerRef.current.charge || 0;
                    chargeBarRef.current.style.width = `${pct}%`;

                    // Optional: Visual flare handled by CSS shadow but we could toggle classes here if needed
                }

                // Spawn Enemeies
                if (Math.random() < 0.02) {
                    const difficulty = 1 + Math.floor(scoreRef.current / 500);
                    if (Math.random() > 0.9 && scoreRef.current > 400) {
                        // Spawn Splitter (Rare)
                        entitiesRef.current.push(new SplitterEnemy(Math.random() * canvas.width, -50, difficulty));
                    } else if (Math.random() > 0.8 && scoreRef.current > 200) {
                        entitiesRef.current.push(new SeekerEnemy(Math.random() * canvas.width, -50, difficulty));
                    } else {
                        entitiesRef.current.push(new Enemy(Math.random() * canvas.width, -50, difficulty));
                    }
                }

                // Update Entities
                entitiesRef.current.forEach((entity, index) => {
                    // Pass Input only to player
                    if (entity.type === "player") {
                        entity.update(canvas, entitiesRef.current, inputRef.current);
                    } else {
                        entity.update(canvas, entitiesRef.current);
                    }

                    // Draw
                    entity.draw(ctx);

                    // Collision Check (Simple)
                    if (entity.type === "player" && !entity.isDead) {
                        // Check collision with enemy or enemy laser
                        entitiesRef.current.forEach(other => {
                            if (other !== entity && !other.isDead && other.faction === "enemy") {
                                // Simple dist check
                                const dist = Math.hypot(entity.x - other.x, entity.y - other.y);
                                if (dist < (entity.width + other.width) / 2) {
                                    // Player Hit
                                    entity.hp--;
                                    setHp(entity.hp); // UPDATE STATE
                                    other.isDead = true; // Enemy crashes
                                    spawnExplosion(other.x, other.y, "#ffaa00", 10);
                                    if (entity.hp <= 0) {
                                        entity.isDead = true;
                                        spawnExplosion(entity.x, entity.y, "#00f3ff", 50);
                                        setFinalScore(scoreRef.current);
                                        setGameState("GAMEOVER");
                                    }
                                }
                            }
                        });
                    }
                    else if (entity.type === "laser" && !entity.isDead) {
                        entitiesRef.current.forEach(other => {
                            if (other !== entity && !other.isDead && other.faction !== entity.faction) {
                                const dist = Math.hypot(entity.x - other.x, entity.y - other.y);
                                if (dist < (other.width / 2 + 5)) {
                                    // Hit
                                    entity.isDead = true;
                                    spawnExplosion(entity.x, entity.y, entity.color, 3);
                                    other.hp -= (entity as Laser).damage;
                                    if (other.hp <= 0) {
                                        other.isDead = true;
                                        spawnExplosion(other.x, other.y, other.color, 15);

                                        // Handle Splitter Death
                                        if (other instanceof SplitterEnemy) {
                                            const s = other as SplitterEnemy;
                                            if (s.spawnOnDeath > 0) {
                                                for (let i = 0; i < s.spawnOnDeath; i++) {
                                                    entitiesRef.current.push(new MiniEnemy(other.x, other.y));
                                                }
                                            }
                                        }

                                        if (other.type === "enemy") {
                                            scoreRef.current += 100;
                                            setScore(scoreRef.current);

                                            // Charge on kill
                                            if (playerRef.current && !playerRef.current.isSupercharging) {
                                                playerRef.current.charge = Math.min(playerRef.current.maxCharge, playerRef.current.charge + 10);
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }

                });

                // Cleanup Dead
                entitiesRef.current = entitiesRef.current.filter(e => !e.isDead);
            }
            else if (gameState === "GAMEOVER") {
                drawGameOver();
            }

            frameRef.current = requestAnimationFrame(loop);
        };

        // Start
        frameRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("keydown", handleGlobalKeys);
            window.removeEventListener("mousedown", handleMouseDown);
            cancelAnimationFrame(frameRef.current);
        };
    }, [gameState]); // Restart loop when gameState changes? limit this.

    // Mouse/Touch Handlers (Keep simple mouse tracking for player if needed, or remove)
    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        // Optional: Implement mouse follow if desired
    };

    return (
        <div
            className="fixed inset-0 overflow-hidden bg-black"
            onMouseMove={handleTouchMove}
        // Additional handlers can be added here if not using window listeners
        >
            <canvas
                ref={canvasRef}
                className="block cursor-none fixed inset-0 z-0 w-full h-full"
            />

            {/* HUD */}
            {gameState === "PLAYING" && (
                <div className="pointer-events-none fixed z-[9999] left-0 top-0 w-full p-6 flex justify-between items-start font-mono text-xs uppercase tracking-wider text-cyan-400 border-2 border-transparent">

                    {/* LEFT: PILOT INFO */}
                    <div className="flex flex-col gap-2">
                        <div className="bg-black/80 backdrop-blur border border-cyan-500/30 p-4 min-w-[200px]">
                            <h2 className="text-cyan-600 mb-2">// PILOT: {selectedShipRef.current?.name}</h2>
                            <div className="flex items-end gap-2 text-white">
                                <span className="text-4xl font-bold leading-none">{score.toString().padStart(6, '0')}</span>
                                <span className="text-xs text-cyan-500 mb-1">PTS</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: SYSTEMS */}
                    <div className="flex flex-col gap-2 items-end">
                        <div className="bg-black/80 backdrop-blur border border-red-500/30 p-4 min-w-[200px]">
                            <div className="flex justify-between mb-2">
                                <h2 className="text-red-500">// SHIELD INTEGRITY</h2>
                                <span className="text-red-400">{Math.ceil((hp / maxHp) * 100)}%</span>
                            </div>

                            <div className="flex gap-1 justify-end">
                                {Array.from({ length: maxHp }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-4 w-8 border border-red-900 transition-all duration-300 ${i < hp ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-transparent opacity-20"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* SUPERCHARGE METER */}
                        <div className="bg-black/80 backdrop-blur border border-yellow-500/30 p-4 min-w-[200px] mt-2">
                            <h2 className="text-yellow-500 mb-2">// OVERDRIVE</h2>
                            <div className="w-full bg-gray-900 h-4 border border-yellow-900">
                                <div
                                    ref={chargeBarRef}
                                    className="h-full bg-yellow-400 transition-all duration-75 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                    style={{ width: "0%" }}
                                />
                            </div>
                            {(playerRef.current?.charge || 0) >= 100 && (
                                <div className="text-center text-yellow-300 text-xs mt-1 animate-pulse">READY [PRESS SHIFT]</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
