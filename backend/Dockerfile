# =============================================================================
# Frontend SGCM - Build multi-stage
#   Stage 1 : compile React + Tailwind avec Node
#   Stage 2 : sert les fichiers statiques avec nginx (qui fait aussi reverse
#             proxy vers le backend Express - voir nginx/conf.d/default.conf)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 : Build du bundle React
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Installer les dépendances (avec cache Docker optimisé)
COPY package*.json ./
RUN npm ci

# Copier les sources et construire
COPY . .

# Variables exposées au build (clé publique ReCaptcha, URL de l'API...)
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_API_URL=/api
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build
# NOTE : si tu utilises Create-React-App au lieu de Vite, remplace 'dist' par
# 'build' dans le COPY ci-dessous.

# -----------------------------------------------------------------------------
# Stage 2 : Image de production = nginx + fichiers statiques
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Copier le build React depuis le stage précédent
COPY --from=build /app/dist /usr/share/nginx/html

# La config nginx (TLS + reverse proxy /api) est montée via docker-compose
# (volume nginx/conf.d) - voir nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
