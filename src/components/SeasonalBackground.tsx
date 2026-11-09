import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CHRISTMAS_BACKGROUND_IMAGE, HALLOWEEN_BACKGROUND_IMAGE } from '../utils/themes';

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

    // Particle pools: Snowflakes for Christmas, spectral embers/mist for Halloween
    const particleCount = selectedTheme === 'christmas' ? 50 : 35;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * (selectedTheme === 'christmas' ? 2.5 : 3.5) + 0.8,
      speedY: selectedTheme === 'christmas' ? Math.random() * 0.8 + 0.3 : -(Math.random() * 0.4 + 0.1),
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.25,
      pulse: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap around boundaries
        if (selectedTheme === 'christmas') {
          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        } else {
          // Halloween mist/embers floating upwards into the night
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
          // Snowflakes (soft white with subtle holiday glimmer)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.85})`;
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        } else {
          // Halloween mist & embers (spectral violet & pumpkin orange)
          const isAmber = p.x % 2 === 0;
          const color = isAmber ? '255, 107, 0' : '168, 85, 247';
          ctx.fillStyle = `rgba(${color}, ${p.opacity * 0.6})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${color}, 0.7)`;
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

  // All other themes, especially Graphite, retain their existing solid/discord backgrounds
  if (selectedTheme !== 'christmas' && selectedTheme !== 'halloween') {
    return null;
  }

  const bgImage = selectedTheme === 'christmas' ? CHRISTMAS_BACKGROUND_IMAGE : HALLOWEEN_BACKGROUND_IMAGE;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full overflow-hidden select-none"
    >
      {/* 
        Full-page Background Image:
        - Exact provided images
        - background-size: cover & background-position: center
        - Preserves original proportions without distortion
        - Mobile & desktop optimized with fixed viewport coverage
      */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 
        Subtle dark overlay:
        Maintains contrast & keeps text, buttons, cards and navigation crystal clear and readable
      */}
      <div className="absolute inset-0 bg-black/45 backdrop-brightness-[0.92] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/75 pointer-events-none" />

      {/* Theme Atmospheric Radial Accents */}
      {selectedTheme === 'christmas' && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[550px] bg-[radial-gradient(circle_at_top,rgba(22,101,52,0.2)_0%,rgba(15,36,24,0.08)_50%,transparent_80%)] blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 right-0 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(220,38,38,0.08)_0%,transparent_70%)] blur-3xl pointer-events-none" />
        </>
      )}

      {selectedTheme === 'halloween' && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.18)_0%,rgba(21,13,33,0.08)_50%,transparent_80%)] blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-[550px] h-[350px] bg-[radial-gradient(circle,rgba(255,107,0,0.1)_0%,transparent_70%)] blur-3xl pointer-events-none" />
        </>
      )}

      {/* Atmospheric Particle Canvas (Snow / Embers) */}
      {seasonalEffectsEnabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full opacity-90 pointer-events-none"
        />
      )}
    </div>
  );
};
