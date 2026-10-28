import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-charcoal-900 border border-stone-200 dark:border-stone-850 rounded-xl p-5 shadow-card transition-all ${
        hoverable ? 'hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-subtle' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
