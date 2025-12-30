const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Particles
class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
        this.friction = 0.98;
        this.gravity = 0.03;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.008;
    }
}

// Rockets 
class Rocket {
    constructor(x, targetY, type = 'normal') {
        this.x = x;
        this.y = height;
        this.targetY = targetY;
        this.type = type;
        this.color = type === 'heart' ? '#ff0066' : `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.velocity = { x: 0, y: - (Math.random() * 2 + 5) };
        this.exploded = false;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.y += this.velocity.y;

        if (this.y <= this.targetY || this.velocity.y > -0.5) {
            this.exploded = true;
            if (this.type === 'heart') {
                createHeartExplosion(this.x, this.y, this.color);
            } else {
                createExplosion(this.x, this.y, this.color);
            }
        }
    }
}

let projectiles = [];
let particles = [];

function createExplosion(x, y, color) {
    const particleCount = 50;
    const angleIncrement = (Math.PI * 2) / particleCount;

    for (let i = 0; i < particleCount; i++) {
        const velocity = {
            x: Math.cos(angleIncrement * i) * (Math.random() * 2.5),
            y: Math.sin(angleIncrement * i) * (Math.random() * 2.5)
        };
        particles.push(new Particle(x, y, color, velocity));
    }
}

function createHeartExplosion(x, y, color) {
    const particleCount = 60; // More particles for better shape

    for (let i = 0; i < particleCount; i++) {
        const t = (Math.PI * 2 * i) / particleCount;

        const dx = 16 * Math.pow(Math.sin(t), 3);
        const dy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        const scale = 0.08;
        const velocity = {
            x: dx * scale,
            y: dy * scale
        };

        particles.push(new Particle(x, y, color, velocity));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(13, 13, 13, 0.2)';
    ctx.fillRect(0, 0, width, height);

    projectiles.forEach((rocket, index) => {
        rocket.update();
        rocket.draw();
        if (rocket.exploded) {
            projectiles.splice(index, 1);
        }
    });

    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Auto launch (Normal Fireworks Background)
setInterval(() => {
    const x = Math.random() * width;
    const targetY = height * 0.2 + Math.random() * (height * 0.4);
    projectiles.push(new Rocket(x, targetY, 'normal'));
}, 1200);

// Interaction - Launch HEARTS on Click/Touch
function launchManual(x, y) {
    projectiles.push(new Rocket(x, y, 'heart'));
}

// Background Clicks/Touches
window.addEventListener('click', (e) => {
    if (!e.target.closest('.card') && !e.target.closest('button') && !e.target.closest('.heart-border-particle')) {
        launchManual(e.clientX, e.clientY);
    }
});

window.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.card') && !e.target.closest('button') && !e.target.closest('.heart-border-particle')) {
        const t = e.touches[0];
        launchManual(t.clientX, t.clientY);
    }
}, { passive: false });

// Card Logic
const openBtn = document.getElementById('openCardBtn');
const closeBtn = document.getElementById('closeCardBtn');
const card = document.getElementById('messageCard');

if (openBtn) {
    openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.style.display = 'block';
        requestAnimationFrame(() => {
            card.classList.remove('hidden');
        });
        openBtn.style.display = 'none';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.add('hidden');
        setTimeout(() => {
            card.style.display = 'none';
            openBtn.style.display = 'block';
        }, 500);
    });
}

// Init
animate();

// --- HEART FRAME LOGIC ---
let frameContainer;

function createHeartFrame() {
    // Clean up
    if (frameContainer && frameContainer.parentNode) {
        frameContainer.parentNode.removeChild(frameContainer);
    }

    frameContainer = document.createElement('div');
    frameContainer.style.position = 'absolute';
    frameContainer.style.top = '50%';
    frameContainer.style.left = '50%';
    // EXACT CENTER of Screen
    frameContainer.style.transform = 'translate(-50%, -50%)';
    frameContainer.style.width = '0';
    frameContainer.style.height = '0';
    frameContainer.style.pointerEvents = 'none';
    frameContainer.style.zIndex = '5';
    document.body.appendChild(frameContainer);

    // Responsive Logic
    const isMobile = window.innerWidth < 700;

    // Scales: 11 for mobile, 18 for desktop
    const scale = isMobile ? 11 : 18;
    const particleCount = isMobile ? 22 : 30;

    console.log(`Creating Centered Frame: Mobile=${isMobile}, Scale=${scale}`);

    for (let i = 0; i < particleCount; i++) {
        const t = (Math.PI * 2 * i) / particleCount;

        // Math for heart shape centered at (0,0)
        const x = 16 * Math.pow(Math.sin(t), 3);

        // Correcting Y center. -6 brings the visual center to 0.
        // Formula: y_math - 6
        // CSS Y is inverted: -(y_math - 6) => -y_math + 6
        const y_math = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const y = -(y_math) - 5; // -5 to shift the whole shape UP visually to align with text center

        const el = document.createElement('div');
        el.classList.add('heart-border-particle');
        el.innerHTML = '❤️';

        const rot = (Math.random() * 20 - 10) + 'deg';

        el.style.left = `${x * scale}px`;
        el.style.top = `${y * scale}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${rot})`;

        // AUTO-EMIT LOGIC
        setInterval(() => {
            if (Math.random() > 0.85) {
                const rect = el.getBoundingClientRect();
                createHeartExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ff00cc');
            }
        }, 800 + Math.random() * 1000);

        // Manual Interaction
        const interact = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (clientX && clientY) createHeartExplosion(clientX, clientY, '#ff0066');
        };

        el.addEventListener('click', interact);
        el.addEventListener('touchstart', interact, { passive: false });

        frameContainer.appendChild(el);
    }
}

// Hook into resize
window.addEventListener('resize', () => {
    createHeartFrame();
    resize();
});

createHeartFrame();
