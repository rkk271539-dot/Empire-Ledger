import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800/80">
          <div>
            {title && <h3 className="font-semibold text-gray-100 text-sm sm:text-base tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
