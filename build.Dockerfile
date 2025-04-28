# Stage 1: Build
FROM node:18.17.1-alpine AS build
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies
RUN npm install

# Stage 2: Runtime
FROM alpine:3.18
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache nodejs npm bash

# Create a new user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built files from stage 1
COPY --from=build /app ./

# Create directories and set permissions
RUN mkdir -p /app/test-reports \
    && chown -R appuser:appgroup /app

# Set user
USER appuser