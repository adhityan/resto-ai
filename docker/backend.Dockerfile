#docker build -t docker.registry.home.adhityan.com/stripe-backend -f docker/backend.Dockerfile .
#docker push docker.registry.home.adhityan.com/stripe-backend
FROM node:24-alpine AS base

# Dependencies stage: install ALL dependencies (cached unless package.json changes)
FROM base AS deps
WORKDIR /repo
ENV CI=1

# Copy root manifests
COPY package.json package-lock.json turbo.json ./

# Copy only package.json files from all packages (not source code!)
COPY packages/common/package.json ./packages/common/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# Copy package.json from apps
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/admin/package.json ./apps/admin/package.json

# Install all dependencies (this layer is cached unless package.json changes)
RUN npm ci

# Production deps stage: install only production dependencies for runtime
FROM base AS prod-deps
WORKDIR /repo
ENV CI=1

COPY package.json package-lock.json turbo.json ./
COPY packages/common/package.json ./packages/common/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/admin/package.json ./apps/admin/package.json

RUN npm ci --omit=dev --omit=optional

# Package builder stage: build dependency packages (cached unless package source changes)
FROM base AS package-builder
WORKDIR /repo
ENV CI=1
RUN apk add --no-cache libc6-compat openssl

# Copy root files
COPY package.json package-lock.json turbo.json ./

# Copy dependencies from deps stage
COPY --from=deps /repo/node_modules ./node_modules

# Copy package.json files
COPY packages/common/package.json ./packages/common/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json

# Copy package source code
COPY packages/common ./packages/common
COPY packages/contracts ./packages/contracts
COPY packages/database ./packages/database
COPY packages/utils ./packages/utils
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config

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

# Copy root files
COPY package.json package-lock.json turbo.json ./

# Copy dependencies
COPY --from=deps /repo/node_modules ./node_modules

# Copy built packages from package-builder
COPY --from=package-builder /repo/packages/common ./packages/common
COPY --from=package-builder /repo/packages/contracts ./packages/contracts
COPY --from=package-builder /repo/packages/database ./packages/database
COPY --from=package-builder /repo/packages/utils ./packages/utils
COPY --from=package-builder /repo/packages/typescript-config ./packages/typescript-config
COPY --from=package-builder /repo/packages/eslint-config ./packages/eslint-config

# Copy backend app source (this is the layer that changes most frequently)
COPY apps/backend ./apps/backend

# Build only the backend app
RUN npx turbo run build --filter=backend

# Runner stage: minimal runtime image
FROM node:24-alpine AS runner
WORKDIR /repo/apps/backend
ENV NODE_ENV=production

# Copy only necessary artifacts (not entire packages directory)
COPY --from=app-builder /repo/apps/backend/dist ./dist
COPY --from=package-builder /repo/packages/database/dist /repo/packages/database/dist
COPY --from=package-builder /repo/packages/database/generated /repo/packages/database/generated
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


