export interface Entity {
    id: string;
    type: "spark" | "voidmaw";
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    color: string;
    update: (canvas: HTMLCanvasElement, entities: Entity[]) => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
    isDead?: boolean;
}

export class Spark implements Entity {
    id: string;
    type: "spark" = "spark";
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    color: string;
    age: number;
    isDead: boolean = false;

    constructor(x: number, y: number) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        // Fast, erratic movement
        this.dx = (Math.random() - 0.5) * 8;
        this.dy = (Math.random() - 0.5) * 8;
        this.size = Math.random() * 3 + 1;
        // Neon colors: Cyan, Magenta, Lime
        const colors = ["#00f3ff", "#ff00ff", "#39ff14"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.age = 0;
    }

    update(canvas: HTMLCanvasElement, _entities: Entity[]) {
        this.x += this.dx;
        this.y += this.dy;

        // Bounce off walls
        if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.dy *= -1;

        // Jitter
        this.dx += (Math.random() - 0.5) * 0.5;
        this.dy += (Math.random() - 0.5) * 0.5;

        // Cap speed
        const maxSpeed = 10;
        this.dx = Math.max(Math.min(this.dx, maxSpeed), -maxSpeed);
        this.dy = Math.max(Math.min(this.dy, maxSpeed), -maxSpeed);

        this.age++;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0; // Reset
    }
}

export class VoidMaw implements Entity {
    id: string;
    type: "voidmaw" = "voidmaw";
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    color: string;
    isDead: boolean = false;

    constructor(x: number, y: number) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.size = 15;
        this.color = "#1a0b2e"; // Dark purple/black
    }

    update(canvas: HTMLCanvasElement, entities: Entity[]) {
        // Find nearest Spark
        let nearestDist = Infinity;
        let target: Entity | null = null;

        entities.forEach(e => {
            if (e.type === "spark" && !e.isDead) {
                const dist = Math.hypot(this.x - e.x, this.y - e.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = e;
                }
            }
        });

        if (target) {
            // Seek behavior
            const angle = Math.atan2((target as Entity).y - this.y, (target as Entity).x - this.x);
            const speed = 2.5; // Slower than sparks but persistent

            // Smooth turn
            this.dx = this.dx * 0.9 + Math.cos(angle) * speed * 0.1;
            this.dy = this.dy * 0.9 + Math.sin(angle) * speed * 0.1;

            // Move
            this.x += this.dx;
            this.y += this.dy;

            // Eat check
            if (nearestDist < this.size + (target as Entity).size) {
                (target as Entity).isDead = true;
                this.size += 0.5; // Grow
            }
        } else {
            // Wander if no food
            this.x += this.dx;
            this.y += this.dy;
            this.dx += (Math.random() - 0.5) * 0.2;
            this.dy += (Math.random() - 0.5) * 0.2;
        }

        // Screen wrap instead of bounce for Maws (they are ominous)
        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas.height + 50;
        if (this.y > canvas.height + 50) this.y = -50;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(10, 0, 20, 0.9)";
        ctx.fill();

        // Glowing rim
        ctx.strokeStyle = "#ff0055"; // Red/Pink rim
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff0055";
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.closePath();
    }
}
