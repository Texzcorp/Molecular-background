class Particle {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.baseX = x;
        this.baseY = y;
        this.density = Math.random() * 30 + 1;
    }

    draw(ctx) {
        ctx.fillStyle = '#1e3d59';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update(mouse) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxDistance = 100;
        const force = (maxDistance - distance) / maxDistance;
        const directionX = forceDirectionX * force * this.density;
        const directionY = forceDirectionY * force * this.density;

        if (distance < maxDistance) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            if (this.x !== this.baseX) {
                const dx = this.x - this.baseX;
                this.x -= dx/20;
            }
            if (this.y !== this.baseY) {
                const dy = this.y - this.baseY;
                this.y -= dy/20;
            }
        }

        if (this.x < 0 || this.x > this.canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.speedY *= -1;

        this.x += this.speedX;
        this.y += this.speedY;
    }
}

class VaporPoint {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 600 + 400;  
        this.speedX = Math.random() * 0.2 - 0.1; 
        this.speedY = Math.random() * 0.2 - 0.1;
        this.intensity = Math.random() * 0.25 + 0.1; 
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < -this.size || this.x > this.canvas.width + this.size ||
            this.y < -this.size || this.y > this.canvas.height + this.size) {
            this.reset();
        }
    }

    draw(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, `rgba(0, 8, 32, ${this.intensity})`);     // Bleu presque noir
        gradient.addColorStop(0.4, `rgba(0, 6, 24, ${this.intensity * 0.5})`); // Transition quasi noire
        gradient.addColorStop(1, 'rgba(9, 9, 14, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class MolecularAnimation {
    constructor() {
        this.container = document.getElementById('container');
        this.molecularCanvas = document.getElementById('molecularCanvas');
        this.backgroundCanvas = document.getElementById('backgroundCanvas');
        this.centerCanvas = document.getElementById('centerCanvas');
        
        this.ctx = this.molecularCanvas.getContext('2d');
        this.bgCtx = this.backgroundCanvas.getContext('2d');
        this.centerCtx = this.centerCanvas.getContext('2d');
        
        this.particles = [];
        this.vaporPoints = [];
        this.mouse = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            targetX: window.innerWidth / 2,
            targetY: window.innerHeight / 2
        };
        this.focusRadius = Math.min(window.innerWidth, window.innerHeight) * 0.4;
        this.animationFrame = null;

        this.init();
    }

    setupCanvas() {
        const canvases = [
            this.molecularCanvas, this.backgroundCanvas,
            this.centerCanvas
        ];
        canvases.forEach(canvas => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        
        this.focusRadius = Math.min(window.innerWidth, window.innerHeight) * 0.4;
        // Reset mouse position on resize
        this.mouse.x = this.mouse.targetX = window.innerWidth / 2;
        this.mouse.y = this.mouse.targetY = window.innerHeight / 2;
    }

    createParticles() {
        const numberOfParticles = (this.molecularCanvas.width * this.molecularCanvas.height) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            const x = Math.random() * this.molecularCanvas.width;
            const y = Math.random() * this.molecularCanvas.height;
            this.particles.push(new Particle(x, y, this.molecularCanvas));
        }
    }

    createVaporPoints() {
        const numberOfPoints = 8; 
        for (let i = 0; i < numberOfPoints; i++) {
            this.vaporPoints.push(new VaporPoint(this.backgroundCanvas));
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.particles = [];
            this.vaporPoints = [];
            this.createParticles();
            this.createVaporPoints();
        });

        this.container.addEventListener('mousemove', (event) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.targetX = event.clientX - rect.left;
            this.mouse.targetY = event.clientY - rect.top;
        });

        this.container.addEventListener('mouseleave', () => {
            this.mouse.targetX = window.innerWidth / 2;
            this.mouse.targetY = window.innerHeight / 2;
        });
    }

    updateMousePosition() {
        const easing = 0.15; // Augmentation de la vitesse de suivi
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * easing;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * easing;
    }

    createFocusMask() {
        // Masque pour la zone nette au centre
        const centerGradient = this.centerCtx.createRadialGradient(
            this.mouse.x, this.mouse.y, 0,
            this.mouse.x, this.mouse.y, this.focusRadius
        );
        
        centerGradient.addColorStop(0, 'white');
        centerGradient.addColorStop(0.5, 'white');
        centerGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
        centerGradient.addColorStop(1, 'transparent');

        this.centerCtx.clearRect(0, 0, this.centerCanvas.width, this.centerCanvas.height);
        
        // Copier le contenu du canvas flou
        this.centerCtx.drawImage(this.molecularCanvas, 0, 0);
        
        // Appliquer le masque
        this.centerCtx.globalCompositeOperation = 'destination-in';
        this.centerCtx.fillStyle = centerGradient;
        this.centerCtx.fillRect(0, 0, this.centerCanvas.width, this.centerCanvas.height);
        this.centerCtx.globalCompositeOperation = 'source-over';
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(30, 61, 89, ${1 - distance/100})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    init() {
        this.setupCanvas();
        this.createParticles();
        this.createVaporPoints();
        this.setupEventListeners();
        this.animate();
    }

    animate() {
        // Clear canvases
        [this.ctx, this.bgCtx].forEach(ctx => {
            ctx.clearRect(0, 0, this.molecularCanvas.width, this.molecularCanvas.height);
        });
        
        this.bgCtx.fillStyle = '#09090e';
        this.bgCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);

        // Update mouse position
        this.updateMousePosition();

        // Draw vapor points on background canvas
        this.vaporPoints.forEach(point => {
            point.update();
            point.draw(this.bgCtx);
        });
        
        // Draw particles and connections on molecular canvas
        this.drawConnections();
        this.particles.forEach(particle => {
            particle.update(this.mouse);
            particle.draw(this.ctx);
        });

        // Update focus mask
        this.createFocusMask();

        this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    }
}

// Initialize the animation when the window loads
window.addEventListener('load', () => {
    new MolecularAnimation();
});
