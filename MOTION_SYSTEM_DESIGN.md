# Personality-Driven Motion Generation System

## 📋 Overview

This document outlines the complete architecture for integrating HY-Motion-1.0 generated animations with your Three.js avatar system, driven by Big Five personality traits and voice characteristics.

---

## 🎯 System Architecture

```
User Interface (Personality Sliders + Voice Selection)
  ↓
Motion Prompt Generator (BigFive → Motion Descriptions)
  ↓
HY-Motion-1.0 Generation (Text → FBX Animation)
  ↓
FBX to GLTF Conversion
  ↓
Skeleton Retargeting (HY-Motion bones → Avatar bones)
  ↓
Three.js Animation Player (AnimationMixer)
```

---

## 🦴 Skeleton Analysis Results

### Your Avatar Skeleton (brunette.glb)

**Structure:**
- **Total Bones:** 67
- **Root Bone:** Hips
- **Skeleton Type:** Standard humanoid with full finger articulation
- **Naming Convention:** Simple names (e.g., "LeftArm", "RightHand")

**Key Bones:**
```
Hips (root)
├── Spine → Spine1 → Spine2
│   ├── Neck → Head
│   ├── LeftShoulder → LeftArm → LeftForeArm → LeftHand (+ 5 fingers × 4 joints)
│   └── RightShoulder → RightArm → RightForeArm → RightHand (+ 5 fingers × 4 joints)
├── LeftUpLeg → LeftLeg → LeftFoot → LeftToeBase
└── RightUpLeg → RightLeg → RightFoot → RightToeBase
```

**Full Bone List:** (see `public/avatars/brunette_skeleton.json`)

### HY-Motion-1.0 Skeleton (Expected)

HY-Motion-1.0 typically outputs **Mixamo-compatible skeletons** with the following structure:

**Expected Naming:**
```
mixamorig:Hips
├── mixamorig:Spine → mixamorig:Spine1 → mixamorig:Spine2
│   ├── mixamorig:Neck → mixamorig:Head
│   ├── mixamorig:LeftShoulder → mixamorig:LeftArm → mixamorig:LeftForeArm → mixamorig:LeftHand
│   └── mixamorig:RightShoulder → mixamorig:RightArm → mixamorig:RightForeArm → mixamorig:RightHand
├── mixamorig:LeftUpLeg → mixamorig:LeftLeg → mixamorig:LeftFoot → mixamorig:LeftToeBase
└── mixamorig:RightUpLeg → mixamorig:RightLeg → mixamorig:RightFoot → mixamorig:RightToeBase
```

**Key Differences:**
1. HY-Motion uses "mixamorig:" prefix
2. HY-Motion typically has fewer bones (no individual finger joints)
3. Bone hierarchy is identical for core body parts

---

## 🔄 Bone Mapping Configuration

### Mapping Strategy

**File:** `src/utils/skeletonMapping.ts`

```typescript
export interface BoneMapping {
  source: string;    // HY-Motion bone name (with mixamorig: prefix)
  target: string;    // Avatar bone name (without prefix)
  optional?: boolean; // Bones that may not exist in source
}

// Core body mapping (required for retargeting)
export const CORE_BONE_MAPPING: BoneMapping[] = [
  // Pelvis & Spine
  { source: 'mixamorig:Hips', target: 'Hips' },
  { source: 'mixamorig:Spine', target: 'Spine' },
  { source: 'mixamorig:Spine1', target: 'Spine1' },
  { source: 'mixamorig:Spine2', target: 'Spine2' },

  // Head & Neck
  { source: 'mixamorig:Neck', target: 'Neck' },
  { source: 'mixamorig:Head', target: 'Head' },

  // Left Arm
  { source: 'mixamorig:LeftShoulder', target: 'LeftShoulder' },
  { source: 'mixamorig:LeftArm', target: 'LeftArm' },
  { source: 'mixamorig:LeftForeArm', target: 'LeftForeArm' },
  { source: 'mixamorig:LeftHand', target: 'LeftHand' },

  // Right Arm
  { source: 'mixamorig:RightShoulder', target: 'RightShoulder' },
  { source: 'mixamorig:RightArm', target: 'RightArm' },
  { source: 'mixamorig:RightForeArm', target: 'RightForeArm' },
  { source: 'mixamorig:RightHand', target: 'RightHand' },

  // Left Leg
  { source: 'mixamorig:LeftUpLeg', target: 'LeftUpLeg' },
  { source: 'mixamorig:LeftLeg', target: 'LeftLeg' },
  { source: 'mixamorig:LeftFoot', target: 'LeftFoot' },
  { source: 'mixamorig:LeftToeBase', target: 'LeftToeBase' },

  // Right Leg
  { source: 'mixamorig:RightUpLeg', target: 'RightUpLeg' },
  { source: 'mixamorig:RightLeg', target: 'RightLeg' },
  { source: 'mixamorig:RightFoot', target: 'RightFoot' },
  { source: 'mixamorig:RightToeBase', target: 'RightToeBase' },
];

// Optional finger mapping (if HY-Motion includes finger data)
export const FINGER_BONE_MAPPING: BoneMapping[] = [
  // Left Hand Fingers
  { source: 'mixamorig:LeftHandThumb1', target: 'LeftHandThumb1', optional: true },
  { source: 'mixamorig:LeftHandThumb2', target: 'LeftHandThumb2', optional: true },
  { source: 'mixamorig:LeftHandThumb3', target: 'LeftHandThumb3', optional: true },
  { source: 'mixamorig:LeftHandIndex1', target: 'LeftHandIndex1', optional: true },
  { source: 'mixamorig:LeftHandIndex2', target: 'LeftHandIndex2', optional: true },
  { source: 'mixamorig:LeftHandIndex3', target: 'LeftHandIndex3', optional: true },
  // ... (complete mapping in actual implementation)
];

export const BONE_MAPPING = [...CORE_BONE_MAPPING, ...FINGER_BONE_MAPPING];
```

---

## 🎨 Motion Prompt Generation

### Personality → Motion Mapping

**File:** `src/utils/motionPrompts.ts`

#### 1. **Idle/Base Postures** (Loop: Yes, Duration: 4-6s)

| Personality Profile | Motion ID | Prompt |
|---------------------|-----------|--------|
| **High Extraversion** (>70) | `idle_confident` | "person standing confidently with open posture, chest out, relaxed shoulders, subtle weight shifts, energetic presence" |
| **Low Extraversion** (<30) | `idle_reserved` | "person standing quietly with closed posture, arms close to body, minimal movement, introverted stance" |
| **High Neuroticism** (>60) | `idle_nervous` | "person standing nervously with subtle fidgeting, restless weight shifts, anxious energy" |
| **Low Neuroticism** (<30) | `idle_calm` | "person standing calmly with stable posture, peaceful presence, centered breathing" |
| **High Conscientiousness** (>70) | `idle_professional` | "person standing professionally with upright posture, precise stance, disciplined presence" |
| **High Openness** (>70) | `idle_curious` | "person standing with curious posture, looking around, open to surroundings, engaged presence" |

#### 2. **Expressive Gestures** (Loop: No, Duration: 2-4s)

| Personality Profile | Motion ID | Prompt |
|---------------------|-----------|--------|
| **High Extraversion + Agreeableness** | `gesture_enthusiastic` | "person explaining enthusiastically with wide animated hand gestures, forward lean, engaging movement" |
| **Low Agreeableness** | `gesture_analytical` | "person explaining analytically with precise measured hand gestures, pointing, counting on fingers" |
| **High Openness** | `thinking_creative` | "person thinking creatively, looking up and around, hand on chin, contemplative expressive movements" |
| **Low Openness** | `thinking_practical` | "person thinking practically, focused downward, hand on forehead, systematic consideration" |
| **High Agreeableness** | `gesture_welcoming` | "person making welcoming gesture with open arms, warm inviting posture, friendly movement" |
| **High Conscientiousness** | `gesture_organized` | "person gesturing in organized manner, structured hand movements, methodical explanation" |

#### 3. **Voice-Specific Motions**

| Voice | Personality | Motion ID | Prompt |
|-------|-------------|-----------|--------|
| **Ara** | Warm, friendly | `voice_ara_greeting` | "person greeting warmly with gentle wave, friendly smile posture, approachable movement" |
| **Rex** | Confident, clear | `voice_rex_presenting` | "person presenting confidently with strong gestures, authoritative stance, commanding presence" |
| **Sal** | Smooth, balanced | `voice_sal_explaining` | "person explaining smoothly with balanced gestures, harmonious movement, composed presence" |
| **Eve** | Energetic, upbeat | `voice_eve_excited` | "person showing excitement with bouncy movements, energetic gestures, upbeat posture" |
| **Leo** | Authoritative, strong | `voice_leo_commanding` | "person standing authoritatively with strong posture, powerful gestures, dominant presence" |

#### 4. **Emotional Expressions** (Synced with Mood System)

| Mood State | Motion ID | Prompt |
|------------|-----------|--------|
| **Happy** | `emotion_joyful` | "person expressing joy with raised shoulders, open arms, uplifted posture" |
| **Sad** | `emotion_dejected` | "person showing sadness with slumped shoulders, downward gaze, closed posture" |
| **Angry** | `emotion_tense` | "person showing tension with tight posture, clenched fists, forward-leaning aggression" |
| **Fear** | `emotion_defensive` | "person showing fear with defensive posture, withdrawn stance, protective movements" |
| **Love** | `emotion_affectionate` | "person showing affection with open welcoming posture, gentle gestures, warm presence" |
| **Neutral** | `emotion_composed` | "person standing composed with balanced neutral posture, calm professional presence" |

---

## 🔧 Implementation Steps

### **Step 1: Analyze HY-Motion Output** ✅ IN PROGRESS

**Task:** Verify the actual bone structure of `dance.fbx`

**Action Items:**
1. ✅ Analyzed avatar skeleton (67 bones, standard humanoid)
2. ⏳ Need to convert `dance.fbx` to GLTF to analyze HY-Motion skeleton
3. ⏳ Create actual bone mapping based on comparison

**Tools Needed:**
- Option A: Install Blender + use Python script
- Option B: Use online FBX to GLTF converter (e.g., https://products.aspose.app/3d/conversion/fbx-to-gltf)
- Option C: Use fbx2gltf CLI tool

### **Step 2: Build Motion Prompt Generator** ⏳ NEXT

**File:** `src/utils/motionPrompts.ts`

**Implementation:**
```typescript
export function generateMotionPrompts(
  traits: BigFive,
  voice: Voice
): MotionPrompt[] {
  // Generate 5-10 motion prompts based on personality
  // Return array of prompts for UI selection
}
```

### **Step 3: Create Retargeting Pipeline** ⏳

**Components:**
1. FBX → GLTF conversion script
2. Skeleton retargeting script (maps bone animations)
3. Animation export and optimization

### **Step 4: Build UI Components** ⏳

**Components:**
1. "Generate Behaviors" button
2. Motion prompt selector (checkboxes)
3. Motion preview/playback controls
4. Motion library manager

### **Step 5: Integrate with Avatar System** ⏳

**Integration:**
1. Access TalkingHead's Three.js scene
2. Create AnimationMixer for avatar
3. Load and play retargeted GLTF animations
4. Blend with existing lipsync and gestures

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "three": "^0.182.0",  // ✅ Already installed
    "@met4citizen/talkinghead": "^1.7.0"  // ✅ Already installed
  },
  "devDependencies": {
    "tsx": "^4.x",  // ✅ Installed
    "@gltf-transform/core": "^4.x",  // ✅ Installed
    "@gltf-transform/extensions": "^4.x",  // ✅ Installed
    "@types/three": "^0.182.0"  // ✅ Installed
  }
}
```

**External Tools:**
- **HY-Motion-1.0**: For motion generation (24GB+ VRAM)
- **Blender 3.x+** (optional): For FBX conversion
- **fbx2gltf** (alternative): CLI FBX converter

---

## 🎮 User Workflow

1. **Adjust Personality Sliders** (BigFive traits: 0-100)
2. **Select Voice** (Ara, Rex, Sal, Eve, Leo)
3. **Click "Generate Behaviors"** button
   - System generates 5-10 motion prompt candidates
   - Shows prompts with descriptions in UI
4. **Select Motions** to generate (checkboxes)
5. **Click "Generate Motions"** button
   - Calls HY-Motion-1.0 for each prompt
   - Converts FBX → GLTF
   - Retargets to avatar skeleton
   - Saves to `/public/motions/`
6. **Preview & Apply** motions in avatar display
   - Motion selector dropdown
   - Real-time playback with Three.js AnimationMixer

---

## 🎯 Next Actions

### Immediate (Today):

1. **Convert dance.fbx to GLTF**
   - Use online converter or install fbx2gltf
   - Analyze HY-Motion skeleton structure
   - Verify bone naming conventions

2. **Create bone mapping configuration**
   - Based on actual HY-Motion skeleton
   - Implement `src/utils/skeletonMapping.ts`

3. **Implement motion prompt generator**
   - Create `src/utils/motionPrompts.ts`
   - Implement personality → prompt logic
   - Test with current traits

### Short-term (This Week):

4. **Build retargeting pipeline**
   - FBX conversion script
   - Bone remapping script
   - Test with dance.fbx

5. **Create UI components**
   - Motion generator UI
   - Motion selector
   - Preview controls

6. **Integrate with avatar**
   - AnimationMixer setup
   - Animation playback
   - Blending with existing system

---

## 📝 Notes

- **Skeleton Compatibility**: Your avatar has full finger articulation (67 bones), but HY-Motion likely only animates core body (20-30 bones). This is fine - fingers can remain static during full-body animations.

- **Animation Blending**: Three.js AnimationMixer supports blending multiple animations. You can blend:
  - Full-body motion (HY-Motion)
  - Hand gestures (existing TalkingHead)
  - Lipsync (existing TalkingHead)

- **Performance**: Pre-generate and cache animations rather than generating in real-time (HY-Motion takes 3-5+ seconds per motion).

- **Customization**: Users can edit motion prompts before generation, adjust animation speed, and loop settings.

---

## 🔗 Resources

- **HY-Motion-1.0**: https://github.com/Tencent-Hunyuan/HY-Motion-1.0
- **Three.js Animation Docs**: https://threejs.org/docs/#api/en/animation/AnimationMixer
- **GLTF-Transform**: https://gltf-transform.dev/
- **Avatar Skeleton JSON**: `public/avatars/brunette_skeleton.json`
- **Analysis Scripts**:
  - `scripts/analyze_glb_skeleton.ts` ✅
  - `scripts/analyze_fbx_skeleton.py` (needs Blender)

---

**Status:** Architecture complete, ready for implementation 🚀
