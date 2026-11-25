import React from 'react';
import { motion } from 'framer-motion';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'primary',
  color = 'blue',
  className = '',
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'hover:border-blue-200',
      ring: 'group-hover:ring-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'hover:border-emerald-200',
      ring: 'group-hover:ring-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'hover:border-amber-200',
      ring: 'group-hover:ring-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'hover:border-purple-200',
      ring: 'group-hover:ring-purple-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'hover:border-rose-200',
      ring: 'group-hover:ring-rose-100',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className={`group relative overflow-hidden bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 ${scheme.border} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </h4>
            {badge && (
              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                badgeVariant === 'success' ? 'bg-emerald-50 text-emerald-700' :
                badgeVariant === 'warning' ? 'bg-amber-50 text-amber-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 font-normal pt-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default MetricCard;

