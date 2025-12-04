# Note: Using node:25-slim (debian/glibc) instead of alpine because @livekit/rtc-node
# requires native bindings that are incompatible with musl libc used in alpine
FROM node:25-slim AS base

# Deps stage: install ALL dependencies
FROM base AS deps
WORKDIR /repo
ENV CI=1

# Copy only package files first to optimize Docker caching
COPY package.json turbo.json ./
COPY apps/livekit/package.json ./apps/livekit/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# Copy lockfile if it exists (it might not in all prune cases, but npm install will generate one)
COPY package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Generate Prisma client (required by @repo/database) with dummy DB URL
# We set the ENV variable but also write it to a .env file because prisma.config.ts might be loading dotenv
RUN echo "DATABASE_URL='file:./dev.db'" > packages/database/.env && npx turbo run db:generate

# App builder stage: build livekit app and download files
FROM base AS app-builder
WORKDIR /repo
ENV CI=1

# Copy dependencies and source
COPY --from=deps /repo/node_modules ./node_modules
COPY . .

# Some build steps in turbo (like @repo/database:db:generate) might run again or check config
RUN echo "DATABASE_URL='file:./dev.db'" > packages/database/.env

# Build the livekit app
RUN npx turbo run build --filter=livekit

# Download ML models/files
WORKDIR /repo/apps/livekit
RUN npm run download-files

# Prune development dependencies to create a production-ready node_modules
WORKDIR /repo
RUN npm prune --production

# Runner stage: minimal runtime image
FROM node:25-slim AS runner
WORKDIR /repo/apps/livekit
ENV NODE_ENV=production

# Install CA certificates and OpenSSL for LiveKit native engine
RUN apt-get update && apt-get install -y ca-certificates openssl && rm -rf /var/lib/apt/lists/*

# Copy the ENTIRE pruned repo (node_modules, built artifacts, etc)
COPY --from=app-builder /repo /repo

# Copy downloaded model files (cache)
COPY --from=app-builder --chown=node:node /root/.cache /home/node/.cache

# Copy Google Credentials if present (copied by deploy script)
COPY --chown=node:node google-credentials.json* /home/node/google-credentials.json

# Use non-root user
USER node

CMD ["node", "dist/main.js", "start"]
