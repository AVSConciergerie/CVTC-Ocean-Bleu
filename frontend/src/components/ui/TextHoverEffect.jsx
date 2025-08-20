import React, { useState } from 'react';
import './TextHoverEffect.css';

export const TextHoverEffect = ({ text }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Pour l'effet monochrome de bleu, on peut changer la couleur du texte ou du fond
  // Le style sera principalement dans le CSS
  return (
    <div 
      className={`text-hover-effect ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text.split('').map((char, index) => (
        <span key={index} className="char">
          {char}
        </span>
      ))}
    </div>
  );
};
