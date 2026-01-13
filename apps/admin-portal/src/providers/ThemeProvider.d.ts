type Theme = "light" | "dark";
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}
export declare const ThemeContext: import("react").Context<ThemeContextType>;
export declare function ThemeProvider({ children }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map