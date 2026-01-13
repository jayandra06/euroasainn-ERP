import React, { ReactNode } from 'react';
type Theme = 'light' | 'dark';
interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}
export declare function ThemeProvider({ children }: {
    children: ReactNode;
}): React.JSX.Element;
export declare function useTheme(): ThemeContextType;
export {};
//# sourceMappingURL=ThemeContext.d.ts.map