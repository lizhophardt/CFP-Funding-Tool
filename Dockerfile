# Use Node.js 18 LTS as base image with specific digest for security
FROM node:18-alpine@sha256:17514b20acef0e79691285e7a59f3ae561f7a1702a9adc72a515aef23f326729

# Install security updates and minimal tools
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev deps for building)
RUN npm ci

# Copy source code (excluding frontend files)
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create non-root user for security with locked account
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -s /sbin/nologin

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/data /tmp/app && \
    chown -R nodejs:nodejs /app /tmp/app && \
    chmod -R 755 /app && \
    chmod 1777 /tmp/app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check using Node.js instead of curl for security
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/airdrop/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly and start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
