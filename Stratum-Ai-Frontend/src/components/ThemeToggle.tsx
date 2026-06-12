import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`h-8 w-8 relative text-muted-foreground hover:text-foreground transition-colors ${className}`}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Moon className="w-3.5 h-3.5" />
                </motion.span>
              ) : (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: 30, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -30, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sun className="w-3.5 h-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}