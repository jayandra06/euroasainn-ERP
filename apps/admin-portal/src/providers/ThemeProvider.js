import { createContext, useEffect, useState } from "react";
export const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => { },
});
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined')
            return 'light';
        // Check localStorage first, then system preference
        const saved = localStorage.getItem("theme");
        if (saved === "dark" || saved === "light")
            return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });
    useEffect(() => {
        const html = document.documentElement;
        if (theme === "dark") {
            html.classList.add("dark");
            html.setAttribute("data-theme", "dark");
        }
        else {
            html.classList.remove("dark");
            html.setAttribute("data-theme", "light");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);
    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };
    return (<ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>);
}
//# sourceMappingURL=ThemeProvider.js.map