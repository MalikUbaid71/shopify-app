# FROM node:18-alpine
# RUN apk add --no-cache openssl

# EXPOSE 3000

# WORKDIR /app

# ENV NODE_ENV=production

# COPY package.json package-lock.json* ./

# RUN npm ci --omit=dev && npm cache clean --force
# # Remove CLI packages since we don't need them in production by default.
# # Remove this line if you want to run CLI commands in your container.
# RUN npm remove @shopify/cli

# COPY . .

# RUN shopify app dev

# CMD ["npm", "run", "docker-start"]


FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy prisma schema before install (so postinstall can see it)
COPY prisma ./prisma

# Install deps
RUN npm ci --omit=dev && npm cache clean --force

# Remove Shopify CLI for production (optional)
RUN npm remove @shopify/cli || true

# Copy rest of the code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Run migrations at container start and then start app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
