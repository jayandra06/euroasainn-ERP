import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme} className="w-10 h-10 rounded-full flex items-center justify-center bg-[hsl(var(--secondary))] transition-colors duration-400" aria-label="Toggle theme">
      <div className="relative w-6 h-6">
        <motion.div initial={false} animate={{
            scale: theme === "dark" ? 1 : 0,
            opacity: theme === "dark" ? 1 : 0,
        }} transition={{ duration: 0.4, ease: "easeInOut" }} className="absolute inset-0 flex items-center justify-center text-[hsl(var(--foreground))]">
          <Sun className="w-5 h-5"/>
        </motion.div>
        <motion.div initial={false} animate={{
            scale: theme === "light" ? 1 : 0,
            opacity: theme === "light" ? 1 : 0,
        }} transition={{ duration: 0.4, ease: "easeInOut" }} className="absolute inset-0 flex items-center justify-center text-[hsl(var(--foreground))]">
          <Moon className="w-5 h-5"/>
        </motion.div>
      </div>
    </motion.button>);
}
//# sourceMappingURL=ThemeToggle.js.map