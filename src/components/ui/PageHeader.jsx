import React from 'react';
import { motion } from 'framer-motion';

export const PageHeader = ({
  title,
  description,
  badge = null,
  actions = null,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-slate-200/60 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
};
export default PageHeader;

