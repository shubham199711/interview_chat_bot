# Use Node.js base image
FROM node:18-alpine

WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the Vite dev server port (default is 5173)
EXPOSE 5173

# Run Vite dev server
CMD ["npm", "run", "dev"]
