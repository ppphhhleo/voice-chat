/**
 * TalkingHead BVH Animation Integration
 * Integrates BVH animations with TalkingHead's animation system
 */

import * as THREE from 'three';
import { BVHLoader } from './BVHLoader';
import type { TalkingHead } from '@met4citizen/talkinghead';

/**
 * Per-bone bind-pose data needed for basis conversion
 */
interface BoneBindInfo {
  /** Bone's world-space bind rotation */
  avatarWorld: THREE.Quaternion;
  /** Parent's world-space bind rotation (identity for root) */
  parentWorld: THREE.Quaternion;
  /** The avatar bone name actually used (after potential left/right swap) */
  targetName: string;
}

export class TalkingHeadBVH {
  /** Cache bind-pose data per armature so we don't recompute for every BVH */
  private static bindCache = new WeakMap<any, Map<string, BoneBindInfo>>();

  /** Only swap arm chains (user request) */
  private static isArmJoint(name: string): boolean {
    // Cover common arm chain variants (shoulder, upper arm, elbow/forearm, wrist/hand)
    return /^(Left|Right)(Shoulder|Arm|UpperArm|ForeArm|Elbow|Hand|Wrist)/.test(name);
  }

  /**
   * Compute per-bone bind-pose world rotations to align BVH world-aligned basis
   * to the avatar's actual joint spaces. Cached per armature instance.
   */
  private static buildBindAlignment(armature: any, bvhRoot: any): Map<string, BoneBindInfo> {
    let cached = this.bindCache.get(armature);
    if (cached) return cached;

    // Ensure matrices are up to date for accurate world quaternions
    if (armature.updateMatrixWorld) {
      armature.updateMatrixWorld(true);
    }

    const map = new Map<string, BoneBindInfo>();

    // For now, force swap only for arm chain joints (Left<->Right) to fix mismatch
    const swapArms = true;

    const allBVHJoints = BVHLoader.getAllJoints(bvhRoot);
    for (const joint of allBVHJoints) {
      const targetName =
        swapArms && this.isArmJoint(joint.name)
          ? this.swapLeftRight(joint.name)
          : joint.name;
      const bone = armature.getObjectByName?.(targetName);
      if (!bone) continue;

      const avatarWorld = new THREE.Quaternion();
      bone.getWorldQuaternion(avatarWorld);

      const parentWorld = new THREE.Quaternion();
      if (bone.parent && bone.parent.getWorldQuaternion) {
        bone.parent.getWorldQuaternion(parentWorld);
      } else {
        parentWorld.identity();
      }

      map.set(joint.name, { avatarWorld, parentWorld, targetName });
    }

    this.bindCache.set(armature, map);
    return map;
  }

  /**
   * BVH offsets are local; accumulate to get approximate world positions.
   * This is only for left/right side detection, not for animation playback.
   */
  private static computeBVHWorldPositions(root: any): Map<string, THREE.Vector3> {
    const map = new Map<string, THREE.Vector3>();
    const walk = (joint: any, parentPos: THREE.Vector3) => {
      const pos = parentPos.clone().add(new THREE.Vector3().fromArray(joint.offset));
      map.set(joint.name, pos);
      for (const child of joint.children || []) walk(child, pos);
    };
    walk(root, new THREE.Vector3());
    return map;
  }

  /** Swap Left/Right prefixes when needed */
  private static swapLeftRight(name: string): string {
    if (name.startsWith('Left')) return name.replace(/^Left/, 'Right');
    if (name.startsWith('Right')) return name.replace(/^Right/, 'Left');
    return name;
  }

  /**
   * Load a BVH file and add it to TalkingHead's animation system
   */
  static async loadAndPlayBVH(
    head: any, // TalkingHead instance
    bvhPath: string,
    duration = 10
  ): Promise<void> {
    if (!head || !head.armature) {
      throw new Error('TalkingHead not ready or armature not found');
    }

    console.log('Loading BVH for TalkingHead:', bvhPath);

    // Load and parse BVH
    const response = await fetch(bvhPath);
    const content = await response.text();
    const bvhData = BVHLoader.parse(content);

    // Assign channel offsets
    BVHLoader.assignChannelOffsets(bvhData.skeleton);

    console.log(`BVH loaded: ${bvhData.frames.length} frames, ${bvhData.frameTime}s per frame`);

    // Build bind-pose alignment maps between BVH skeleton and avatar armature
    const bindInfo = this.buildBindAlignment(head.armature, bvhData.skeleton);

    // Create Three.js AnimationClip from BVH data
    const tracks: THREE.KeyframeTrack[] = [];
    const allJoints = BVHLoader.getAllJoints(bvhData.skeleton);

    // Build tracks for each joint
    const missingBones: string[] = [];
    for (const joint of allJoints) {
      // Check if bone exists in armature
      const bone = head.armature.getObjectByName(joint.name);
      if (!bone || !bindInfo.has(joint.name)) {
        missingBones.push(joint.name);
        continue;
      }

      const boneTracks = this.createBoneTracks(joint, bvhData, bindInfo.get(joint.name)!);
      tracks.push(...boneTracks);
    }

    if (missingBones.length > 0) {
      console.warn(`${missingBones.length} bones not found in armature (will skip):`, missingBones);
    }

    console.log(`Created ${tracks.length} animation tracks`);

    if (tracks.length === 0) {
      throw new Error('No animation tracks created - bone names may not match');
    }

    // Create AnimationClip
    const clipDuration = bvhData.frames.length * bvhData.frameTime;
    const clip = new THREE.AnimationClip('BVHAnimation', clipDuration, tracks);

    // Extract pose from first frame
    const pose = this.extractPose(bvhData, allJoints, bindInfo);

    // Add to TalkingHead's animClips
    const animItem = {
      url: bvhPath,
      clip: clip,
      pose: pose
    };

    // Check if already loaded
    const existingIndex = head.animClips.findIndex((x: any) => x.url === bvhPath);
    if (existingIndex >= 0) {
      head.animClips[existingIndex] = animItem;
      console.log('Replaced existing animation');
    } else {
      head.animClips.push(animItem);
      console.log('Added new animation');
    }

    // Now play the animation using TalkingHead's system
    this.playBVHAnimation(head, bvhPath, duration);
  }

  /**
   * Play a BVH animation that's already loaded into TalkingHead
   */
  static playBVHAnimation(head: any, bvhPath: string, duration = 10): void {
    if (!head.armature) {
      throw new Error('Armature not found');
    }

    const item = head.animClips.find((x: any) => x.url === bvhPath);
    if (!item) {
      throw new Error('BVH animation not loaded');
    }

    console.log('Playing BVH animation via TalkingHead');

    // Reset pose update (from TalkingHead's playAnimation)
    const anim = head.animQueue?.find((x: any) => x.template?.name === 'pose');
    if (anim) {
      anim.ts[0] = Infinity;
    }

    // Set new pose
    if (item.pose && item.pose.props) {
      Object.entries(item.pose.props).forEach((x: any) => {
        if (head.poseBase && head.poseBase.props) {
          head.poseBase.props[x[0]] = x[1].clone();
        }
        if (head.poseTarget && head.poseTarget.props) {
          head.poseTarget.props[x[0]] = x[1].clone();
          head.poseTarget.props[x[0]].t = 0;
          head.poseTarget.props[x[0]].d = 1000;
        }
      });
    }

    // Create a new mixer
    if (head.mixer) {
      head.mixer.removeEventListener('finished', head._mixerHandler);
      head.mixer.stopAllAction();
      head.mixer.uncacheRoot(head.armature);
      head.mixer = null;
      head._mixerHandler = null;
    }

    head.mixer = new THREE.AnimationMixer(head.armature);
    head._mixerHandler = () => {
      head.stopAnimation?.();
      head.mixer?.removeEventListener('finished', head._mixerHandler);
    };
    head.mixer.addEventListener('finished', head._mixerHandler);

    // Play action
    const repeat = Math.ceil(duration / item.clip.duration);
    const action = head.mixer.clipAction(item.clip);
    action.setLoop(THREE.LoopRepeat, repeat);
    action.clampWhenFinished = true;
    action.fadeIn(0.5).play();

    console.log(`Animation playing: ${repeat} loops, ${duration}s total`);
  }

  /**
   * Create animation tracks for a bone
   */
  private static createBoneTracks(joint: any, bvhData: any, bind: BoneBindInfo): THREE.KeyframeTrack[] {
    const tracks: THREE.KeyframeTrack[] = [];
    const frameCount = bvhData.frames.length;

    // Time array for all frames
    const times = new Float32Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
      times[i] = i * bvhData.frameTime;
    }

    // Extract position data (if has position channels)
    const hasPosition = joint.channels.some((ch: string) => ch.includes('position'));
    if (hasPosition) {
      const positions = new Float32Array(frameCount * 3);

      const xPosIdx = joint.channels.indexOf('Xposition');
      const yPosIdx = joint.channels.indexOf('Yposition');
      const zPosIdx = joint.channels.indexOf('Zposition');

      for (let i = 0; i < frameCount; i++) {
        const frame = bvhData.frames[i];
        const offset = joint.channelOffset;

        // BVH units are typically in cm, convert to meters (scale by 0.01)
        const scale = 0.01;
        positions[i * 3 + 0] = xPosIdx >= 0 ? frame[offset + xPosIdx] * scale : 0;
        positions[i * 3 + 1] = yPosIdx >= 0 ? frame[offset + yPosIdx] * scale : 0;
        positions[i * 3 + 2] = zPosIdx >= 0 ? frame[offset + zPosIdx] * scale : 0;
      }

      tracks.push(
        new THREE.VectorKeyframeTrack(
          `${bind.targetName}.position`,
          times,
          positions
        )
      );
    }

    // Extract rotation data
    const hasRotation = joint.channels.some((ch: string) => ch.includes('rotation'));
    if (hasRotation) {
      const quaternions = new Float32Array(frameCount * 4);

      const xRotIdx = joint.channels.indexOf('Xrotation');
      const yRotIdx = joint.channels.indexOf('Yrotation');
      const zRotIdx = joint.channels.indexOf('Zrotation');

      const euler = new THREE.Euler();
      const quaternion = new THREE.Quaternion();
      const worldTarget = new THREE.Quaternion();
      const localAvatar = new THREE.Quaternion();
      const invParent = bind.parentWorld.clone().invert();

      for (let i = 0; i < frameCount; i++) {
        const frame = bvhData.frames[i];
        const offset = joint.channelOffset;

        // BVH rotations are in degrees, convert to radians
        const xRot = xRotIdx >= 0 ? THREE.MathUtils.degToRad(frame[offset + xRotIdx]) : 0;
        const yRot = yRotIdx >= 0 ? THREE.MathUtils.degToRad(frame[offset + yRotIdx]) : 0;
        const zRot = zRotIdx >= 0 ? THREE.MathUtils.degToRad(frame[offset + zRotIdx]) : 0;

        // BVH typically uses ZXY order
        euler.set(xRot, yRot, zRot, 'ZXY');
        quaternion.setFromEuler(euler);

        // Convert BVH world-aligned rotation into avatar's local joint space
        // 1) Treat BVH rotation as a world orientation for this joint
        // 2) Re-express it in the avatar basis using bind-pose world rotation
        worldTarget.copy(bind.avatarWorld).multiply(quaternion);
        // 3) Convert to local (relative to parent bind world)
        localAvatar.copy(invParent).multiply(worldTarget).normalize();

        quaternions[i * 4 + 0] = localAvatar.x;
        quaternions[i * 4 + 1] = localAvatar.y;
        quaternions[i * 4 + 2] = localAvatar.z;
        quaternions[i * 4 + 3] = localAvatar.w;
      }

      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${bind.targetName}.quaternion`,
          times,
          quaternions
        )
      );
    }

    return tracks;
  }

  /**
   * Extract pose from first frame of BVH
   */
  private static extractPose(bvhData: any, allJoints: any[], bindInfo: Map<string, BoneBindInfo>): any {
    const props: Record<string, any> = {};

    if (bvhData.frames.length === 0) return { props };

    const firstFrame = bvhData.frames[0];

    for (const joint of allJoints) {
      const offset = joint.channelOffset;

      // Position
      const xPosIdx = joint.channels.indexOf('Xposition');
      const yPosIdx = joint.channels.indexOf('Yposition');
      const zPosIdx = joint.channels.indexOf('Zposition');

      if (xPosIdx >= 0 && yPosIdx >= 0 && zPosIdx >= 0) {
        const scale = 0.01; // cm to m
        const x = firstFrame[offset + xPosIdx] * scale;
        const y = firstFrame[offset + yPosIdx] * scale;
        const z = firstFrame[offset + zPosIdx] * scale;

        props[`${joint.name}.position`] = new THREE.Vector3(x, y, z);
      }

      // Rotation (converted to avatar local space using bind alignment)
      const xRotIdx = joint.channels.indexOf('Xrotation');
      const yRotIdx = joint.channels.indexOf('Yrotation');
      const zRotIdx = joint.channels.indexOf('Zrotation');

      if (xRotIdx >= 0 && yRotIdx >= 0 && zRotIdx >= 0 && bindInfo.has(joint.name)) {
        const xRot = THREE.MathUtils.degToRad(firstFrame[offset + xRotIdx]);
        const yRot = THREE.MathUtils.degToRad(firstFrame[offset + yRotIdx]);
        const zRot = THREE.MathUtils.degToRad(firstFrame[offset + zRotIdx]);

        const euler = new THREE.Euler(xRot, yRot, zRot, 'ZXY');
        const bvhWorld = new THREE.Quaternion().setFromEuler(euler);

        const bind = bindInfo.get(joint.name)!;
        const worldTarget = bind.avatarWorld.clone().multiply(bvhWorld);
        const localAvatar = bind.parentWorld.clone().invert().multiply(worldTarget).normalize();

        props[`${bind.targetName}.quaternion`] = localAvatar;
      }
    }

    // Check pose type
    const pose: any = { props };
    if (props['Hips.position'] && props['Hips.position'].y < 0.5) {
      pose.lying = true;
    } else {
      pose.standing = true;
    }

    return pose;
  }

  /**
   * Stop current animation
   */
  static stopAnimation(head: any): void {
    if (head.mixer) {
      head.mixer.removeEventListener('finished', head._mixerHandler);
      head.mixer.stopAllAction();
      head.mixer = null;
      head._mixerHandler = null;
    }
  }
}
