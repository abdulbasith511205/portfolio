document.addEventListener('DOMContentLoaded', () => {
    // OS Clock
    function updateTime() {
        const timeEl = document.getElementById('os-time');
        if (timeEl) {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            timeEl.textContent = `${hours}:${minutes} ${ampm}`;
        }
    }
    updateTime();
    setInterval(updateTime, 1000);

    // Magnetic Button Effect
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const position = btn.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseout', () => {
             // Let css transitions manage the snapping back
            btn.style.transform = `translate(0px, 0px)`;
        });
    });

    // 3D Tilt & Theme-based Parallax Effect
    const cards = document.querySelectorAll('.magnetic-card');
    const orbs = document.querySelectorAll('.orb');
    
    cards.forEach((card, index) => {
        card.setAttribute('data-index', index);
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;
            
            const deltaX = Math.max(-10, Math.min(10, (e.clientX - cardCenterX) * 0.02));
            const deltaY = Math.max(-10, Math.min(10, (e.clientY - cardCenterY) * 0.02));
            
            card.style.setProperty('--tilt-x', `${-deltaY}deg`);
            card.style.setProperty('--tilt-y', `${deltaX}deg`);
            card.style.setProperty('--scale', `1.02`);
            card.style.zIndex = '10';
            
            if (card.classList.contains('polaroid-frame')) {
                card.style.setProperty('--base-rotate', `0deg`);
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--tilt-x', `0deg`);
            card.style.setProperty('--tilt-y', `0deg`);
            card.style.setProperty('--scale', `1`);
            card.style.zIndex = '1';
            
            if (card.classList.contains('polaroid-frame')) {
                card.style.setProperty('--base-rotate', `3deg`);
            }
        });
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                applyParallax(window.scrollY);
                ticking = false;
            });
            ticking = true;
        }
    });

    function applyParallax(scrollPos) {
        const isModern = document.body.classList.contains('modern-theme');
        const grain = document.querySelector('.grain-overlay');
        
        // 1. Fix grid alignment: do NOT shift the layout cards vertically by different amounts.
        cards.forEach((card) => {
            // Only apply a subtle parallax to the isolated polaroid photo in the hero section
            if (card.classList.contains('polaroid-frame')) {
                const speed = isModern ? -0.06 : -0.03;
                let offset = scrollPos * speed;
                if (!isModern) offset = Math.floor(offset / 4) * 4; // Retro stepped movement
                card.style.setProperty('--py', `${offset}px`);
            } else {
                card.style.setProperty('--py', `0px`);
            }
        });

        if (isModern) {
            // Modern: Smooth layered floating background orbs
            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 0.15;
                orb.style.setProperty('--py', `${scrollPos * speed}px`);
            });
            if (grain) grain.style.backgroundPosition = '0px 0px';
        } else {
            // Retro: Parallax the 8-bit noise texture
            if (grain) {
                const step = Math.floor(scrollPos / 8) * 8;
                grain.style.backgroundPosition = `0px ${step}px`;
            }
            orbs.forEach(orb => orb.style.setProperty('--py', `0px`));
        }
    }
    
    // Initialize parallax on load
    applyParallax(window.scrollY);

    // Smooth scroll for anchor links in Navbar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('modern-theme');
            if (document.body.classList.contains('modern-theme')) {
                themeToggle.innerHTML = 'Retro OS 🕰️';
            } else {
                themeToggle.innerHTML = 'Next-Gen 🚀';
            }
            applyParallax(window.scrollY);
            updateVoidTheme(); // Update canvas colors on flip
        });
        // Initial state text is already set in HTML
    }

    // ==========================================
    // Interactive Void Background (Canvas)
    // ==========================================
    const canvas = document.getElementById('void-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = { x: null, y: null, radius: 150 };

        // Handle resize
        window.addEventListener('resize', resizeCanvas);
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        }

        // Track mouse (account for scroll so it matches the viewport)
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        // Reset mouse when leaving
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        class Particle {
            constructor(x, y, dx, dy, size) {
                this.x = x;
                this.y = y;
                this.dx = dx;
                this.dy = dy;
                this.size = size;
                this.baseX = x;
                this.baseY = y;
                this.density = (Math.random() * 30) + 1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
                
                // Mouse interaction / Repel void effect
                if (mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mouse.radius) {
                        // Repel
                        let forceDirectionX = dx / distance;
                        let forceDirectionY = dy / distance;
                        let force = (mouse.radius - distance) / mouse.radius;
                        let directionX = (forceDirectionX * force * this.density) * -1;
                        let directionY = (forceDirectionY * force * this.density) * -1;
                        
                        this.x += directionX;
                        this.y += directionY;
                    } else {
                        if (this.x !== this.baseX) { this.x -= (this.x - this.baseX) / 20; }
                        if (this.y !== this.baseY) { this.y -= (this.y - this.baseY) / 20; }
                        
                        this.baseX += this.dx;
                        this.baseY += this.dy;
                    }
                } else {
                     this.baseX += this.dx;
                     this.baseY += this.dy;
                     this.x = this.baseX;
                     this.y = this.baseY;
                }
                
                if (this.baseX > canvas.width) { this.baseX = 0; this.x = 0; }
                if (this.baseX < 0) { this.baseX = canvas.width; this.x = canvas.width; }
                if (this.baseY > canvas.height) { this.baseY = 0; this.y = 0; }
                if (this.baseY < 0) { this.baseY = canvas.height; this.y = canvas.height; }

                this.draw();
            }
        }

        const gridSize = 50;
        let activeBoxes = new Map(); // key: "x-y", value: opacity

        function initParticles() {
            // Modern Particles
            particles = [];
            let numberOfParticles = (canvas.width * canvas.height) / 10000;
            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 2) + 1;
                let x = Math.random() * innerWidth;
                let y = Math.random() * innerHeight;
                let dx = (Math.random() - 0.5) * 0.5;
                let dy = (Math.random() - 0.5) * 0.5;
                particles.push(new Particle(x, y, dx, dy, size));
            }
        }

        function animateVoid() {
            requestAnimationFrame(animateVoid);
            const isModern = document.body.classList.contains('modern-theme');
            
            if (isModern) {
                // MODERN: Floating Particles Only (Original Effect)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < particles.length; i++) {
                    particles[i].update();
                }
                connectParticles();
            } else {
                // RETRO: Interactive Boxes
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 1. Draw Subtle Grid
                ctx.strokeStyle = 'rgba(26, 26, 26, 0.03)';
                ctx.lineWidth = 1;
                for (let x = 0; x <= canvas.width; x += gridSize) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
                }
                for (let y = 0; y <= canvas.height; y += gridSize) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
                }

                // 2. Interaction Logic
                if (mouse.x !== null && mouse.y !== null) {
                    const gx = Math.floor(mouse.x / gridSize) * gridSize;
                    const gy = Math.floor(mouse.y / gridSize) * gridSize;
                    const key = `${gx}-${gy}`;
                    activeBoxes.set(key, 1.0);
                }

                // 3. Draw & Fade Active Boxes
                activeBoxes.forEach((opacity, key) => {
                    const [gx, gy] = key.split('-').map(Number);
                    ctx.fillStyle = `rgba(255, 51, 102, ${opacity * 0.1})`; // Retro accent color
                    ctx.fillRect(gx, gy, gridSize, gridSize);
                    ctx.strokeStyle = `rgba(26, 26, 26, ${opacity * 0.2})`;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(gx + 2, gy + 2, gridSize - 4, gridSize - 4);

                    let newOpacity = opacity - 0.02;
                    if (newOpacity <= 0) activeBoxes.delete(key);
                    else activeBoxes.set(key, newOpacity);
                });
            }
        }

        function connectParticles() {
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = dx * dx + dy * dy;

                    if (distance < (canvas.width / 10) * (canvas.height / 10)) {
                        opacityValue = 1 - (distance / 10000);
                        ctx.strokeStyle = `rgba(176, 0, 255, ${opacityValue * 0.15})`; // B000FF purple tint
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function updateVoidTheme() {
            // Force an immediate clear so themes don't bleed during switch
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        resizeCanvas();
        animateVoid();
    }

});
