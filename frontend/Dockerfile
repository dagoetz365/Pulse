FROM node:20-alpine

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm install

# Copy source (overridden by volume mount in dev)
COPY . .

EXPOSE 5173

# --host exposes Vite to Docker network; required for container-to-host comms
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
