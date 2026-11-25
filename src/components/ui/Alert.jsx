import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Alert = ({
  type = 'info',
  title,
  children,
  onClose = null,
  className = '',
}) => {
  const types = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500',
    },
  };

  const current = types[type] || types.info;
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`p-4 rounded-xl border flex items-start gap-3 ${current.bg} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="text-current opacity-60 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};
export default Alert;
