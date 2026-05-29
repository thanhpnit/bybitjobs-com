# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist
# Copy serviceAccountKey.json nếu có (để Firebase hoạt động)
COPY serviceAccountKey.json ./serviceAccountKey.json

EXPOSE 4000
CMD ["node", "dist/server.js"]
