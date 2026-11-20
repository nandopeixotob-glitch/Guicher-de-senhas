FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY server.js ticket-code.js ./
EXPOSE 3000
CMD ["node", "server.js"]
