# =============================================================================
# Backend SGCM - API Node.js / Express
# =============================================================================

FROM node:20-alpine

# Création et positionnement dans le dossier de travail
WORKDIR /app

# Copie des fichiers de configuration des dépendances
COPY package*.json ./

# Installation des dépendances (uniquement celles de production si désiré)
RUN npm install

# Copie du reste du code source du backend
COPY . .

# L'API tourne sur le port 3000 (comme défini dans ton docker-compose)
EXPOSE 3000

# Commande de démarrage de ton serveur Node.js
# Ajuste "server.js" ou "index.js" selon le nom de ton fichier principal
# ou utilise "npm start" si tu as défini un script de démarrage.
CMD ["node", "server.js"]
