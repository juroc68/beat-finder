FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including tsx for running typescript)
RUN pnpm install --frozen-lockfile

# Copy the rest of the backend files
COPY . .

# Expose backend port
EXPOSE 5000

# Start command
CMD ["pnpm", "start"]
