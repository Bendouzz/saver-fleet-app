FROM node:18-alpine
WORKDIR /app
RUN npm install express cors pg bcrypt jsonwebtoken
COPY server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
