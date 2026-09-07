FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all files
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

# Start production server
CMD ["npm", "start"]
