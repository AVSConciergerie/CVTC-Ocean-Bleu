
import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Création du Contexte
export const ThemeContext = createContext(null);

// 2. Création du Fournisseur (Provider)
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // Thème par défaut

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  // 3. Effet pour mettre à jour l'attribut sur le body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const value = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Hook personnalisé pour utiliser le contexte facilement
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé à l'intérieur d'un ThemeProvider");
  }
  return context;
};
