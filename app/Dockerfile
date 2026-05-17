FROM node:22-slim AS base
RUN corepack enable
WORKDIR /workspace
COPY package.json pnpm-*.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm i --frozen-lockfile --ignore-scripts

FROM base AS build
WORKDIR /workspace/apps/web
COPY tsconfig.base.json /workspace/
COPY apps/web/ ./
RUN pnpm build
RUN pnpm --prod deploy /app

FROM node:22-slim AS production
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
EXPOSE 3000
ENV NODE_ENV=production
USER node
CMD ["./node_modules/.bin/react-router-serve", "./build/server/index.js"]

HEALTHCHECK --start-period=10s --interval=10s --timeout=2s \
  CMD node -e "require('http').get('http://localhost:3000/_health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
