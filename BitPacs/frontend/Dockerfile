# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci && npm cache clean --force

# Copiar codigo fonte
COPY . .

# Argumentos de build
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

# Build da aplicação
RUN npm run build

# Stage 2: Production com Nginx
FROM nginx:alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Remover configuracao padrao do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuracao customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

