# Base image with Node.js 20 & Debian Linux
FROM node:20-bullseye-slim

# Install Python 3, pip, LibreOffice, and poppler tools for Excel-to-image
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libreoffice \
    poppler-utils \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install --no-cache-dir openpyxl pillow

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

