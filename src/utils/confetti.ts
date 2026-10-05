import confetti from 'canvas-confetti';

/**
 * Fires an extended, multi-stage celebratory canvas confetti animation
 * when a user completes a purchase in BuyModal.
 */
export function triggerPurchaseConfetti(): void {
  const brandColors = [
    '#ec4899', // Hot Pink Neon
    '#8b5cf6', // Electric Purple
    '#06b6d4', // Cyber Cyan
    '#10b981', // Emerald Matrix
    '#f59e0b', // Sunset Gold
    '#ffffff', // Crisp White
  ];

  // Base options with top-level zIndex to render above all modals
  const baseOptions = {
    origin: { y: 0.62 },
    zIndex: 999999,
    disableForReducedMotion: true,
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      ...baseOptions,
      ...opts,
      particleCount: Math.floor(190 * particleRatio),
      colors: brandColors,
    });
  };

  // Primary center explosion with varied velocity
  fire(0.25, {
    spread: 35,
    startVelocity: 58,
  });

  fire(0.2, {
    spread: 65,
  });

  fire(0.35, {
    spread: 105,
    decay: 0.92,
    scalar: 0.9,
  });

  fire(0.1, {
    spread: 125,
    startVelocity: 28,
    decay: 0.93,
    scalar: 1.25,
  });

  fire(0.1, {
    spread: 135,
    startVelocity: 48,
  });

  // Staggered side cannons for festive coverage
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 55,
      spread: 65,
      origin: { x: 0, y: 0.72 },
      zIndex: 999999,
      colors: brandColors,
    });

    confetti({
      particleCount: 50,
      angle: 125,
      spread: 65,
      origin: { x: 1, y: 0.72 },
      zIndex: 999999,
      colors: brandColors,
    });
  }, 220);

  // Soft floating shimmer finale
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 90,
      startVelocity: 20,
      decay: 0.94,
      scalar: 0.75,
      origin: { y: 0.45 },
      zIndex: 999999,
      colors: brandColors,
    });
  }, 500);
}
