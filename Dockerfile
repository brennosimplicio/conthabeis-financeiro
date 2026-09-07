FROM node:20-alpine

WORKDIR /app

# Build arguments that become env vars during build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all files
COPY . .

# Build Next.js (NEXT_PUBLIC_* vars are embedded here)
RUN npm run build

EXPOSE 3000

# Start production server
CMD ["npm", "start"]
