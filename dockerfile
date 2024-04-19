# Use a Node.js base image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Download and install Rhubarb-Lip-Sync for Linux
# The provided URL is just an example, and you need to replace it with the actual Linux release URL.
RUN wget https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip \
    && unzip rhubarb-lip-sync-1.13.0-linux.zip -d rhubarb \
    && mv rhubarb/rhubarb /usr/local/bin/ \
    && chmod +x /usr/local/bin/rhubarb \
    && rm -rf rhubarb-lip-sync-1.13.0-linux.zip rhubarb

# Install node modules
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
