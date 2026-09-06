import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'ai';
  message: string;
}

export default function MessageBubble({ role, message }: MessageBubbleProps) {
  const shouldReduceMotion = useReducedMotion();
  const isUser = role === 'user';

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs',
          isUser
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-bl-none',
        )}
      >
        <p
          className={cn(
            'text-[10px] font-bold mb-0.5',
            isUser ? 'text-indigo-200' : 'text-indigo-600',
          )}
        >
          {isUser ? 'Bạn' : 'AI'}
        </p>

        <p className="font-normal">{message}</p>
      </div>
    </motion.div>
  );
}
