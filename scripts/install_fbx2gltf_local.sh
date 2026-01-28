#!/bin/bash
# Install fbx2gltf locally (no sudo required)
# https://github.com/facebookincubator/FBX2glTF

set -e

echo "Installing fbx2gltf locally..."

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

# Install to project's bin directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="${SCRIPT_DIR}/../bin"
mkdir -p "${BIN_DIR}"

INSTALL_PATH="${BIN_DIR}/fbx2gltf"

echo "Downloading fbx2gltf v${VERSION} for ${PLATFORM}..."
curl -L -o "${INSTALL_PATH}" "${DOWNLOAD_URL}"

echo "Setting executable permissions..."
chmod +x "${INSTALL_PATH}"

echo "✓ fbx2gltf installed to: ${INSTALL_PATH}"
echo ""
echo "Add to PATH by running:"
echo "  export PATH=\"${BIN_DIR}:\$PATH\""
echo ""
echo "Or use directly:"
echo "  ${INSTALL_PATH} -i input.fbx -o output.gltf"
