export interface Entity {
    id: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    color: string;
    update: (canvas: HTMLCanvasElement) => void;
    draw: (ctx: CanvasRenderingContext2D) => void;
}

export class Spark implements Entity {
    id: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    color: string;
    age: number;

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

    update(canvas: HTMLCanvasElement) {
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
