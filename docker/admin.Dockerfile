#docker build -t docker.registry.home.adhityan.com/resto-ai-admin -f docker/admin.Dockerfile .
#docker push docker.registry.home.adhityan.com/resto-ai-admin

FROM node:25-alpine AS base

# Dependencies stage: install all dependencies (cached unless package.json changes)
FROM base AS deps
WORKDIR /app
ENV CI=1

# Install dependencies required by Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy root package files and workspace configuration
COPY package.json package-lock.json turbo.json ./

# Copy all package.json files for dependency resolution
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/common/package.json ./packages/common/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json

# Install all dependencies (this layer is cached unless package.json changes)
RUN npm ci

# Package builder stage: build dependency packages (cached unless package source changes)
FROM base AS package-builder
WORKDIR /app
ENV CI=1

RUN apk add --no-cache openssl libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json /app/turbo.json ./

# Copy package.json files
COPY packages/database/package.json ./packages/database/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json

# Copy package source files
COPY packages/database/ ./packages/database/
COPY packages/contracts/ ./packages/contracts/
COPY packages/typescript-config/ ./packages/typescript-config/
COPY packages/eslint-config/ ./packages/eslint-config/

# Generate Prisma client and build packages (cached unless package source changes)
RUN npm run db:generate --workspace=@repo/database
RUN npm run build --workspace=@repo/database
RUN npm run build --workspace=@repo/contracts

# App builder stage: build admin app (only invalidated when admin source changes)
FROM base AS app-builder
WORKDIR /app
ENV VITE_BASE_URL=https://resto-ai.adhityan.com/api
ENV VITE_LIVEKIT_URL=wss://restoai-tt7nk4br.livekit.cloud

RUN apk add --no-cache openssl libc6-compat

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json /app/turbo.json ./

# Copy built packages from package-builder
COPY --from=package-builder /app/packages/database ./packages/database
COPY --from=package-builder /app/packages/contracts ./packages/contracts
COPY --from=package-builder /app/packages/typescript-config ./packages/typescript-config
COPY --from=package-builder /app/packages/eslint-config ./packages/eslint-config

# Copy admin app source (this is the layer that changes most frequently)
COPY apps/admin/ ./apps/admin/

# Build the admin app (creates dist/ folder with static files)
RUN cd apps/admin && npx vite build

# Production stage - serve static files with nginx
FROM nginx:alpine

# Copy built static files from app-builder
COPY --from=app-builder /app/apps/admin/dist /usr/share/nginx/html

# Copy custom nginx configuration (optional - creates a default if not exists)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


