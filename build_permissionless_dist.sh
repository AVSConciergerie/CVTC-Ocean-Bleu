#!/bin/bash
set -e

PROJET="$HOME/CVTC-Ocean-Bleu"
TMP_DIR="$HOME/permissionless-temp"

echo "📦 Création du dossier temporaire..."
mkdir -p "$TMP_DIR"
cd "$TMP_DIR" || exit

echo "🐳 Lancement de Docker pour installer et build permissionless..."
docker run --rm -v "$TMP_DIR":/app -w /app node:20 bash -c "
  npm init -y
  npm install permissionless@0.2.53
  # Si permissionless fournit un script de build, l'exécuter
  if [ -f node_modules/permissionless/package.json ]; then
    cd node_modules/permissionless
    if npm run | grep -q build; then
      npm run build
    fi
    cd /app
  fi
"

echo "📂 Copie du dossier dist/ dans ton projet..."
mkdir -p "$PROJET/node_modules/permissionless"
if [ -d "$TMP_DIR/node_modules/permissionless/dist" ]; then
  cp -r "$TMP_DIR/node_modules/permissionless/dist" "$PROJET/node_modules/permissionless/"
  echo "✅ dist/ copié dans $PROJET/node_modules/permissionless/"
else
  echo "❌ dist/ introuvable. Build peut avoir échoué. Vérifie dans $TMP_DIR/node_modules/permissionless/"
fi

echo "🧹 Nettoyage du dossier temporaire..."
rm -rf "$TMP_DIR"

echo "🎉 Script terminé ! Tu peux relancer ton projet : cd $PROJET && npm run dev"

