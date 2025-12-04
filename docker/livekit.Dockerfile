#docker build -t docker.registry.home.adhityan.com/resto-ai-livekit -f docker/livekit.Dockerfile .
#docker run --env-file apps/livekit/.env --rm --name resto-ai-livekit docker.registry.home.adhityan.com/resto-ai-livekit
#docker push docker.registry.home.adhityan.com/resto-ai-livekit
#docker rm -f resto-ai-livekit

# Note: Using node:25-slim (debian/glibc) instead of alpine because @livekit/rtc-node
# requires native bindings that are incompatible with musl libc used in alpine
FROM node:25-slim AS base

# Prep stage: copy minimal files and prune the monorepo to only what's needed for livekit
FROM base AS prep
WORKDIR /repo
ENV CI=1
COPY package.json package-lock.json turbo.json ./
# Only copy package.json files from packages, not the source code
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
# Only copy package.json files from apps, not the source code
COPY apps/livekit/package.json ./apps/livekit/package.json
# Install root deps to run turbo prune
RUN npm ci
# Now copy the full source code after npm ci for pruning
COPY packages ./packages
COPY apps ./apps
RUN npx turbo prune --scope=livekit --docker

# Deps stage: install ALL dependencies (needed for build tools like TSC, TSX, etc.)
FROM base AS deps
WORKDIR /repo
ENV CI=1
COPY --from=prep /repo/out/json/ .
RUN npm ci

# Package builder stage: build dependency packages (cached unless package source changes)
FROM base AS package-builder
WORKDIR /repo
ENV CI=1

# Copy dependencies from deps stage
COPY --from=deps /repo/node_modules ./node_modules

# Copy pruned package source
COPY --from=prep /repo/out/full/packages ./packages
COPY --from=prep /repo/out/json/package.json ./package.json
COPY --from=prep /repo/out/full/turbo.json ./turbo.json

# Build packages that livekit depends on
RUN npx turbo run build --filter=@repo/utils
RUN npx turbo run build --filter=@repo/contracts

# App builder stage: build livekit app and download files
FROM base AS app-builder
WORKDIR /repo
ENV CI=1

# Copy dependencies
COPY --from=deps /repo/node_modules ./node_modules

# Copy built packages from package-builder
COPY --from=package-builder /repo/packages ./packages
COPY --from=prep /repo/out/json/package.json ./package.json
COPY --from=prep /repo/out/full/turbo.json ./turbo.json

# Copy livekit app source (this is the layer that changes most frequently)
COPY --from=prep /repo/out/full/apps/livekit ./apps/livekit

# Build the livekit app
RUN npx turbo run build --filter=livekit

# Download ML models/files (requires tsx dev dependency, must run before pruning)
WORKDIR /repo/apps/livekit
RUN npm run download-files

# Prune development dependencies to create a production-ready node_modules
# This keeps the downloaded model files in node_modules while removing dev tools
WORKDIR /repo
RUN npm prune --production

# Runner stage: minimal runtime image
FROM node:25-slim AS runner
WORKDIR /repo/apps/livekit
ENV NODE_ENV=production

# 1. Copy the ENTIRE dependency structure from app-builder (which is now pruned)
# This includes root node_modules (with downloaded models), nested node_modules, package.json files, and built artifacts.
COPY --from=app-builder /repo /repo

# 2. Overlay built artifacts for internal packages
COPY --from=package-builder /repo/packages/contracts/dist /repo/packages/contracts/dist
COPY --from=package-builder /repo/packages/utils/dist /repo/packages/utils/dist

# 3. Copy downloaded model files (cache)
COPY --from=app-builder --chown=node:node /root/.cache /home/node/.cache

# Use non-root user
USER node

CMD ["node", "dist/main.js", "start"]
