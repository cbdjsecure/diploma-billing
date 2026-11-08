# Base image with Node.js 20 & Debian 12 (Bookworm)
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install Python 3, LibreOffice Calc headless, fonts, and poppler tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-openpyxl \
    python3-pil \
    libreoffice-calc \
    poppler-utils \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build React client
COPY . .
RUN npm run build

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "server.js"]
