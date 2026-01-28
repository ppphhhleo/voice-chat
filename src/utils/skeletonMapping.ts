/**
 * Bone mapping between HY-Motion skeleton (Mixamo-based) and avatar skeleton
 *
 * HY-Motion uses Mixamo rig with "mixamorig:" prefix
 * Our avatar uses standard humanoid naming without prefix
 */

export interface BoneMapping {
  source: string;    // HY-Motion bone name (with mixamorig: prefix)
  target: string;    // Avatar bone name (without prefix)
  optional?: boolean; // Bones that may not exist in source
}

/**
 * Core body bone mapping (required for retargeting)
 * Maps main skeletal structure from HY-Motion to avatar
 */
export const CORE_BONE_MAPPING: BoneMapping[] = [
  // Pelvis & Spine
  { source: 'mixamorig:Hips', target: 'Hips' },
  { source: 'mixamorig:Spine', target: 'Spine' },
  { source: 'mixamorig:Spine1', target: 'Spine1' },
  { source: 'mixamorig:Spine2', target: 'Spine2' },

  // Head & Neck
  { source: 'mixamorig:Neck', target: 'Neck' },
  { source: 'mixamorig:Head', target: 'Head' },
  { source: 'mixamorig:HeadTop_End', target: 'HeadTop_End', optional: true },

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

/**
 * Optional finger bone mapping (if HY-Motion includes finger data)
 * Avatar has full finger articulation, but HY-Motion may not animate them
 */
export const FINGER_BONE_MAPPING: BoneMapping[] = [
  // Left Hand Fingers
  { source: 'mixamorig:LeftHandThumb1', target: 'LeftHandThumb1', optional: true },
  { source: 'mixamorig:LeftHandThumb2', target: 'LeftHandThumb2', optional: true },
  { source: 'mixamorig:LeftHandThumb3', target: 'LeftHandThumb3', optional: true },
  { source: 'mixamorig:LeftHandThumb4', target: 'LeftHandThumb4', optional: true },

  { source: 'mixamorig:LeftHandIndex1', target: 'LeftHandIndex1', optional: true },
  { source: 'mixamorig:LeftHandIndex2', target: 'LeftHandIndex2', optional: true },
  { source: 'mixamorig:LeftHandIndex3', target: 'LeftHandIndex3', optional: true },
  { source: 'mixamorig:LeftHandIndex4', target: 'LeftHandIndex4', optional: true },

  { source: 'mixamorig:LeftHandMiddle1', target: 'LeftHandMiddle1', optional: true },
  { source: 'mixamorig:LeftHandMiddle2', target: 'LeftHandMiddle2', optional: true },
  { source: 'mixamorig:LeftHandMiddle3', target: 'LeftHandMiddle3', optional: true },
  { source: 'mixamorig:LeftHandMiddle4', target: 'LeftHandMiddle4', optional: true },

  { source: 'mixamorig:LeftHandRing1', target: 'LeftHandRing1', optional: true },
  { source: 'mixamorig:LeftHandRing2', target: 'LeftHandRing2', optional: true },
  { source: 'mixamorig:LeftHandRing3', target: 'LeftHandRing3', optional: true },
  { source: 'mixamorig:LeftHandRing4', target: 'LeftHandRing4', optional: true },

  { source: 'mixamorig:LeftHandPinky1', target: 'LeftHandPinky1', optional: true },
  { source: 'mixamorig:LeftHandPinky2', target: 'LeftHandPinky2', optional: true },
  { source: 'mixamorig:LeftHandPinky3', target: 'LeftHandPinky3', optional: true },
  { source: 'mixamorig:LeftHandPinky4', target: 'LeftHandPinky4', optional: true },

  // Right Hand Fingers
  { source: 'mixamorig:RightHandThumb1', target: 'RightHandThumb1', optional: true },
  { source: 'mixamorig:RightHandThumb2', target: 'RightHandThumb2', optional: true },
  { source: 'mixamorig:RightHandThumb3', target: 'RightHandThumb3', optional: true },
  { source: 'mixamorig:RightHandThumb4', target: 'RightHandThumb4', optional: true },

  { source: 'mixamorig:RightHandIndex1', target: 'RightHandIndex1', optional: true },
  { source: 'mixamorig:RightHandIndex2', target: 'RightHandIndex2', optional: true },
  { source: 'mixamorig:RightHandIndex3', target: 'RightHandIndex3', optional: true },
  { source: 'mixamorig:RightHandIndex4', target: 'RightHandIndex4', optional: true },

  { source: 'mixamorig:RightHandMiddle1', target: 'RightHandMiddle1', optional: true },
  { source: 'mixamorig:RightHandMiddle2', target: 'RightHandMiddle2', optional: true },
  { source: 'mixamorig:RightHandMiddle3', target: 'RightHandMiddle3', optional: true },
  { source: 'mixamorig:RightHandMiddle4', target: 'RightHandMiddle4', optional: true },

  { source: 'mixamorig:RightHandRing1', target: 'RightHandRing1', optional: true },
  { source: 'mixamorig:RightHandRing2', target: 'RightHandRing2', optional: true },
  { source: 'mixamorig:RightHandRing3', target: 'RightHandRing3', optional: true },
  { source: 'mixamorig:RightHandRing4', target: 'RightHandRing4', optional: true },

  { source: 'mixamorig:RightHandPinky1', target: 'RightHandPinky1', optional: true },
  { source: 'mixamorig:RightHandPinky2', target: 'RightHandPinky2', optional: true },
  { source: 'mixamorig:RightHandPinky3', target: 'RightHandPinky3', optional: true },
  { source: 'mixamorig:RightHandPinky4', target: 'RightHandPinky4', optional: true },
];

/**
 * Complete bone mapping (core + fingers)
 */
export const BONE_MAPPING = [...CORE_BONE_MAPPING, ...FINGER_BONE_MAPPING];

/**
 * Create a mapping dictionary for quick lookups
 */
export function createBoneMappingDict(): Map<string, string> {
  const dict = new Map<string, string>();
  BONE_MAPPING.forEach(mapping => {
    dict.set(mapping.source, mapping.target);
  });
  return dict;
}

/**
 * Get target bone name for a source bone
 */
export function getTargetBone(sourceBone: string): string | null {
  const mapping = BONE_MAPPING.find(m => m.source === sourceBone);
  return mapping ? mapping.target : null;
}

/**
 * Check if a bone mapping is optional
 */
export function isBoneOptional(sourceBone: string): boolean {
  const mapping = BONE_MAPPING.find(m => m.source === sourceBone);
  return mapping?.optional || false;
}
