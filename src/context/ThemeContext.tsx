import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

interface ThemeProviderProps {
    children: React.ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
        return savedTheme;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(function () {
        localStorage.setItem("theme", theme);
        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    function toggleTheme(): void {
        setTheme(function (prev) {
            if (prev === "dark") {
                return "light";
            }
            return "dark";
        });
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
