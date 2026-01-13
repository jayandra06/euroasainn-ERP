import React, { createContext, useContext, useEffect, useState } from 'react';
const STORAGE_KEY = 'theme';
const ThemeContext = createContext(undefined);
function applyTheme(theme) {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const elements = [html, body, root].filter((el) => Boolean(el));
    elements.forEach((el) => {
        el.classList.toggle('dark', theme === 'dark');
        el.setAttribute('data-theme', theme);
    });
    html.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };
    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    };
    return (<ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
//# sourceMappingURL=ThemeContext.js.map