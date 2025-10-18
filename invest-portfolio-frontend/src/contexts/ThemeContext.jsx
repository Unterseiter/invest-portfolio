import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    
    const systemPrefersDark = window.matchMedia 
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return systemPrefersDark ? "dark" : "light";
  });

  useEffect(() => {
    console.log("Применяем тему:", currentTheme);
    localStorage.setItem("theme", currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (themeName) => {
    if (themeName === "light" || themeName === "dark") {
      setCurrentTheme(themeName);
    }
  };

  const value = {
    currentTheme,
    toggleTheme,
    setTheme,
    isDark: currentTheme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};