# 🧪 Custom Animation POC - Setup Guide

## What This Tests

This POC verifies that we can:
1. ✅ Access TalkingHead's internal avatar object
2. ✅ Load custom GLTF animations
3. ✅ Play them using a separate AnimationMixer
4. ✅ Without breaking existing lipsync/gestures/facial animations

---

## 🚀 Quick Start (5 minutes)

### Step 1: Convert dance.fbx to GLTF

**Option A: Online Converter (Easiest)**

1. Go to: https://products.aspose.app/3d/conversion/fbx-to-gltf
2. Upload: `public/motions/dance.fbx`
3. Click "Convert"
4. Download the result
5. Save as: `public/motions/dance.gltf`

**Option B: Alternative Converter**

1. Go to: https://anyconv.com/fbx-to-gltf-converter/
2. Upload and convert
3. Save to `public/motions/dance.gltf`

**Option C: Using fbx2gltf CLI (if installed)**

```bash
# If you installed fbx2gltf earlier
./bin/fbx2gltf -i public/motions/dance.fbx -o public/motions/dance.gltf
```

---

### Step 2: Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

### Step 3: Test the Animation

You should see a new **"🧪 Animation Test Panel (POC)"** in the right sidebar.

1. Wait for avatar to load
2. Status indicator should turn green (●)
3. Select "Dance" from dropdown
4. Click **▶ Play**
5. Watch the avatar perform the dance animation!

---

## 🔍 What to Look For

### ✅ Success Indicators:

- **Dance animation plays** on the avatar
- **Lipsync still works** when speaking
- **Hand gestures still work** (click Wave/Thinking presets)
- **Facial expressions work** (mood changes with personality)
- **No console errors** (check browser console)

### ⚠️ Potential Issues:

**"No animations found in /motions/dance.gltf"**
- The conversion didn't include animation data
- Try a different converter
- Verify the source FBX has animations

**"Could not access TalkingHead avatar"**
- TalkingHead library structure changed
- Check console for the avatar object structure
- May need to adjust access path

**Animation plays but avatar freezes**
- AnimationMixer conflict
- Both mixers fighting for control
- Need to adjust blending weights

---

## 🎛️ Test Panel Controls

### Buttons:

- **▶ Play** - Play selected animation
- **■ Stop** - Stop current animation (with fade out)
- **🔍 Test** - Dump debug info to console

### Debug Mode:

Click "Show Debug" to see:
- System ready status
- Currently playing status
- Head reference status
- Loaded animations count

---

## 📊 Expected Console Output

When you click "🔍 Test", you should see:

```
✓ Avatar accessed: Object
  Type: SkinnedMesh
  Has skeleton: true
✓ Custom AnimationMixer created
Loading animation: Dance from /motions/dance.gltf
✓ Animation loaded: {
  name: "Take 001",
  duration: 3.5,
  tracks: 25
}
✓ Animation playing: Dance {
  loop: true,
  duration: 3.5
}
```

---

## 🧩 Architecture

```
TalkingHead (Black Box)
    │
    ├─→ Built-in AnimationMixer (face, lipsync, hand gestures)
    │
    └─→ Avatar (SkinnedMesh)
            │
            └─→ Custom AnimationMixer (our full-body animations)
```

**Key Insight:** Both mixers operate on the **same skeleton**, but we're animating different bone hierarchies:
- TalkingHead → Face morphs + Hand gestures
- Custom Mixer → Full body (Hips, Spine, Legs)

---

## 📁 Files Created

```
src/
├── hooks/
│   └── useCustomAnimations.ts    ← Core animation system
├── components/
│   └── AnimationTestPanel.tsx    ← Test UI
└── app/
    └── page.tsx                   ← Updated (added test panel)

public/
└── motions/
    ├── dance.fbx                  ← Original HY-Motion output
    └── dance.gltf                 ← Converted (YOU CREATE THIS)
```

---

## 🐛 Troubleshooting

### Problem: Animation doesn't show up

**Check:**
1. File exists at `public/motions/dance.gltf`
2. Browser console for errors
3. Network tab shows GLTF loading
4. Click "🔍 Test" button to see system status

### Problem: Avatar breaks or freezes

**Check:**
1. Console for AnimationMixer errors
2. Try stopping animation (■ Stop button)
3. Refresh page to reset

### Problem: Can't access avatar

**Check:**
1. Avatar finished loading (green status indicator)
2. Console shows avatar access attempt
3. TalkingHead version matches expectations

---

## ✅ Success Criteria

If this POC works, we've proven:

1. ✅ Can access TalkingHead's avatar
2. ✅ Can load external GLTF animations
3. ✅ Can play custom animations without conflicts
4. ✅ Ready to build full motion generation system

---

## 🎯 Next Steps After POC

Once POC succeeds:

1. **Build BodyAnimationPlayer** - Production-ready version
2. **Create Motion Library** - Generate 20-30 personality-driven motions
3. **Integrate with Personality** - Auto-select animations based on traits
4. **Add to Gesture System** - Trigger from conversation analyzers
5. **Polish UI** - Motion selector, preview, customization

---

## 📝 Notes

- This is a **proof of concept** - not production code
- Test panel will be removed once system is proven
- Animation files are **not included** - you must convert them
- POC only tests playback - no retargeting yet

---

## 🆘 Need Help?

**Issue: Conversion failed**
→ Try different online converter or use Blender

**Issue: Animation plays but looks wrong**
→ May need skeleton retargeting (next phase)

**Issue: System doesn't initialize**
→ Check browser console for detailed errors

---

Ready to test! 🚀
