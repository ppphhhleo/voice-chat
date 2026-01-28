#!/bin/bash
# Check if POC is ready to test

echo "🧪 Checking POC Setup..."
echo ""

# Check if dance.gltf exists
if [ -f "public/motions/dance.gltf" ]; then
    echo "✅ dance.gltf found"
    FILE_SIZE=$(du -h public/motions/dance.gltf | cut -f1)
    echo "   Size: $FILE_SIZE"

    # Quick validation
    if grep -q "animations" public/motions/dance.gltf 2>/dev/null; then
        echo "✅ Animation data detected"
    else
        echo "⚠️  Warning: No animation data found in GLTF"
        echo "   File may be corrupted or conversion failed"
    fi
else
    echo "❌ dance.gltf NOT found"
    echo ""
    echo "📝 Setup Instructions:"
    echo "   1. Go to: https://products.aspose.app/3d/conversion/fbx-to-gltf"
    echo "   2. Upload: public/motions/dance.fbx"
    echo "   3. Download converted file"
    echo "   4. Save as: public/motions/dance.gltf"
    echo ""
    exit 1
fi

echo ""

# Check if source FBX exists
if [ -f "public/motions/dance.fbx" ]; then
    echo "✅ dance.fbx (source) found"
    FBX_SIZE=$(du -h public/motions/dance.fbx | cut -f1)
    echo "   Size: $FBX_SIZE"
else
    echo "⚠️  dance.fbx (source) not found"
fi

echo ""

# Check if dev server is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Dev server is running on port 3000"
    echo "   → Open: http://localhost:3000"
else
    echo "❌ Dev server not running"
    echo "   → Start with: npm run dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "POC Status: Ready to test! 🚀"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000 (if not already open)"
echo "  2. Look for '🧪 Animation Test Panel (POC)' in sidebar"
echo "  3. Wait for avatar to load (green indicator)"
echo "  4. Select 'Dance' and click ▶ Play"
echo ""
