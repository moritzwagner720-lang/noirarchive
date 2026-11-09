import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const SeasonalBackground: React.FC = () => {
  const { selectedTheme, currentUser } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const seasonalEffectsEnabled = currentUser?.settings?.seasonalEffectsEnabled !== false;

  useEffect(() => {
    // Only run animated particles for seasonal themes if enabled and not prefers-reduced-motion
    if (selectedTheme !== 'christmas' && selectedTheme !== 'halloween') return;
    if (!seasonalEffectsEnabled) return;

    // Respect reduced-motion accessibility
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pools
    const particleCount = selectedTheme === 'christmas' ? 45 : 30;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * (selectedTheme === 'christmas' ? 2.5 : 3.5) + 0.8,
      speedY: selectedTheme === 'christmas' ? Math.random() * 0.8 + 0.3 : -(Math.random() * 0.4 + 0.1),
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        // Update positions
        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap around boundaries
        if (selectedTheme === 'christmas') {
          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        } else {
          // Halloween mist floating upwards
          if (p.y < -10) {
            p.y = height + 5;
            p.x = Math.random() * width;
          }
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (selectedTheme === 'christmas') {
          // Snowflakes (soft white with subtle gold glimmer)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.75})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        } else {
          // Halloween mist & embers (spectral violet & warm amber)
          const isAmber = p.x % 2 === 0;
          const color = isAmber ? '255, 107, 0' : '168, 85, 247';
          ctx.fillStyle = `rgba(${color}, ${p.opacity * 0.45})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${color}, 0.5)`;
        }

        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedTheme, seasonalEffectsEnabled]);

  if (selectedTheme !== 'christmas' && selectedTheme !== 'halloween') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Background atmospheric gradient */}
      {selectedTheme === 'christmas' && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_top,rgba(22,101,52,0.18)_0%,rgba(15,36,24,0.08)_50%,transparent_80%)] blur-2xl" />
          <div className="absolute -bottom-32 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(220,38,38,0.06)_0%,transparent_70%)] blur-3xl" />
        </>
      )}

      {selectedTheme === 'halloween' && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[650px] bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.15)_0%,rgba(21,13,33,0.08)_50%,transparent_80%)] blur-2xl" />
          <div className="absolute bottom-0 left-10 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(255,107,0,0.08)_0%,transparent_70%)] blur-3xl" />
        </>
      )}

      {/* Particle Canvas */}
      {seasonalEffectsEnabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full opacity-80"
        />
      )}
    </div>
  );
};
