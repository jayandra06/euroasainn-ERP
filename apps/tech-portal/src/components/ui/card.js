import * as React from 'react';
import { cn } from '../../lib/utils';
const Card = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('rounded-2xl border border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300', className)} {...props}/>));
Card.displayName = 'Card';
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('flex flex-col space-y-2 p-6 pb-4 border-b border-gray-200/50 dark:border-gray-800/50', className)} {...props}/>));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (<h3 ref={ref} className={cn('text-2xl font-bold leading-none tracking-tight text-[hsl(var(--foreground))]', className)} {...props}/>));
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (<p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400 font-medium', className)} {...props}/>));
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('p-6 pt-4', className)} {...props}/>));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('flex items-center p-6 pt-4 border-t border-gray-200/50 dark:border-gray-800/50', className)} {...props}/>));
CardFooter.displayName = 'CardFooter';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
//# sourceMappingURL=card.js.map