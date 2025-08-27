#!/bin/bash

# --- CONFIGURATION ---
PROJET="$HOME/CVTC-Ocean-Bleu"
TMP_DIR="$HOME/permissionless-temp"

echo "📦 Création du dossier temporaire..."
mkdir -p "$TMP_DIR"
cd "$TMP_DIR" || exit

echo "🐳 Lancement de Docker pour installer permissionless sur Linux..."
docker run --rm -v "$TMP_DIR":/app -w /app node:20 bash -c 'npm init -y && npm install permissionless@0.2.53'

echo "📂 Copie du dossier dist/ dans ton projet..."
mkdir -p "$PROJET/node_modules/permissionless"
cp -r "$TMP_DIR/node_modules/permissionless/dist" "$PROJET/node_modules/permissionless/"

echo "🧹 Nettoyage du dossier temporaire..."
rm -rf "$TMP_DIR"

echo "✅ Terminé !"
echo "Le dossier dist/ est maintenant dans $PROJET/node_modules/permissionless/"
echo "Tu peux relancer ton projet Vite : cd $PROJET && npm run dev"

