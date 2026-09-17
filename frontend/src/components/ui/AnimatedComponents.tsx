import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  hover?: boolean;
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  direction = 'up',
  hover = true 
}: AnimatedCardProps) {
  const directionMap = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={hover ? { y: -4 } : undefined}
      className={twMerge('glass-card', className)}
    >
      {children}
    </motion.div>
  );
}

interface GlowButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function GlowButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  onClick,
  href 
}: GlowButtonProps) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 cursor-pointer inline-flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-[0_8px_24px_-4px_rgba(37,99,235,0.4)] hover:scale-[1.02]',
    secondary: 'bg-white/5 border border-white/10 text-white hover:bg-white/8 hover:border-blue-500/30 hover:scale-[1.02]',
    ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base'
  };

  const Component = href ? motion.a : motion.button;
  
  return (
    <Component
      href={href}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
    >
      {children}
    </Component>
  );
}

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

export function AnimatedCounter({ 
  value, 
  suffix = '', 
  prefix = '',
  label 
}: AnimatedCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="stat-item"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="stat-number"
      >
        {prefix}{value}{suffix}
      </motion.div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

interface SectionTitleProps {
  badge?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ badge, title, highlight, subtitle, className }: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={twMerge('text-center max-w-2xl mx-auto mb-14', className)}
    >
      {badge && (
        <motion.span
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="section-badge"
        >
          {badge}
        </motion.span>
      )}
      <h2 className="section-title">
        {title}{' '}
        {highlight && <span className="gradient-text">{highlight}</span>}
      </h2>
      {subtitle && (
        <p className="section-subtitle">{subtitle}</p>
      )}
    </motion.div>
  );
}
