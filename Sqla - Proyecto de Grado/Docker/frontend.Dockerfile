# Etapa 1: Build de la app
FROM node:20-alpine AS build

WORKDIR /app
COPY sqla-app/package*.json ./
RUN npm install
COPY sqla-app/ .
RUN npm run build
RUN mkdir -p /app/dist/src/js/views/partials && cp -R src/js/views/partials/* /app/dist/src/js/views/partials/
RUN mkdir -p /app/dist/assets/css /app/dist/assets/img && cp -R assets/css/. /app/dist/assets/css/ && cp -R assets/img/. /app/dist/assets/img/

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Copiamos la configuración de nginx
COPY Docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos construidos
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
