# Use a Node.js base image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app

# Install ffmpeg and Rhubarb-Lip-Sync dependenci
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    xz-utils \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Download and install FFmpeg via link
# RUN curl -L https://github.com/BtbN/FFmpeg-Builds/archive/refs/tags/latest.zip -o ffmpeg_latest.zip \
#     && unzip ffmpeg_latest.zip \
#     && mv FFmpeg-Builds-latest/ffmpeg /usr/local/bin/ \
#     && chmod +x /usr/local/bin/ffmpeg \
#     && rm -rf ffmpeg_latest.zip FFmpeg-Builds-latest


# Download and install FFmpeg via link
# RUN curl https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz \
#     && tar -xJf ffmpeg-master-latest-linux64-gpl.tar.xz \
#     && mv ffmpeg-master-latest-linux64-gpl/ffmpeg /usr/local/bin/ \
#     && chmod +x /usr/local/bin/ffmpeg \
#     && rm -rf ffmpeg-master-latest-linux64-gpl.tar.xz ffmpeg-master-latest-linux64-gpl

# # alternative method: Copy FFmpeg archive into the Docker image
# COPY ffmpeg-master-latest-linux64-gpl.tar.xz /usr/src/app/
# # alternative method continue: Extract and install FFmpeg
# RUN tar -xJf ffmpeg-master-latest-linux64-gpl.tar.xz \
#     && mv ffmpeg-master-latest-linux64-gpl/ffmpeg /usr/local/bin/ \
#     && chmod +x /usr/local/bin/ffmpeg \
#     && rm -rf ffmpeg-master-latest-linux64-gpl.tar.xz ffmpeg-master-latest-linux64-gpl


# Download and install Rhubarb-Lip-Sync for Linux via link
RUN curl https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip \
    && unzip Rhubarb-Lip-Sync-1.13.0-Linux.zip -d rhubarb \
    && mv rhubarb/rhubarb /usr/local/bin/ \
    && chmod +x /usr/local/bin/rhubarb \
    && rm Rhubarb-Lip-Sync-1.13.0-Linux.zip

# Install node modules
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
