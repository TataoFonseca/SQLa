FROM node:20-alpine

WORKDIR /app
COPY sqla-backend/package*.json ./
RUN npm install
COPY sqla-backend/ .

EXPOSE 3000

CMD ["npm", "start"]
