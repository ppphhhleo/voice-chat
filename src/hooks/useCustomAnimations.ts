/**
 * POC: Custom Animation Player for TalkingHead Avatar
 *
 * This hook demonstrates loading and playing custom GLTF animations
 * on the TalkingHead avatar without breaking existing functionality.
 */

import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { TalkingHead } from '@met4citizen/talkinghead';

export interface CustomAnimation {
  id: string;
  name: string;
  path: string;
  loop: boolean;
  duration?: number;
}

export function useCustomAnimations(head: TalkingHead | null) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationFrameRef = useRef<number>();
  const loadedClipsRef = useRef<Map<string, THREE.AnimationClip>>(new Map());

  // Initialize mixer when head is ready
  useEffect(() => {
    if (!head) return;

    try {
      // Access the avatar from TalkingHead
      // TalkingHead internally uses Three.js with a SkinnedMesh avatar
      const avatar = (head as any).avatar;

      if (!avatar) {
        console.warn('Could not access TalkingHead avatar');
        return;
      }

      console.log('✓ Avatar accessed:', avatar);
      console.log('  Type:', avatar.type);
      console.log('  Has skeleton:', !!avatar.skeleton);

      // Create custom AnimationMixer for body animations
      mixerRef.current = new THREE.AnimationMixer(avatar);
      console.log('✓ Custom AnimationMixer created');

      // Start animation loop
      const animate = () => {
        if (mixerRef.current) {
          const delta = clockRef.current.getDelta();
          mixerRef.current.update(delta);
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (mixerRef.current) {
          mixerRef.current.stopAllAction();
        }
      };
    } catch (error) {
      console.error('Failed to initialize custom animations:', error);
    }
  }, [head]);

  /**
   * Load a GLTF animation file
   */
  const loadAnimation = useCallback(async (animation: CustomAnimation): Promise<THREE.AnimationClip | null> => {
    // Check cache first
    if (loadedClipsRef.current.has(animation.id)) {
      console.log(`Using cached animation: ${animation.id}`);
      return loadedClipsRef.current.get(animation.id)!;
    }

    try {
      console.log(`Loading animation: ${animation.name} from ${animation.path}`);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(animation.path);

      if (!gltf.animations || gltf.animations.length === 0) {
        console.error(`No animations found in ${animation.path}`);
        return null;
      }

      const clip = gltf.animations[0];
      console.log('✓ Animation loaded:', {
        name: clip.name,
        duration: clip.duration,
        tracks: clip.tracks.length
      });

      // Cache the clip
      loadedClipsRef.current.set(animation.id, clip);

      return clip;
    } catch (error) {
      console.error(`Failed to load animation ${animation.name}:`, error);
      return null;
    }
  }, []);

  /**
   * Play a custom animation
   */
  const playAnimation = useCallback(async (animation: CustomAnimation) => {
    if (!mixerRef.current) {
      console.warn('AnimationMixer not initialized');
      return false;
    }

    try {
      // Load the animation
      const clip = await loadAnimation(animation);
      if (!clip) return false;

      // Stop current animation with fade out
      if (currentActionRef.current) {
        console.log('Fading out current animation');
        currentActionRef.current.fadeOut(0.5);
      }

      // Create new action
      const action = mixerRef.current.clipAction(clip);

      // Configure action
      action.setLoop(animation.loop ? THREE.LoopRepeat : THREE.LoopOnce, animation.loop ? Infinity : 1);
      action.clampWhenFinished = !animation.loop;
      action.setEffectiveWeight(1.0);

      // Fade in and play
      action.reset();
      action.fadeIn(0.5);
      action.play();

      currentActionRef.current = action;

      console.log('✓ Animation playing:', animation.name, {
        loop: animation.loop,
        duration: clip.duration
      });

      // Auto-stop non-looping animations
      if (!animation.loop) {
        const duration = (animation.duration || clip.duration) * 1000;
        setTimeout(() => {
          console.log('Animation complete:', animation.name);
          stopAnimation();
        }, duration);
      }

      return true;
    } catch (error) {
      console.error('Failed to play animation:', error);
      return false;
    }
  }, [loadAnimation]);

  /**
   * Stop current animation
   */
  const stopAnimation = useCallback((fadeOutDuration = 0.5) => {
    if (currentActionRef.current) {
      console.log('Stopping animation');
      currentActionRef.current.fadeOut(fadeOutDuration);
      currentActionRef.current = null;
    }
  }, []);

  /**
   * Check if system is ready
   */
  const isReady = useCallback(() => {
    return mixerRef.current !== null;
  }, []);

  /**
   * Get info about loaded animations
   */
  const getLoadedAnimations = useCallback(() => {
    return Array.from(loadedClipsRef.current.entries()).map(([id, clip]) => ({
      id,
      name: clip.name,
      duration: clip.duration,
      tracks: clip.tracks.length
    }));
  }, []);

  return {
    playAnimation,
    stopAnimation,
    isReady,
    getLoadedAnimations,
    isPlaying: currentActionRef.current !== null
  };
}
