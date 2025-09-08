#!/bin/bash

# Script d'installation de Node.js pour macOS
echo "Installation de Node.js LTS..."

# Installation via Homebrew (si disponible)
if command -v brew &> /dev/null; then
    echo "Installation via Homebrew..."
    brew install node
    brew install npm
else
    echo "Homebrew n'est pas installé. Installation manuelle..."

    # Téléchargement et installation manuelle de Node.js
    NODE_VERSION="20.11.0"
    ARCH=$(uname -m)

    if [[ "$ARCH" == "x86_64" ]]; then
        NODE_ARCH="x64"
    elif [[ "$ARCH" == "arm64" ]]; then
        NODE_ARCH="arm64"
    else
        echo "Architecture non supportée: $ARCH"
        exit 1
    fi

    echo "Téléchargement de Node.js $NODE_VERSION pour $ARCH..."
    curl -o nodejs.pkg "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION.pkg"

    echo "Installation de Node.js..."
    sudo installer -pkg nodejs.pkg -target /

    echo "Nettoyage..."
    rm nodejs.pkg
fi

echo "Vérification de l'installation..."
node --version
npm --version

echo "Installation terminée !"
echo "Vous pouvez maintenant déployer les contrats avec :"
echo "cd smart-contracts && npm install && npx hardhat run scripts/deploy-all.ts --network bscTestnet"