import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-card-bg/60 backdrop-blur-sm border border-card-border/50 hover:bg-card-bg/80 transition-all duration-200 opacity-70 hover:opacity-100 shadow-sm"
      title={`Passer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      {theme === 'light' ? (
        <Moon size={16} className="text-text-primary" />
      ) : (
        <Sun size={16} className="text-text-primary" />
      )}
    </button>
  );
};

export default ThemeToggle;