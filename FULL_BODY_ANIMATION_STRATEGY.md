# Full-Body Animation Generation Strategy

## 🎯 Goal
Enable personality-driven full-body animations from HY-Motion-1.0 that work alongside existing TalkingHead hand gestures.

---

## 🔍 Current System Analysis

### What We Have:
```
TalkingHead Library (Black Box)
├── 3D Avatar Rendering (Three.js internally)
├── Lipsync System (face morphs + audio sync)
├── 8 Hand Gestures (pre-baked in GLB)
│   └── playGesture(name, duration, mirror, transition)
├── Mood System (8 facial expressions)
└── Camera Controls
```

### Key Constraints:
1. **TalkingHead is opaque** - Limited access to internal Three.js scene
2. **Gestures are GLB-embedded** - Pre-animated, not dynamically generated
3. **Single animation channel** - Can't easily blend custom animations
4. **Closed API** - No official way to add custom animations

---

## 💡 Possible Integration Approaches

### **Approach 1: Extend TalkingHead's Gesture System** ⭐ (RECOMMENDED)

**Concept:** Treat full-body animations as "new gesture types"

**How It Works:**
```typescript
// Instead of built-in gestures like "handup", "thumbup"
// Add custom full-body gestures: "confident_idle", "thinking_pose"

// TalkingHead internally uses Three.js AnimationMixer
// We can access the avatar's underlying Three.js object
const avatar = head.avatar;  // SkinnedMesh with animations

// Load new animation clips into the same mixer
const loader = new GLTFLoader();
const gltf = await loader.load('/motions/confident_idle.gltf');
const clip = gltf.animations[0];

// Add to avatar's animations array
avatar.animations.push(clip);

// Now can play like any other gesture
head.playAnimation('confident_idle', 5, false, 800);
```

**Pros:**
- ✅ Works with existing system
- ✅ Maintains lipsync and facial animations
- ✅ Gesture controller logic still applies
- ✅ Minimal code changes

**Cons:**
- ⚠️ Depends on TalkingHead's internal structure (may break on updates)
- ⚠️ Need to verify avatar object is accessible

**Implementation Steps:**
1. Access TalkingHead's internal avatar object
2. Load GLTF animation clips
3. Inject into avatar's animation list
4. Extend gesture system to include new animation names
5. Update gesture analyzers to suggest full-body motions

---

### **Approach 2: Parallel AnimationMixer (Layered Approach)**

**Concept:** Run custom AnimationMixer alongside TalkingHead for body animations

**How It Works:**
```
TalkingHead (Face + Hands)
    │
    └── Avatar SkinnedMesh
            │
            ├── Built-in AnimationMixer (face, hands, lipsync)
            │
            └── Custom AnimationMixer (full body from HY-Motion)
```

**Architecture:**
```typescript
// Get TalkingHead's avatar
const talkingHeadAvatar = head.avatar;

// Create separate mixer for full-body animations
const bodyAnimationMixer = new THREE.AnimationMixer(talkingHeadAvatar);

// Load HY-Motion animations
const gltf = await loader.load('/motions/dance.gltf');
const bodyClip = gltf.animations[0];
const bodyAction = bodyAnimationMixer.clipAction(bodyClip);

// Play body animation (doesn't interfere with TalkingHead)
bodyAction.play();

// Update both mixers in render loop
function animate() {
  const delta = clock.getDelta();
  head.update();  // TalkingHead's built-in update
  bodyAnimationMixer.update(delta);  // Our body animations
  requestAnimationFrame(animate);
}
```

**Animation Blending:**
```typescript
// Set animation weights for blending
// Body animation affects: Hips, Spine, Legs
// TalkingHead affects: Head, Face, Arms (hands gestures)

// Weight by bone hierarchy:
bodyAction.setEffectiveWeight(0.7);  // 70% body influence
handGestureAction.setEffectiveWeight(0.3);  // 30% hand gesture
```

**Pros:**
- ✅ Clean separation of concerns
- ✅ Full control over body animations
- ✅ TalkingHead remains untouched
- ✅ Can blend animations precisely

**Cons:**
- ⚠️ Complex animation blending logic
- ⚠️ Need to carefully avoid conflicts
- ⚠️ More render loop management

**Implementation Steps:**
1. Access TalkingHead's avatar mesh
2. Create separate AnimationMixer for body
3. Implement animation blending weights
4. Update render loop to update both mixers
5. Create API to trigger body animations

---

### **Approach 3: Custom Three.js Implementation (Full Replacement)**

**Concept:** Replace TalkingHead entirely with custom Three.js avatar system

**Pros:**
- ✅ Complete control
- ✅ No black-box issues
- ✅ Full animation flexibility

**Cons:**
- ❌ Lose TalkingHead's lipsync system (complex to rebuild)
- ❌ Lose facial animations and mood system
- ❌ Massive development effort
- ❌ Need to implement camera controls, lighting, etc.

**Verdict:** ❌ **NOT RECOMMENDED** - Too much to rebuild

---

### **Approach 4: Hybrid System (Best of Both Worlds)** ⭐⭐

**Concept:** Keep TalkingHead for face/lipsync, override body animations

**Architecture:**
```
User Input
    ↓
Conversation System
    ↓
    ├─→ TalkingHead.speak() ──→ Face + Lipsync
    │
    └─→ BodyAnimationPlayer ──→ Full Body Motions
              ↓
    Shared Avatar Skeleton
```

**How It Works:**
```typescript
class BodyAnimationPlayer {
  private mixer: THREE.AnimationMixer;
  private currentAction: THREE.AnimationAction | null;

  constructor(avatar: THREE.SkinnedMesh) {
    this.mixer = new THREE.AnimationMixer(avatar);
  }

  async playMotion(motionId: string, loop = false) {
    // Stop current body animation
    this.currentAction?.fadeOut(0.5);

    // Load new motion
    const gltf = await loader.load(`/motions/${motionId}.gltf`);
    const clip = gltf.animations[0];

    // Play on body bones only
    const action = this.mixer.clipAction(clip);
    action.setEffectiveWeight(0.8);  // Allow hand gestures to blend
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    action.fadeIn(0.5);
    action.play();

    this.currentAction = action;
  }

  update(delta: number) {
    this.mixer.update(delta);
  }
}

// Usage
const bodyPlayer = new BodyAnimationPlayer(head.avatar);

// Trigger from personality
if (traits.extraversion > 70) {
  bodyPlayer.playMotion('confident_idle', true);
}

// In render loop
function animate() {
  head.update();  // TalkingHead (face + hands)
  bodyPlayer.update(clock.getDelta());  // Body animations
  requestAnimationFrame(animate);
}
```

**Pros:**
- ✅ Keep TalkingHead's strengths (lipsync, face)
- ✅ Add custom body animations
- ✅ Clean API separation
- ✅ Animation blending possible

**Cons:**
- ⚠️ Need to manage two animation systems
- ⚠️ Potential conflicts between hand gestures and body

---

## 🎬 Recommended Solution: **Hybrid System (Approach 4)**

### Why This Works Best:

1. **Preserve Lipsync** - TalkingHead's lipsync is sophisticated and works well
2. **Extend Body Animations** - Add full-body without losing existing features
3. **Gradual Migration** - Can start simple, add complexity over time
4. **Clean API** - Separate body animation player with clear interface

---

## 🛠️ Implementation Plan

### **Phase 1: Proof of Concept** (2-3 hours)

**Goal:** Verify we can play custom animations on TalkingHead's avatar

```typescript
// 1. Access TalkingHead avatar
const avatar = head.avatar;

// 2. Manually convert dance.fbx to GLTF (use online tool once)
//    https://products.aspose.app/3d/conversion/fbx-to-gltf

// 3. Create simple test
const loader = new GLTFLoader();
const gltf = await loader.load('/motions/dance.gltf');
const mixer = new THREE.AnimationMixer(avatar);
const clip = gltf.animations[0];
const action = mixer.clipAction(clip);
action.play();

// 4. Update in render loop
function animate() {
  mixer.update(clock.getDelta());
  requestAnimationFrame(animate);
}
```

**Success Criteria:**
- ✅ Dance animation plays on avatar
- ✅ Doesn't break TalkingHead
- ✅ Can still trigger hand gestures

---

### **Phase 2: Body Animation Player** (4-6 hours)

**Create:** `src/utils/BodyAnimationPlayer.ts`

```typescript
export class BodyAnimationPlayer {
  private mixer: THREE.AnimationMixer;
  private currentAction: THREE.AnimationAction | null = null;
  private clock: THREE.Clock;

  constructor(avatar: THREE.SkinnedMesh) {
    this.mixer = new THREE.AnimationMixer(avatar);
    this.clock = new THREE.Clock();
  }

  async loadMotion(motionId: string): Promise<THREE.AnimationClip> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(`/motions/${motionId}.gltf`);
    return gltf.animations[0];
  }

  playMotion(
    clip: THREE.AnimationClip,
    options: {
      loop?: boolean;
      fadeIn?: number;
      fadeOut?: number;
      weight?: number;
    } = {}
  ) {
    const {
      loop = false,
      fadeIn = 0.5,
      fadeOut = 0.5,
      weight = 0.8
    } = options;

    // Fade out current animation
    if (this.currentAction) {
      this.currentAction.fadeOut(fadeOut);
    }

    // Create new action
    const action = this.mixer.clipAction(clip);
    action.setEffectiveWeight(weight);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    action.fadeIn(fadeIn);
    action.play();

    this.currentAction = action;

    return action;
  }

  stop(fadeOut = 0.5) {
    if (this.currentAction) {
      this.currentAction.fadeOut(fadeOut);
      this.currentAction = null;
    }
  }

  update() {
    const delta = this.clock.getDelta();
    this.mixer.update(delta);
  }
}
```

**Integration in AvatarDisplay:**

```typescript
const bodyPlayerRef = useRef<BodyAnimationPlayer | null>(null);

useEffect(() => {
  if (headRef.current) {
    bodyPlayerRef.current = new BodyAnimationPlayer(headRef.current.avatar);

    // Update loop
    const animate = () => {
      bodyPlayerRef.current?.update();
      requestAnimationFrame(animate);
    };
    animate();
  }
}, [headRef.current]);
```

---

### **Phase 3: Motion Prompt Generator** (2-3 hours)

**Create:** `src/utils/motionPrompts.ts`

```typescript
export interface MotionPrompt {
  id: string;
  label: string;
  prompt: string;  // Text for HY-Motion
  category: 'idle' | 'gesture' | 'expressive';
  duration: number;
  loop: boolean;
  personality?: {
    [K in keyof BigFive]?: { min: number; max: number };
  };
}

export function generateMotionPrompts(
  traits: BigFive,
  voice: Voice
): MotionPrompt[] {
  const prompts: MotionPrompt[] = [];

  // HIGH EXTRAVERSION - Confident, open postures
  if (traits.extraversion > 70) {
    prompts.push({
      id: 'idle_confident',
      label: 'Confident Stance',
      prompt: 'person standing confidently with open posture, chest out, relaxed shoulders, subtle weight shifts, energetic presence',
      category: 'idle',
      duration: 5,
      loop: true,
      personality: { extraversion: { min: 70, max: 100 } }
    });

    prompts.push({
      id: 'gesture_enthusiastic',
      label: 'Enthusiastic Explanation',
      prompt: 'person explaining enthusiastically with wide animated hand gestures, forward lean, engaging body language',
      category: 'gesture',
      duration: 3,
      loop: false,
      personality: { extraversion: { min: 70, max: 100 } }
    });
  }

  // LOW EXTRAVERSION - Reserved, closed postures
  if (traits.extraversion < 40) {
    prompts.push({
      id: 'idle_reserved',
      label: 'Reserved Stance',
      prompt: 'person standing quietly with closed posture, arms close to body, minimal movement, introverted presence',
      category: 'idle',
      duration: 5,
      loop: true,
      personality: { extraversion: { min: 0, max: 40 } }
    });
  }

  // HIGH OPENNESS - Creative, expressive movements
  if (traits.openness > 70) {
    prompts.push({
      id: 'thinking_creative',
      label: 'Creative Thinking',
      prompt: 'person thinking creatively, looking up and around, hand on chin, contemplative expressive movements, curious posture',
      category: 'expressive',
      duration: 4,
      loop: false,
      personality: { openness: { min: 70, max: 100 } }
    });
  }

  // HIGH CONSCIENTIOUSNESS - Professional, organized
  if (traits.conscientiousness > 70) {
    prompts.push({
      id: 'idle_professional',
      label: 'Professional Stance',
      prompt: 'person standing professionally with upright posture, precise stance, disciplined presence, organized body language',
      category: 'idle',
      duration: 5,
      loop: true,
      personality: { conscientiousness: { min: 70, max: 100 } }
    });
  }

  // HIGH NEUROTICISM - Nervous, fidgety
  if (traits.neuroticism > 60) {
    prompts.push({
      id: 'idle_nervous',
      label: 'Nervous Stance',
      prompt: 'person standing nervously with subtle fidgeting, restless weight shifts, anxious energy, uncertain posture',
      category: 'idle',
      duration: 4,
      loop: true,
      personality: { neuroticism: { min: 60, max: 100 } }
    });
  }

  // VOICE-SPECIFIC
  if (voice === 'Ara') {
    prompts.push({
      id: 'voice_ara_welcoming',
      label: 'Welcoming Gesture (Ara)',
      prompt: 'person making warm welcoming gesture with gentle open arms, friendly inviting posture, approachable movement',
      category: 'gesture',
      duration: 2.5,
      loop: false
    });
  }

  if (voice === 'Rex') {
    prompts.push({
      id: 'voice_rex_presenting',
      label: 'Authoritative Presenting (Rex)',
      prompt: 'person presenting confidently with strong clear gestures, authoritative stance, commanding presence',
      category: 'gesture',
      duration: 3,
      loop: false
    });
  }

  return prompts;
}
```

---

### **Phase 4: Motion Generation Workflow** (Design)

#### **Option A: Offline Generation (Practical)**

**Workflow:**
```
1. User adjusts personality sliders
2. Click "Generate Motion Candidates" button
3. System shows 5-10 motion prompts
4. User selects which to generate
5. User copies prompts to clipboard
6. User runs HY-Motion-1.0 locally:
   python local_infer.py --prompt "..." --output motion.fbx
7. User converts FBX→GLTF via online tool
8. User uploads GLTF to /public/motions/
9. System detects new motions and makes them available
```

**Pros:**
- ✅ No backend server needed
- ✅ No 24GB VRAM requirement on server
- ✅ User has full control
- ✅ Can review/edit before using

**Cons:**
- ⚠️ Manual steps required
- ⚠️ Need HY-Motion installed locally

---

#### **Option B: Semi-Automated (With Backend)**

**Workflow:**
```
1-4. Same as above
5. Click "Generate Motions" button
6. Frontend calls: POST /api/generate-motions
7. Backend queues generation job
8. Backend runs HY-Motion (needs GPU server)
9. Backend converts FBX→GLTF automatically
10. Backend saves to /public/motions/
11. Frontend polls for completion
12. New motions appear in UI
```

**Requirements:**
- Backend server with 24GB+ VRAM
- HY-Motion-1.0 installed
- FBX conversion tools (Blender/fbx2gltf)
- Job queue system

**Pros:**
- ✅ Fully automated
- ✅ Better UX
- ✅ Can cache common motions

**Cons:**
- ❌ Expensive GPU server
- ❌ Complex backend
- ❌ Slower generation (3-5s per motion)

---

#### **Option C: Pre-Generated Library (Fastest)**

**Workflow:**
```
1. Pre-generate 50-100 motions for all personality combinations
2. Store in /public/motions/ library
3. User selects personality → system picks best matches
4. Instant playback (no generation needed)
```

**Library Structure:**
```
/public/motions/
  ├── metadata.json
  ├── confident_idle.gltf
  ├── reserved_idle.gltf
  ├── creative_thinking.gltf
  ├── professional_stance.gltf
  ├── enthusiastic_gesture.gltf
  └── ... (50-100 motions)
```

**Pros:**
- ✅ Instant availability
- ✅ No generation latency
- ✅ Works offline
- ✅ Curated quality

**Cons:**
- ⚠️ Less personalization
- ⚠️ Fixed library (can't generate custom)
- ⚠️ Storage size (~5-10MB per motion)

---

## 🎯 Recommended Implementation Path

### **Minimal Viable Product (MVP):**

1. ✅ **Phase 1 POC** - Verify custom animations work (1 day)
2. ✅ **Phase 2 Body Player** - Create animation player system (1 day)
3. ✅ **Phase 3 Motion Prompts** - Generate personality-driven prompts (half day)
4. ✅ **Option C Library** - Pre-generate 20-30 core motions (1 day generation)
5. ✅ **UI Integration** - Add motion selector to avatar display (half day)

**Total: 3-4 days**

---

### **Future Enhancements:**

- **Custom Generation UI** - Allow users to generate their own motions
- **Motion Blending** - Smooth transitions between motions
- **Gesture Integration** - Trigger body motions from conversation analyzers
- **Motion Customization** - Adjust speed, intensity, blend
- **Multi-Motion Sequences** - Chain motions together

---

## 📊 Technical Specifications

### **Animation File Format:**
- **Source:** FBX from HY-Motion-1.0
- **Runtime:** GLTF/GLB for Three.js
- **Size:** ~500KB - 2MB per animation

### **Skeleton Requirements:**
- **HY-Motion Output:** Mixamo rig (mixamorig: prefix)
- **Avatar Skeleton:** 67 bones, humanoid structure
- **Mapping:** Required for retargeting (see skeletonMapping.ts)

### **Performance:**
- **Animation Playback:** ~0.5ms per frame (negligible)
- **Memory:** ~2-5MB per loaded animation
- **Max Concurrent:** 2-3 animations blending

### **Browser Compatibility:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🎬 Next Steps

1. **Immediate:** Create Phase 1 POC to verify approach
2. **Short-term:** Build Body Animation Player
3. **Medium-term:** Generate motion library
4. **Long-term:** Add real-time generation capability

---

**Ready to implement?** 🚀
