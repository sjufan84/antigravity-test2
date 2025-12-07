export interface Entity {
    id: string;
    type: "player" | "laser" | "enemy" | "particle" | "shockwave";
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
    color: string;
    isDead: boolean;
    faction: "player" | "enemy" | "neutral";
    hp: number;
    maxHp: number; // Added maxHp for health bars
    charge?: number; // 0-100
    maxCharge?: number; // 100


    update: (canvas: HTMLCanvasElement, entities: Entity[], input?: InputState) => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
}

export type PlayerConfig = {
    name: string;
    speed: number;
    color: string;
    maxHp: number;
    fireRate: number; // Lower is faster
    bulletSpeed: number;
    bulletDamage: number;
    bulletColor: string;
    bulletCount: 1 | 2 | 3;
    description: string;
};

export const SHIP_PRESETS: Record<string, PlayerConfig> = {
    ACE: {
        name: "ACE",
        speed: 7,
        color: "#00f3ff",
        maxHp: 3,
        fireRate: 8,
        bulletSpeed: 15,
        bulletDamage: 1,
        bulletColor: "#00ff00",
        bulletCount: 2,
        description: "Balanced. Reliable. The classic choice."
    },
    VIPER: {
        name: "VIPER",
        speed: 10,
        color: "#fae100", // Yellow
        maxHp: 2,
        fireRate: 4,
        bulletSpeed: 20,
        bulletDamage: 0.5,
        bulletColor: "#ffff00",
        bulletCount: 1,
        description: "Fast. Rapid fire. Fragile."
    },
    TITAN: {
        name: "TITAN",
        speed: 4,
        color: "#a200ff", // Purple
        maxHp: 5,
        fireRate: 15, // Slow fire
        bulletSpeed: 10,
        bulletDamage: 3,
        bulletColor: "#d400ff",
        bulletCount: 3, // Spread
        description: "Heavy armor. Spread shot. Slow."
    }
};

export type InputState = {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    shoot: boolean;
    supercharge: boolean;
};

// --- PARTICLES ---
export class Particle implements Entity {
    id: string;
    type: "particle" = "particle";
    faction: "neutral" = "neutral";
    x: number;
    y: number;
    width: number;
    height: number;
    vx: number;
    vy: number;
    color: string;

    hp: number = 1;
    maxHp: number = 1;
    isDead: boolean = false;
    life: number = 20;

    constructor(x: number, y: number, color: string, speed: number = 2) {
        this.id = Math.random().toString(36).slice(2);
        this.x = x;
        this.y = y;
        this.width = 2;
        this.height = 2;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.isDead = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.life / 20;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1.0;
    }
}

// --- SHOCKWAVE (Titan Omega Blast visual) ---
export class Shockwave implements Entity {
    id: string;
    type: "shockwave" = "shockwave";
    faction: "neutral" = "neutral";
    x: number;
    y: number;
    width: number = 0;
    height: number = 0;
    vx: number = 0;
    vy: number = 0;
    color: string;
    hp: number = 1;
    maxHp: number = 1;
    isDead: boolean = false;

    radius: number = 0;
    maxRadius: number = 800;
    life: number = 30;
    maxLife: number = 30;

    constructor(x: number, y: number, color: string = "#d400ff") {
        this.id = Math.random().toString(36).slice(2);
        this.x = x;
        this.y = y;
        this.color = color;
    }

    update() {
        this.radius += (this.maxRadius - this.radius) * 0.15; // Easing expansion
        this.life--;
        if (this.life <= 0) this.isDead = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8 * alpha;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow ring
        ctx.globalAlpha = alpha * 0.3;
        ctx.lineWidth = 20 * alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// --- LASER ---
export class Laser implements Entity {
    id: string;
    type: "laser" = "laser";
    faction: "player" = "player";
    x: number;
    y: number;
    width: number = 4;
    height: number = 20;
    vx: number = 0;
    vy: number = -15; // Moves up fast
    color: string = "#00ff00";
    damage: number = 1;
    hp: number = 1;
    maxHp: number = 1;
    isDead: boolean = false;

    constructor(x: number, y: number, color: string, speed: number, damage: number) {
        this.id = Math.random().toString(36).slice(2);
        this.x = x;
        this.y = y;
        this.color = color;
        this.vy = -speed;
        this.damage = damage;
    }

    update(canvas: HTMLCanvasElement) {
        this.x += this.vx;
        this.y += this.vy;
        // Kill if off screen (any direction)
        if (this.y < -50 || this.y > canvas.height + 50 ||
            this.x < -50 || this.x > canvas.width + 50) {
            this.isDead = true;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// --- PLAYER ---
export class Player implements Entity {
    id: string;
    type: "player" = "player";
    faction: "player" = "player";
    x: number;
    y: number;
    width: number = 40;
    height: number = 40;
    vx: number = 0;
    vy: number = 0;
    color: string = "#00f3ff";
    hp: number = 3;
    maxHp: number = 3;
    charge: number = 0;
    maxCharge: number = 100;
    isSupercharging: boolean = false;
    superchargeDuration: number = 0;
    isDead: boolean = false;

    // Config
    config: PlayerConfig;

    // Weapon cooldown
    cooldown: number = 0;

    constructor(x: number, y: number, config: PlayerConfig) {
        this.id = "player";
        this.x = x;
        this.y = y;
        this.config = config;

        // Apply Config
        this.color = config.color;
        this.hp = config.maxHp;
        this.maxHp = config.maxHp;
    }

    update(canvas: HTMLCanvasElement, entities: Entity[], input?: InputState) {
        // Movement
        const speed = this.config.speed;
        const friction = 0.9;

        if (input) {
            if (input.left) this.vx -= speed * 0.2;
            if (input.right) this.vx += speed * 0.2;
            if (input.up) this.vy -= speed * 0.2;
            if (input.down) this.vy += speed * 0.2;

            // Shooting
            if (input.shoot && this.cooldown <= 0) {
                this.shoot(entities);
                this.cooldown = this.config.fireRate;
            }

            if (input.supercharge) {
                this.triggerSupercharge(entities);
            }
        }

        this.cooldown--;
        this.vx *= friction;
        this.vy *= friction;

        this.x += this.vx;
        this.y += this.vy;

        // Bounds
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width) this.x = canvas.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height) this.y = canvas.height;

        // Supercharge Logic
        if (this.isSupercharging) {
            this.superchargeDuration--;
            // Visual drain - use correct max duration per ship
            const maxDuration = this.config.name === "ACE" ? 180 :
                this.config.name === "TITAN" ? 30 : 300;
            this.charge = (this.superchargeDuration / maxDuration) * 100;

            if (this.config.name === "VIPER") {
                // Phase Shift: Invincibility logic handled in collision check
                // Speed boost was applied below in movement? No, visual effect mainly.
            } else if (this.config.name === "ACE") {
                // Plasma Storm: Auto fire in all directions (optimized to prevent memory issues)
                if (this.superchargeDuration % 15 === 0) {
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const l = new Laser(this.x, this.y, "#ff00ff", 12, 1);
                        l.vx = Math.cos(angle) * 12;
                        l.vy = Math.sin(angle) * 12;
                        entities.push(l);
                    }
                }
            } else if (this.config.name === "TITAN") {
                // Omega: One time blast, handled in trigger.
            }

            if (this.superchargeDuration <= 0) {
                this.isSupercharging = false;
                this.charge = 0;
            }
        } else {
            // Passive charge? No, only on kill.
            if (this.charge > this.maxCharge) this.charge = this.maxCharge;
        }
    }

    triggerSupercharge(entities: Entity[]) {
        if (this.charge >= 100 && !this.isSupercharging) {
            this.isSupercharging = true;

            // Different durations per ship to balance gameplay
            if (this.config.name === "ACE") {
                this.superchargeDuration = 180; // 3 seconds - shorter to prevent entity buildup
            } else if (this.config.name === "VIPER") {
                this.superchargeDuration = 300; // 5 seconds for phase shift
            } else {
                this.superchargeDuration = 300; // Default 5 seconds
            }

            if (this.config.name === "TITAN") {
                // Omega Blast: Kill all enemies on screen with dramatic visual effect

                // Spawn shockwave from player
                entities.push(new Shockwave(this.x, this.y, "#d400ff"));

                // Kill all enemies and spawn explosions
                entities.forEach(e => {
                    if (e.type === "enemy") {
                        // Spawn explosion particles at enemy location
                        for (let i = 0; i < 15; i++) {
                            entities.push(new Particle(e.x, e.y, "#d400ff", 4));
                        }
                        for (let i = 0; i < 10; i++) {
                            entities.push(new Particle(e.x, e.y, "#ffffff", 3));
                        }
                        e.hp = 0;
                        e.isDead = true;
                    }
                });

                // Instant drain for Titan as it's a one-shot
                this.superchargeDuration = 30; // Visual flare duration
            }
        }
    }

    shoot(entities: Entity[]) {
        if (this.config.bulletCount === 1) {
            entities.push(new Laser(this.x, this.y, this.config.bulletColor, this.config.bulletSpeed, this.config.bulletDamage));
        } else if (this.config.bulletCount === 2) {
            entities.push(new Laser(this.x - 10, this.y, this.config.bulletColor, this.config.bulletSpeed, this.config.bulletDamage));
            entities.push(new Laser(this.x + 10, this.y, this.config.bulletColor, this.config.bulletSpeed, this.config.bulletDamage));
        } else if (this.config.bulletCount === 3) {
            const l = new Laser(this.x - 15, this.y + 5, this.config.bulletColor, this.config.bulletSpeed, this.config.bulletDamage);
            l.vx = -2;
            const c = new Laser(this.x, this.y, this.config.bulletColor, this.config.bulletSpeed, this.config.bulletDamage);
            const r = new Laser(this.x + 15, this.y + 5, this.config.bulletColor, this.config.bulletSpeed, this.config.bulletDamage);
            r.vx = 2;
            entities.push(l, c, r);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Simple Plane Shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -20); // Nose
        ctx.lineTo(15, 10); // Right Wing
        ctx.lineTo(0, 5);   // Body
        ctx.lineTo(-15, 10); // Left Wing
        ctx.closePath();

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Supercharge Visuals
        if (this.isSupercharging) {
            ctx.shadowBlur = 30 + Math.random() * 20;
            ctx.shadowColor = "#ffffff";
            if (this.config.name === "VIPER") {
                ctx.globalAlpha = 0.5 + Math.random() * 0.5; // Flicker
            }
        }

        ctx.fill();

        // Engine flame
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(0, 15 + Math.random() * 5);
        ctx.lineTo(5, 5);
        ctx.fillStyle = "#ff5500";
        ctx.fill();

        ctx.restore();
    }
}

// --- ENEMY ---
export class Enemy implements Entity {
    id: string;
    type: "enemy" = "enemy";
    faction: "enemy" = "enemy";
    x: number;
    y: number;
    width: number = 30;
    height: number = 30;
    vx: number = 0;
    vy: number = 0;
    color: string = "#ff0055";
    hp: number = 1;
    maxHp: number = 1;
    isDead: boolean = false;

    behavior: "diver" | "strafer" = "diver";
    time: number = 0;

    constructor(x: number, y: number, difficulty: number) {
        this.id = Math.random().toString(36).slice(2);
        this.x = x;
        this.y = y;
        this.behavior = Math.random() > 0.5 ? "diver" : "strafer";
        this.hp = Math.floor(Math.random() * difficulty) + 1;
        this.width = 30 + this.hp * 5; // Bigger = stronger
        this.maxHp = this.hp;
    }

    update(canvas: HTMLCanvasElement, entities: Entity[]) {
        this.time++;

        if (this.behavior === "diver") {
            this.vy = 4;
            this.vx = Math.sin(this.time * 0.05) * 2;
        } else {
            this.vy = 2;
            this.vx = Math.cos(this.time * 0.02) * 5;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Cleanup
        if (this.y > canvas.height + 50) this.isDead = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Enemy Shape (Triangle pointing down)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(15, -15);
        ctx.lineTo(-15, -15);
        ctx.closePath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}


export class SeekerEnemy extends Enemy {
    constructor(x: number, y: number, difficulty: number) {
        super(x, y, difficulty);
        this.color = "#ff8800"; // Orange
        this.hp = Math.floor(difficulty * 1.5) + 2; // Tougher
        this.width = 40;
    }

    update(canvas: HTMLCanvasElement, entities: Entity[]) {
        this.time++;

        // Find player
        const player = entities.find(e => e.type === "player");
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                this.vx += (dx / dist) * 0.2; // Acceleration
                this.vy += (dy / dist) * 0.2;
            }
        } else {
            this.vy += 0.1;
        }

        // Speed cap
        const maxSpeed = 3;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > maxSpeed) {
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Cleanup
        if (this.y > canvas.height + 50 || this.y < -100) this.isDead = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Diamond Shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(15, 0);
        ctx.lineTo(0, -20);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Eye
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

