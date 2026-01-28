#!/bin/bash
# Install fbx2gltf from GitHub releases
# https://github.com/facebookincubator/FBX2glTF

set -e

echo "Installing fbx2gltf..."

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    PLATFORM="mac";;
    Linux*)     PLATFORM="linux";;
    *)          echo "Unsupported OS: ${OS}"; exit 1;;
esac

# Latest version
VERSION="0.9.7"
DOWNLOAD_URL="https://github.com/facebookincubator/FBX2glTF/releases/download/v${VERSION}/FBX2glTF-${PLATFORM}-x64"

# Download directory
INSTALL_DIR="/usr/local/bin"
TEMP_FILE="/tmp/fbx2gltf"

echo "Downloading fbx2gltf v${VERSION} for ${PLATFORM}..."
curl -L -o "${TEMP_FILE}" "${DOWNLOAD_URL}"

echo "Installing to ${INSTALL_DIR}..."
chmod +x "${TEMP_FILE}"
sudo mv "${TEMP_FILE}" "${INSTALL_DIR}/fbx2gltf"

echo "✓ fbx2gltf installed successfully!"
echo "Testing installation..."
fbx2gltf --version || echo "Version command not supported, but binary is installed"

echo ""
echo "Usage: fbx2gltf -i input.fbx -o output.gltf"
