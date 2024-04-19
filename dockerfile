# Use a Node.js base image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Install ffmpeg and Rhubarb-Lip-Sync dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    wget \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Download and install ffmpeg
RUN wget https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.tar.xz \
    && tar -xJf ffmpeg-master-latest-win64-gpl.tar.xz \
    && mv ffmpeg-master-latest-win64-gpl/ffmpeg /usr/local/bin/ \
    && chmod +x /usr/local/bin/ffmpeg \
    && rm -rf ffmpeg-master-latest-win64-gpl.tar.xz ffmpeg-master-latest-win64-gpl

# Download and install Rhubarb-Lip-Sync
RUN wget https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/1.13.0/rhubarb-lip-sync-1.13.0-win64.zip \
    && unzip rhubarb-lip-sync-1.13.0-win64.zip -d rhubarb \
    && mv rhubarb/rhubarb /usr/local/bin/ \
    && chmod +x /usr/local/bin/rhubarb \
    && rm -rf rhubarb-lip-sync-1.13.0-win64.zip rhubarb

# Install node modules
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
