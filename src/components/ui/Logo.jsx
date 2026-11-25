import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Modern Accommodation & Campus Mark (Standalone Logo without Name)
 * Combines an architectural pavilion arch, a secure gateway keyhole, and a modern geometric shield.
 */
export const Logo = ({ 
  size = 'md', 
  variant = 'primary', 
  className = '', 
  animated = true 
}) => {
  // Dimension presets
  const sizeMap = {
    xs: { box: 'w-7 h-7', svg: 28 },
    sm: { box: 'w-9 h-9', svg: 36 },
    md: { box: 'w-11 h-11', svg: 44 },
    lg: { box: 'w-14 h-14', svg: 56 },
    xl: { box: 'w-18 h-18', svg: 72 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Color theme presets
  const variantStyles = {
    primary: {
      shadow: 'shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
      gradStart: '#2563EB',
      gradMid: '#4F46E5',
      gradEnd: '#1E40AF',
      accentGradStart: '#38BDF8',
      accentGradEnd: '#10B981',
      bgGlow: 'bg-blue-600/10',
      border: 'border-blue-100',
    },
    admin: {
      shadow: 'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
      gradStart: '#6366F1',
      gradMid: '#7C3AED',
      gradEnd: '#4338CA',
      accentGradStart: '#A78BFA',
      accentGradEnd: '#06B6D4',
      bgGlow: 'bg-indigo-600/15',
      border: 'border-slate-700/60',
    },
    minimal: {
      shadow: 'shadow-md shadow-slate-900/5',
      gradStart: '#0F172A',
      gradMid: '#1E293B',
      gradEnd: '#334155',
      accentGradStart: '#64748B',
      accentGradEnd: '#94A3B8',
      bgGlow: 'bg-slate-100',
      border: 'border-slate-200',
    }
  };

  const style = variantStyles[variant] || variantStyles.primary;

  const Component = animated ? motion.div : 'div';
  const animProps = animated ? {
    whileHover: { scale: 1.05, rotate: 0 },
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  } : {};

  return (
    <Component
      {...animProps}
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      title="Hostel Management System"
      aria-label="Hostel Logo"
    >
      <svg
        width={currentSize.svg}
        height={currentSize.svg}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible drop-shadow-md"
      >
        <defs>
          {/* Main Shield / Pavilion Gradient */}
          <linearGradient id={`mainGrad-${variant}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={style.gradStart} />
            <stop offset="50%" stopColor={style.gradMid} />
            <stop offset="100%" stopColor={style.gradEnd} />
          </linearGradient>

          {/* Core Gateway & Keyhole Prism Accent */}
          <linearGradient id={`accentGrad-${variant}`} x1="30" y1="20" x2="70" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={style.accentGradStart} />
            <stop offset="100%" stopColor={style.accentGradEnd} />
          </linearGradient>

          {/* Roof Pavilion Left Facet */}
          <linearGradient id={`facetLeft-${variant}`} x1="20" y1="15" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>

          {/* Roof Pavilion Right Facet */}
          <linearGradient id={`facetRight-${variant}`} x1="50" y1="15" x2="80" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>

          {/* Drop Shadow Filter */}
          <filter id={`logoGlow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={style.gradStart} floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Continuous Rounded Architectural Emblem */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="26"
          fill={`url(#mainGrad-${variant})`}
          filter={`url(#logoGlow-${variant})`}
        />

        {/* Subtle Inner Glass Ring */}
        <rect
          x="7"
          y="7"
          width="86"
          height="86"
          rx="25"
          stroke="url(#facetLeft-primary)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Stylized Modern Hostel Pavilion / Interlocking 'H' Architecture Roof */}
        {/* Left Pillar */}
        <path
          d="M26 34C26 30.6863 28.6863 28 32 28H36C38.2091 28 40 29.7909 40 32V68C40 70.2091 38.2091 72 36 72H32C28.6863 72 26 69.3137 26 66V34Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />

        {/* Right Pillar */}
        <path
          d="M60 32C60 29.7909 61.7909 28 64 28H68C71.3137 28 74 30.6863 74 34V66C74 69.3137 71.3137 72 68 72H64C61.7909 72 60 70.2091 60 68V32Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />

        {/* Architectural Central Keystone / Gateway Arch Connecting Both Pillars */}
        <path
          d="M38 46C38 43.7909 39.7909 42 42 42H58C60.2091 42 62 43.7909 62 46V54C62 56.2091 60.2091 58 58 58H42C39.7909 58 38 56.2091 38 54V46Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />

        {/* Central Geometric Room Keyhole / Digital Beacon Prism */}
        <circle
          cx="50"
          cy="48"
          r="4.5"
          fill={`url(#accentGrad-${variant})`}
        />

        {/* Gabled Architectural Apex / Roof Beam that crowns the shelter */}
        <path
          d="M50 20L70 34H30L50 20Z"
          fill={`url(#accentGrad-${variant})`}
          fillOpacity="0.9"
        />

        {/* Gateway Threshold Foundation Notch */}
        <rect
          x="44"
          y="58"
          width="12"
          height="14"
          rx="3"
          fill={`url(#mainGrad-${variant})`}
          fillOpacity="0.3"
        />
      </svg>
    </Component>
  );
};

export default Logo;

