#docker build -t docker.registry.home.adhityan.com/resto-ai-backend -f docker/backend.Dockerfile .
#docker push docker.registry.home.adhityan.com/resto-ai-backend
FROM node:25-alpine AS base

# Prep stage: copy minimal files and prune the monorepo to only what's needed for backend
FROM base AS prep
WORKDIR /repo
ENV CI=1
COPY package.json package-lock.json turbo.json ./
# Only copy package.json files from packages, not the source code
COPY packages/common/package.json ./packages/common/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
# Only copy package.json files from apps, not the source code
COPY apps/backend/package.json ./apps/backend/package.json
# Install root deps to run turbo prune
RUN npm ci
# Now copy the full source code after npm ci for pruning
COPY packages ./packages
COPY apps ./apps
RUN npx turbo prune --scope=backend --docker

# Deps stage: install ALL dependencies (needed for build tools like Prisma CLI, SWC, etc.)
FROM base AS deps
WORKDIR /repo
ENV CI=1
COPY --from=prep /repo/out/json/ .
RUN npm ci

# Production deps stage: install only production dependencies for runtime
FROM base AS prod-deps
WORKDIR /repo
ENV CI=1
COPY --from=prep /repo/out/json/ .
RUN npm ci --omit=dev --omit=optional

# Package builder stage: build dependency packages (cached unless package source changes)
FROM base AS package-builder
WORKDIR /repo
ENV CI=1
RUN apk add --no-cache libc6-compat openssl

# Copy dependencies from deps stage
COPY --from=deps /repo/node_modules ./node_modules

# Copy pruned package source
COPY --from=prep /repo/out/full/packages ./packages
COPY --from=prep /repo/out/json/package.json ./package.json
COPY --from=prep /repo/out/full/turbo.json ./turbo.json

# Generate Prisma client and build packages (cached unless package source changes)
RUN npx turbo run db:generate --filter=@repo/database
RUN npx turbo run build --filter=@repo/database
RUN npx turbo run build --filter=@repo/utils
RUN npx turbo run build --filter=@repo/contracts
RUN npx turbo run build --filter=@repo/common

# Compile the seed script to JavaScript in the same directory to preserve relative imports
RUN npx tsc packages/database/prisma/seed.ts \
    --outDir packages/database/prisma \
    --module commonjs \
    --moduleResolution node \
    --esModuleInterop \
    --resolveJsonModule \
    --skipLibCheck \
    --target ES2020 \
    --lib ES2020

# App builder stage: build backend app (only invalidated when backend source changes)
FROM base AS app-builder
WORKDIR /repo
ENV CI=1
RUN apk add --no-cache libc6-compat openssl

# Copy dependencies
COPY --from=deps /repo/node_modules ./node_modules

# Copy built packages from package-builder
COPY --from=package-builder /repo/packages ./packages
COPY --from=prep /repo/out/json/package.json ./package.json
COPY --from=prep /repo/out/full/turbo.json ./turbo.json

# Copy backend app source (this is the layer that changes most frequently)
COPY --from=prep /repo/out/full/apps/backend ./apps/backend

# Build only the backend app
RUN npx turbo run build --filter=backend

# Runner stage: minimal runtime image
FROM node:25-alpine AS runner
WORKDIR /repo/apps/backend
ENV NODE_ENV=production

# Copy only necessary artifacts (not entire packages directory)
COPY --from=app-builder /repo/apps/backend/dist ./dist
COPY --from=package-builder /repo/packages/database/dist /repo/packages/database/dist
COPY --from=package-builder /repo/packages/database/generated/prisma /repo/packages/database/generated/prisma
COPY --from=package-builder /repo/packages/database/prisma/schema.prisma /repo/packages/database/prisma/schema.prisma
COPY --from=package-builder /repo/packages/database/prisma/migrations /repo/packages/database/prisma/migrations
COPY --from=package-builder /repo/packages/database/prisma/seed.js /repo/packages/database/prisma/seed.js
COPY --from=package-builder /repo/packages/database/package.json /repo/packages/database/package.json
COPY --from=package-builder /repo/packages/contracts/dist /repo/packages/contracts/dist
COPY --from=package-builder /repo/packages/contracts/package.json /repo/packages/contracts/package.json
COPY --from=package-builder /repo/packages/common/dist /repo/packages/common/dist
COPY --from=package-builder /repo/packages/common/package.json /repo/packages/common/package.json
COPY --from=package-builder /repo/packages/utils/dist /repo/packages/utils/dist
COPY --from=package-builder /repo/packages/utils/package.json /repo/packages/utils/package.json
# Copy production dependencies
COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=app-builder /repo/package.json /repo/package.json

# Copy entrypoint script and make it executable
COPY docker/entrypoint.backend.sh /repo/docker/entrypoint.backend.sh
RUN chmod +x /repo/docker/entrypoint.backend.sh

# Use non-root user
USER node

EXPOSE 3000
# Health check for backend API
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

ENTRYPOINT ["/bin/sh", "/repo/docker/entrypoint.backend.sh"]


