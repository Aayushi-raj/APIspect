import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'purple' | 'cyan' | 'rose' | 'amber' | 'none';
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  hoverGlow = true,
  ...props
}) => {
  const glowClasses = {
    none: '',
    purple: 'shadow-[0_0_15px_-3px_rgba(147,51,234,0.15)] border-purple-500/20',
    cyan: 'shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)] border-cyan-500/20',
    rose: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)] border-rose-500/20',
    amber: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)] border-amber-500/20',
  };

  const hoverClasses = hoverGlow
    ? 'hover:border-zinc-700/80 transition-all duration-300 hover:shadow-lg'
    : '';

  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-950/40 backdrop-blur-xl p-6 ${glowClasses[glow]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`mb-4 flex flex-col space-y-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight text-zinc-100 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-zinc-300 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`mt-6 flex items-center ${className}`} {...props}>
    {children}
  </div>
);
