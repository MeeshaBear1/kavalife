# ---- Kava Life production image ----
# Single-stage build keeps Prisma CLI + tsx available at runtime so the
# container can run `prisma db push` + seed on first boot. Simple & reliable
# for a solo self-hoster; swap to a slim multi-stage build later if desired.
FROM node:24-bookworm-slim

# OpenSSL is required by Prisma's query engine.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps (incl. dev deps for prisma CLI + tsx). NODE_ENV is set after.
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build.
COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
