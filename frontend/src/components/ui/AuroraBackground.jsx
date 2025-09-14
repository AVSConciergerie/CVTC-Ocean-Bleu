
import React from "react";
import "./AuroraBackground.css";

// Ce composant ne fait qu'afficher l'effet d'aurore en fond.
// Il sera placé une seule fois dans App.jsx et se trouvera "derrière" tout le reste.
  console.log('AuroraBackground component rendering');
export const AuroraBackground = () => {
  return (
    <div className="aurora-background-container">
      <div className="aurora-background-wrapper">
        <div className="aurora-light-1"></div>
        <div className="aurora-light-2"></div>
        <div className="aurora-light-3"></div>
        <div className="aurora-light-4"></div>
        <div className="aurora-light-5"></div>
      </div>
    </div>
  );
};

