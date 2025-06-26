FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json .

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Run the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
