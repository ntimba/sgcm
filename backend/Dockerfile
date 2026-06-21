# =============================================================================
# Backend SGCM - API Node.js + Express + JWT
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# Installation des dépendances (cache optimisé)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copie du code applicatif
COPY . .

# Bonnes pratiques sécurité : ne pas exécuter en root
RUN chown -R node:node /app
USER node

# L'API Express écoute sur le port 3000
EXPOSE 3000

# Health check (le endpoint /health doit exister dans server.js)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Point d'entrée : server.js à la racine de backend/
CMD ["node", "server.js"]