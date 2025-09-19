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

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Install only prod deps
RUN npm ci --omit=dev && npm cache clean --force

# Copy app files
COPY . .

# Build Remix app
RUN npm run build

# Start Remix app
CMD ["npm", "run", "start"]
