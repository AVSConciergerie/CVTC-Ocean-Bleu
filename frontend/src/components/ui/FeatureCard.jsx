import React from 'react';

/**
 * FeatureCard: A reusable card component with a neon gradient border effect.
 * It uses a pseudo-element to create an animated conic-gradient border.
 * The colors are inspired by the project's blue theme.
 * @param {{children: React.ReactNode, className?: string}} props
 */
export function FeatureCard({ children, className }) {
  return (
    <div className={`relative w-full max-w-sm p-px rounded-lg ${className}`}>
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 rounded-lg animate-spin-slow" 
           style={{ background: 'conic-gradient(from 180deg at 50% 50%, var(--color-aurora-3) 0deg, var(--color-accent) 180deg, var(--color-aurora-3) 360deg)', animationDuration: '3s' }}>
      </div>
      
      {/* Card Content */}
      <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-card-bg p-4">
        {children}
      </div>
    </div>
  );
}

// Helper component to create the gradient text effect, as seen in the demo.
export function FeatureCardTitle({ children }) {
  return (
    <span className="pointer-events-none z-10 h-full whitespace-pre-wrap bg-gradient-to-br from-[var(--color-accent)] from-35% to-[var(--color-aurora-5)] bg-clip-text text-center text-4xl font-bold leading-none tracking-tighter text-transparent">
      {children}
    </span>
  );
}
