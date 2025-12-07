export interface Entity {
    id: string;
    type: "player" | "laser" | "enemy" | "particle";
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

    update: (canvas: HTMLCanvasElement, entities: Entity[], input?: InputState) => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
}

export type InputState = {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    shoot: boolean;
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
    hp: number = 1;
    isDead: boolean = false;

    constructor(x: number, y: number) {
        this.id = Math.random().toString(36).slice(2);
        this.x = x;
        this.y = y;
    }

    update(canvas: HTMLCanvasElement) {
        this.y += this.vy;
        // Kill if off screen
        if (this.y < -50) this.isDead = true;
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
    isDead: boolean = false;

    // Weapon cooldown
    cooldown: number = 0;
    maxCooldown: number = 8; // ~8 frames between shots

    constructor(x: number, y: number) {
        this.id = "player";
        this.x = x;
        this.y = y;
    }

    update(canvas: HTMLCanvasElement, entities: Entity[], input?: InputState) {
        // Movement
        const speed = 7;
        const friction = 0.9;

        if (input) {
            if (input.left) this.vx -= speed * 0.2;
            if (input.right) this.vx += speed * 0.2;
            if (input.up) this.vy -= speed * 0.2;
            if (input.down) this.vy += speed * 0.2;

            // Shooting
            if (input.shoot && this.cooldown <= 0) {
                this.shoot(entities);
                this.cooldown = this.maxCooldown;
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
    }

    shoot(entities: Entity[]) {
        // Spawn laser
        const laser1 = new Laser(this.x - 10, this.y);
        const laser2 = new Laser(this.x + 10, this.y);
        entities.push(laser1, laser2);
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
    }

    update(canvas: HTMLCanvasElement) {
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

