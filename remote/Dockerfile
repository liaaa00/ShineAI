FROM node:24-bookworm-slim
WORKDIR /app/remote/server
COPY remote/server/package.json remote/server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY remote/server/*.cjs ./
COPY remote/web/ /app/remote/web/
COPY src/shared/remote/ /app/src/shared/remote/
RUN mkdir -p /data && chown node:node /data
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=7940 SHINEAI_REMOTE_DATA_DIR=/data
EXPOSE 7940
CMD ["node", "index.cjs"]
