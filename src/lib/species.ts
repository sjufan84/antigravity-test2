export interface Entity {
    id: string;
    type: "spark" | "voidmaw" | "blackhole";
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

    update(canvas: HTMLCanvasElement, entities: Entity[]) {
        let gravityX = 0;
        let gravityY = 0;

        entities.forEach(e => {
            if (e.type === "blackhole") {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.hypot(dx, dy);

                // Event Horizon
                if (dist < e.size / 2 + this.size) {
                    this.isDead = true;
                }

                // Gravity Pull
                if (dist > 0 && dist < 300) {
                    const force = 500 / (dist * dist); // Stronger pull for small sparks
                    gravityX += (dx / dist) * force;
                    gravityY += (dy / dist) * force;
                }
            }
        });

        this.dx += gravityX;
        this.dy += gravityY;

        this.x += this.dx;
        this.y += this.dy;

        // Bounce off walls
        if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.dy *= -1;

        // Jitter
        this.dx += (Math.random() - 0.5) * 0.5;
        this.dy += (Math.random() - 0.5) * 0.5;

        // Cap speed
        const maxSpeed = 12; // Slightly faster max speed
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
        let gravityX = 0;
        let gravityY = 0;

        entities.forEach(e => {
            if (e.type === "spark" && !e.isDead) {
                const dist = Math.hypot(this.x - e.x, this.y - e.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = e;
                }
            }
            // Valid Black Hole Gravity Check
            if (e.type === "blackhole") {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.hypot(dx, dy);

                // Event Horizon
                if (dist < e.size / 2 + this.size) {
                    this.isDead = true;
                    // Optional: Make the black hole grow slightly?
                    // (e as BlackHole).size += 1; 
                }

                // Gravity Pull
                if (dist > 0 && dist < 400) {
                    const force = 1000 / (dist * dist);
                    gravityX += (dx / dist) * force;
                    gravityY += (dy / dist) * force;
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

            // Apply gravity
            this.dx += gravityX;
            this.dy += gravityY;

            // Move
            this.x += this.dx;
            this.y += this.dy;

            // Eat check
            if (nearestDist < this.size + (target as Entity).size) {
                (target as Entity).isDead = true;
                this.size += 0.5; // Grow
            }
        } else {
            // Apply gravity even when wandering
            this.dx += gravityX;
            this.dy += gravityY;

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

export class BlackHole implements Entity {
    id: string;
    type: "blackhole" = "blackhole";
    x: number;
    y: number;
    dx: number = 0;
    dy: number = 0;
    size: number;
    color: string = "#000000";
    isDead: boolean = false;
    pulsePhase: number = 0;

    constructor(x: number, y: number) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.size = 20;
    }

    update(_canvas: HTMLCanvasElement, _entities: Entity[]) {
        // Black Holes are static but pulse
        this.pulsePhase += 0.05;
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Accretion Disk
        const pulse = Math.sin(this.pulsePhase) * 5;

        // Outer Glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2 + pulse, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(this.x, this.y, this.size, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(0.5, "rgba(100, 0, 255, 0.2)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();

        // Event Horizon
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "#000000";
        ctx.fill();
        // White rim
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}
