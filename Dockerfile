# Stage 1: Build the application
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
# Install Nest CLI globally
RUN npm install -g @nestjs/cli
RUN npm install -g pnpm


# Copy the rest of the application code
COPY package*.json ./
RUN pnpm install
# Build the NestJS application
COPY . .
RUN pnpm run build

# Stage 2: Run the application
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Install pnpm and Nest CLI globally to run production
RUN npm install -g pnpm @nestjs/cli

# Copy package.json and package-lock.json to install only production dependencies
COPY package*.json ./

# Install only the production dependencies
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy the build files from the previous stage
COPY --from=builder /app/dist ./dist

# Copy any other necessary files (like config, etc.)
COPY tsconfig.json ./
COPY .env ./

# Expose the application port
EXPOSE 8080

# Command to run the NestJS application
CMD ["nest", "start"]

