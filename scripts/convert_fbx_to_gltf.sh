#!/bin/bash
# Convert FBX to GLTF using fbx2gltf
# Usage: ./scripts/convert_fbx_to_gltf.sh <input.fbx> [output.gltf]

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <input.fbx> [output.gltf]"
    echo "Example: $0 public/motions/dance.fbx public/motions/dance.gltf"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${INPUT_FILE%.fbx}.gltf}"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

# Check for fbx2gltf (local or global)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FBX2GLTF="${SCRIPT_DIR}/../bin/fbx2gltf"

if [ ! -f "$FBX2GLTF" ]; then
    # Try global installation
    if command -v fbx2gltf &> /dev/null; then
        FBX2GLTF="fbx2gltf"
    else
        echo "Error: fbx2gltf not found!"
        echo "Install it by running: ./scripts/install_fbx2gltf_local.sh"
        exit 1
    fi
fi

echo "Converting FBX to GLTF..."
echo "  Input:  $INPUT_FILE"
echo "  Output: $OUTPUT_FILE"

"$FBX2GLTF" -i "$INPUT_FILE" -o "$OUTPUT_FILE" --binary

echo "✓ Conversion complete!"
echo ""
echo "To analyze the skeleton, run:"
echo "  npx tsx scripts/analyze_glb_skeleton.ts \"$OUTPUT_FILE\""
