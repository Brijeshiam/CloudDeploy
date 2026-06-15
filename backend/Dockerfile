# =============================================================================
# CloudDeploy Backend — Dockerfile
# Multi-stage build for production
# =============================================================================

# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Install native build tools (needed by some npm packages)
RUN apk add --no-cache python3 make g++ git

COPY package*.json ./
RUN npm ci --only=production

# ---- Stage 2: Development ----
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache python3 make g++ git docker-cli

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---- Stage 3: Production ----
FROM node:20-alpine AS production
WORKDIR /app

# Install docker CLI (needed to build user images)
RUN apk add --no-cache docker-cli git

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 && \
    mkdir -p /app/repos && \
    chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
