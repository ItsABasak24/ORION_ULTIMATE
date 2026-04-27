import { useRef, useEffect } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas dimensions to fill the screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    const numberOfParticles = 300; // Adjust for density

    // Create the particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1; // Size between 1 and 4
        this.speedX = Math.random() * 1 - 0.5; // Random speed x
        this.speedY = Math.random() * 1 - 0.5; // Random speed y
        this.color = `rgba(173, 216, 230, ${Math.random() * 0.5 + 0.1})`; // Light blue with variable opacity
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen edges (Infinite effect)
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        // This adds the "Glow" effect seen in your video
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(173, 216, 230, 0.5)";

        ctx.fill();
        // Reset shadow to avoid affecting performance of other elements
        ctx.shadowBlur = 0;
      }
    }

    // Initialize particles
    const init = () => {
      particlesArray = [];
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    // Animation Loop
    const animate = () => {
      // Use semi-transparent clearRect to create 'trails' (optional)
      // Or standard clearRect for clean movement (used here)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    // Handle Window Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init(); // Re-initialize particles on resize
    };

    window.addEventListener('resize', handleResize);

    init();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'linear-gradient(to bottom, #0a3a3a, #000000)'
      }}
    />
  );
};

export default ParticleBackground;