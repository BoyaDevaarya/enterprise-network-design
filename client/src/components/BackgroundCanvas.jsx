import React, { useEffect, useRef } from 'react';

export default function BackgroundCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2, radius: 180 };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // High-tech cyber constellation particles
    const particleCount = Math.min(45, Math.floor((width * height) / 25000));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.4 + 0.2,
      color: Math.random() > 0.4 ? '#06b6d4' : Math.random() > 0.5 ? '#3b82f6' : '#8b5cf6'
    }));

    // Moving data pulses along links
    const dataPulses = Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      progress: Math.random(),
      speed: Math.random() * 0.008 + 0.004,
      fromIdx: 0,
      toIdx: 1
    }));

    let isHidden = document.hidden;
    const handleVisibilityChange = () => {
      isHidden = document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isHidden) {
        ctx.clearRect(0, 0, width, height);

        // Cyber Grid overlay
        const gridSize = 55;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Mouse Spotlight Glow
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, mouse.radius * 1.5
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.025)');
        gradient.addColorStop(1, 'rgba(3, 7, 18, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Update & Draw Constellation Lines
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          p1.x += p1.vx;
          p1.y += p1.vy;

          if (p1.x < 0) p1.x = width;
          if (p1.x > width) p1.x = 0;
          if (p1.y < 0) p1.y = height;
          if (p1.y > height) p1.y = 0;

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
              const alpha = (1 - dist / 150) * 0.25;
              ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }

          // Mouse proximity reaction
          const dmx = p1.x - mouse.x;
          const dmy = p1.y - mouse.y;
          const distMouse = Math.sqrt(dmx * dmx + dmy * dmy);
          let extraAlpha = 0;
          if (distMouse < mouse.radius) {
            extraAlpha = (1 - distMouse / mouse.radius) * 0.5;
          }

          // Draw Node Particle with Glow
          ctx.fillStyle = p1.color;
          ctx.globalAlpha = Math.min(1, p1.baseAlpha + extraAlpha);
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, p1.size + (extraAlpha * 1.5), 0, Math.PI * 2);
          ctx.fill();

          // Outer halo for active particles
          if (extraAlpha > 0.2) {
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = extraAlpha * 0.4;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, (p1.size + 3) * 1.8, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90 transition-opacity duration-1000"
    />
  );
}
