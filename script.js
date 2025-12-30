// --- Configuration ---
const CONFIG = {
    starCount: 200, // Background stars
    heartFreq: 50, // Mouse move throttle (ms)
    colors: ['#ff00ff', '#00ffff', '#ffffff', '#bc13fe'],
    SKIP_INTRO: false // ¡CAMBIA ESTO A false CUANDO TERMINES DE EDITAR PARA QUE FUNCIONE EL JUEGO!
};

// --- Heart Cursor Effect ---
let lastHeartTime = 0;

document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastHeartTime > CONFIG.heartFreq) {
        createHeart(e.clientX, e.clientY);
        lastHeartTime = now;
    }
});

// Touch support for mobile
document.addEventListener('touchmove', (e) => {
    const now = Date.now();
    if (now - lastHeartTime > CONFIG.heartFreq) {
        const touch = e.touches[0];
        createHeart(touch.clientX, touch.clientY);
        lastHeartTime = now;
    }
}, { passive: true }); // passive true to allow scrolling if needed, but we prevent default elsewhere if full game


function createHeart(x, y) {
    const heart = document.createElement('div');
    heart.classList.add('heart-cursor');
    heart.innerHTML = '❤️';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    // Randomize slight rotation and size
    const randomSize = Math.random() * 0.5 + 0.8; // 0.8 to 1.3
    const randomRot = Math.random() * 40 - 20; // -20 to 20 deg
    heart.style.transform = `translate(-50%, -50%) scale(${randomSize}) rotate(${randomRot}deg)`;

    document.body.appendChild(heart);

    // Cleanup after animation
    setTimeout(() => {
        heart.remove();
    }, 1000);
}

// --- Galaxy Background (Canvas) ---
const canvas = document.getElementById('galaxy-canvas');
// Safe check for canvas in case script runs early (though we use DOMContentLoaded now)
let ctx;
if (canvas) {
    ctx = canvas.getContext('2d');
}
let width, height;

function resizeCanvas() {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Star {
    constructor() {
        this.reset();
        // Randomize pulse phase
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.05 + Math.random() * 0.05;
        // Random Color (Pastel/Neon vibe)
        this.hue = Math.random() * 360;
        this.color = `hsl(${this.hue}, 100%, 80%)`;
        this.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * width; // Depth
        this.size = 1 + Math.random() * 3; // Slightly larger for star shape visibility
        this.opacity = Math.random();
    }

    update() {
        // Pseudo 3D movement effect
        this.z -= 0.5; // Move towards screen
        if (this.z <= 0) this.reset();

        // Pulsing effect (Sine wave)
        this.pulsePhase += this.pulseSpeed;
        // Opacity oscillates between 0.3 and 1
        this.opacity = 0.4 + (Math.sin(this.pulsePhase) * 0.5 + 0.5) * 0.6;
    }

    draw() {
        if (!ctx) return;
        const x3d = (this.x - width / 2) * (width / this.z) + width / 2;
        const y3d = (this.y - height / 2) * (width / this.z) + height / 2;
        // Size also pulses slightly
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.3;
        const size3d = (this.size * width / this.z) * pulseScale;

        if (x3d < 0 || x3d > width || y3d < 0 || y3d > height) return;

        ctx.save();
        ctx.translate(x3d, y3d);
        // Optional: Rotate the star slowly
        ctx.rotate(this.pulsePhase * 0.1);

        ctx.beginPath();
        // Draw 5-pointed Star
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size3d,
                Math.sin((18 + i * 72) * Math.PI / 180) * size3d);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (size3d * 0.5),
                Math.sin((54 + i * 72) * Math.PI / 180) * (size3d * 0.5));
        }
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = size3d * 2; // Glow
        ctx.shadowColor = this.shadowColor;
        ctx.fill();

        ctx.restore();
    }
}

// Initialize stars only if canvas exists
const stars = [];
if (canvas) {
    for (let i = 0; i < CONFIG.starCount; i++) {
        stars.push(new Star());
    }
}

function animateGalaxy() {
    if (!ctx) return;
    // Clearing nicely
    ctx.clearRect(0, 0, width, height);

    // Composite operation to make colors blend nicely (optional, 'lighter' creates nice neon blends)
    ctx.globalCompositeOperation = 'lighter';

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    ctx.globalCompositeOperation = 'source-over'; // Reset

    requestAnimationFrame(animateGalaxy);
}

if (canvas) animateGalaxy();

// --- Phase 1: Constellation Logic ---
const constellationArea = document.getElementById('constellation-area');
const starPoints = [
    { x: 50, y: 30 }, // Top Center (Dip)
    { x: 35, y: 15 }, // Top Left Hump
    { x: 15, y: 30 }, // Left Side
    { x: 50, y: 80 }, // Bottom Tip
    { x: 85, y: 30 }, // Right Side
    { x: 65, y: 15 }  // Top Right Hump
];

// Re-ordering points to make a drawable path: Connect 0->1->2->3->4->5->0
const drawSequence = [0, 1, 2, 3, 4, 5, 0];
let currentStep = 0;
let createdStars = [];

function initConstellation() {
    console.log("Initializing Constellation...");
    const area = document.getElementById('constellation-area'); // Re-select to be safe
    if (!area) {
        console.error("Constellation area not found!");
        return;
    }

    // Clear previous if any
    area.innerHTML = '';
    createdStars = [];
    currentStep = 0;

    // Create Stars at calculated positions
    starPoints.forEach((pt, index) => {
        const star = document.createElement('div');
        star.classList.add('constellation-star');
        star.dataset.index = index;

        // Position relative to container
        star.style.left = `${pt.x}%`;
        star.style.top = `${pt.y}%`;

        // Click Event
        star.addEventListener('click', onStarClick);

        area.appendChild(star);
        createdStars.push(star);
    });
}

function onStarClick(e) {
    const clickedStar = e.target;
    // Highlight next target Logic
    const targetIndex = drawSequence[currentStep];
    const targetStar = createdStars[targetIndex];

    // Check if clicked user is close enough or is the target
    if (clickedStar === targetStar || currentStep === 0) {

        clickedStar.classList.add('connected');

        if (currentStep > 0) {
            // Draw line from Previous to Current
            const prevIndex = drawSequence[currentStep - 1];
            const prevStar = createdStars[prevIndex];
            drawLine(prevStar, clickedStar);
        }

        currentStep++;

        // Check Completion
        if (currentStep >= drawSequence.length) {
            setTimeout(triggerBigBang, 500);
        }
    }
}

function drawLine(star1, star2) {
    const area = document.getElementById('constellation-area');
    const x1 = star1.offsetLeft + star1.offsetWidth / 2;
    const y1 = star1.offsetTop + star1.offsetHeight / 2;
    const x2 = star2.offsetLeft + star2.offsetWidth / 2;
    const y2 = star2.offsetTop + star2.offsetHeight / 2;

    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    const line = document.createElement('div');
    line.classList.add('star-line');
    line.style.width = `0px`; // Animate from 0
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `rotate(${angle}deg)`;

    area.appendChild(line);

    // Trigger animation frame next
    requestAnimationFrame(() => {
        line.style.width = `${length}px`;
    });
}

// --- Phase 2: Big Bang & Transition ---
function triggerBigBang() {
    const intro = document.getElementById('intro-container');
    const orbit = document.getElementById('orbit-container');

    intro.style.transition = "opacity 0.5s, transform 0.5s";
    intro.style.transform = "scale(2)";
    intro.style.opacity = "0";

    setTimeout(() => {
        intro.classList.remove('active');
        intro.classList.add('hidden');

        orbit.classList.remove('hidden');
        requestAnimationFrame(() => {
            orbit.classList.add('active');
            initOrbitSystem(); // Start phase 2
        });
    }, 500);
}

// --- Phase 3: Orbit System ---
function initOrbitSystem() {
    console.log("Orbit System Initialized");
    const orbitSystem = document.querySelector('.orbit-system');
    if (!orbitSystem) return;

    orbitSystem.innerHTML = ''; // Clear existing

    // Example orbits
    const memories = [
        { text: "🎵", title: "Nuestra Cancióoon", desc: "La primera vez que bailamos..." },
        { text: "✈️", title: "El Viaje", desc: "Perdidos en aquella ciudad..." },
        { text: "📸", title: "Primera Foto", desc: "Salíamos tan nerviosos jaja..." },
        { text: "💌", title: "Promesa", desc: "Juntos hasta las estrellas." }
    ];

    memories.forEach((mem, i) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '50%';
        wrapper.style.left = '50%';
        wrapper.style.width = '0px';
        wrapper.style.height = '0px';
        wrapper.style.animation = `spinOrbit ${10 + i * 2}s linear infinite`;

        const radius = 150;
        const planet = document.createElement('div');
        planet.classList.add('orbital-item');
        planet.innerText = mem.text;
        planet.style.transform = `translateX(${radius}px)`;

        planet.addEventListener('mouseenter', () => {
            wrapper.style.animationPlayState = 'paused';
            showMemory(mem);
        });
        planet.addEventListener('mouseleave', () => {
            wrapper.style.animationPlayState = 'running';
        });

        wrapper.appendChild(planet);
        orbitSystem.appendChild(wrapper);
    });

    if (!document.getElementById('dynamic-styles')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'dynamic-styles';
        styleSheet.innerText = `
            @keyframes spinOrbit {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

function showMemory(data) {
    const disp = document.querySelector('.message-display');
    const title = document.getElementById('memory-title');
    const text = document.getElementById('memory-text');

    title.innerText = data.title;
    text.innerText = data.desc;

    disp.classList.remove('hidden');
}

const closeBtn = document.getElementById('close-memory');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.querySelector('.message-display').classList.add('hidden');
    });
}


// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Starting...");

    if (CONFIG.SKIP_INTRO) {
        const intro = document.getElementById('intro-container');
        if (intro) {
            intro.classList.add('hidden');
            intro.classList.remove('active');
        }

        const orbit = document.getElementById('orbit-container');
        if (orbit) {
            orbit.classList.remove('hidden');
            orbit.classList.add('active');
            initOrbitSystem();
        }
    } else {
        initConstellation();
    }
});
