/**
 * Animated weather particles background
 */

class Particle {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Default options
        this.x = options.x || Math.random() * canvas.width;
        this.y = options.y || Math.random() * canvas.height;
        this.size = options.size || Math.random() * 3 + 1;
        this.speedX = options.speedX || (Math.random() - 0.5) * 2;
        this.speedY = options.speedY || (Math.random() - 0.5) * 2;
        this.color = options.color || 'rgba(255, 255, 255, 0.7)';
        this.opacity = options.opacity || Math.random() * 0.6 + 0.2;
        
        // Weather-specific options
        this.isSnow = options.isSnow || false;
        this.isRain = options.isRain || false;
    }
    
    update() {
        // Move the particle
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Wrap around edges
        if (this.x > this.canvas.width) this.x = 0;
        if (this.x < 0) this.x = this.canvas.width;
        
        // Special behavior for rain and snow
        if (this.isRain || this.isSnow) {
            if (this.y > this.canvas.height) {
                this.y = 0;
                this.x = Math.random() * this.canvas.width;
            }
        } else {
            // Normal particles wrap around
            if (this.y > this.canvas.height) this.y = 0;
            if (this.y < 0) this.y = this.canvas.height;
        }
        
        // Special behavior for rain
        if (this.isRain) {
            this.speedY = Math.abs(this.speedY) * 2; // Rain falls down faster
        }
        
        // Special behavior for snow
        if (this.isSnow) {
            this.speedX = Math.sin(Date.now() / 1000 + this.x) * 0.5; // Sway side to side
            this.speedY = Math.random() * 0.5 + 0.5; // Slower fall
        }
    }
    
    draw() {
        this.ctx.beginPath();
        
        if (this.isRain) {
            // Draw rain drop
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.size / 2;
            this.ctx.moveTo(this.x, this.y);
            this.ctx.lineTo(this.x, this.y + this.size * 4);
            this.ctx.stroke();
        } else if (this.isSnow) {
            // Draw snowflake
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Draw normal particle
            this.ctx.fillStyle = this.color;
            this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

class ParticleSystem {
    constructor(containerId, weatherType = 'clear') {
        this.container = document.getElementById(containerId);
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.weatherType = weatherType;
        this.animationId = null;
        
        // Add canvas to container
        this.container.appendChild(this.canvas);
        
        // Set canvas size
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize particles based on weather
        this.setWeatherType(weatherType);
        this.animate();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Recreate particles on resize
        if (this.particles.length) {
            this.setWeatherType(this.weatherType);
        }
    }
    
    setWeatherType(type) {
        this.weatherType = type;
        this.particles = [];
        
        let count = 75; // Default particle count
        let options = {};
        
        switch (type) {
            case 'clear':
                count = 50;
                options = {
                    color: 'rgba(255, 255, 255, 0.7)',
                    size: () => Math.random() * 2 + 1
                };
                break;
                
            case 'clouds':
                count = 80;
                options = {
                    color: 'rgba(255, 255, 255, 0.5)',
                    size: () => Math.random() * 3 + 2,
                    speedX: () => (Math.random() - 0.5) * 0.8,
                    speedY: () => (Math.random() - 0.5) * 0.8
                };
                break;
                
            case 'rain':
                count = 150;
                options = {
                    isRain: true,
                    color: 'rgba(200, 220, 255, 0.8)',
                    size: () => Math.random() * 1 + 1,
                    speedY: () => Math.random() * 8 + 12,
                    speedX: () => (Math.random() - 0.5) * 2
                };
                break;
                
            case 'snow':
                count = 100;
                options = {
                    isSnow: true,
                    size: () => Math.random() * 3 + 1,
                    speedY: () => Math.random() * 1 + 1
                };
                break;
                
            case 'thunderstorm':
                count = 120;
                options = {
                    isRain: true,
                    color: 'rgba(200, 220, 255, 0.8)',
                    size: () => Math.random() * 1.5 + 1,
                    speedY: () => Math.random() * 15 + 15
                };
                this.addLightningEffect();
                break;
        }
        
        // Create particles
        for (let i = 0; i < count; i++) {
            const particleOptions = {
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: typeof options.size === 'function' ? options.size() : (options.size || Math.random() * 3 + 1),
                speedX: typeof options.speedX === 'function' ? options.speedX() : (options.speedX || (Math.random() - 0.5) * 2),
                speedY: typeof options.speedY === 'function' ? options.speedY() : (options.speedY || (Math.random() - 0.5) * 2),
                color: options.color || 'rgba(255, 255, 255, 0.7)',
                isRain: options.isRain || false,
                isSnow: options.isSnow || false
            };
            
            this.particles.push(new Particle(this.canvas, particleOptions));
        }
    }
    
    addLightningEffect() {
        // Add random lightning flashes
        const addLightning = () => {
            if (Math.random() > 0.97) {
                this.container.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                setTimeout(() => {
                    this.container.style.backgroundColor = 'transparent';
                }, 100);
            }
            
            if (this.weatherType === 'thunderstorm') {
                setTimeout(addLightning, Math.random() * 5000);
            }
        };
        
        addLightning();
    }
    
    updateTheme(isDarkTheme) {
        // Update particle colors based on theme
        this.particles.forEach(particle => {
            if (!particle.isRain && !particle.isSnow) {
                particle.color = isDarkTheme ? 
                    'rgba(255, 255, 255, 0.4)' : 
                    'rgba(255, 255, 255, 0.7)';
            }
        });
    }
    
    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (let particle of this.particles) {
            particle.update();
            particle.draw();
        }
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize particles system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create a global instance for use in other scripts
    window.particleSystem = new ParticleSystem('particles-container', 'clear');
});
