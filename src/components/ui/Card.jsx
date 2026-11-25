import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${
        hover ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '', action = null }) => {
  return (
    <div className={`p-5 sm:p-6 pb-2 flex items-start justify-between gap-4 ${className}`}>
      <div className="space-y-1">{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-base sm:text-lg font-bold text-slate-900 tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-xs sm:text-sm text-slate-500 font-normal ${className}`}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`px-5 py-4 sm:px-6 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

export default Card;

