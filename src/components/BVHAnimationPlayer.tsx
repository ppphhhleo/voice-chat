/**
 * BVH Animation Player Component
 * Integrates BVH animations with TalkingHead's animation system
 */

import React, { useState, useCallback } from 'react';
import { TalkingHeadBVH } from '@/utils/TalkingHeadBVH';

interface BVHAnimationPlayerProps {
  head: any; // TalkingHead instance
  onError?: (error: Error) => void;
}

export function BVHAnimationPlayer({ head, onError }: BVHAnimationPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const loadAndPlayBVH = useCallback(async (bvhPath: string, duration = 10) => {
    if (!head) {
      const error = 'TalkingHead not ready';
      console.error(error);
      setDebugInfo(error);
      onError?.(new Error(error));
      return;
    }

    setIsLoading(true);
    setDebugInfo('Loading BVH...');

    try {
      // Load and play BVH using TalkingHead's animation system
      await TalkingHeadBVH.loadAndPlayBVH(head, bvhPath, duration);

      setCurrentAnimation(bvhPath);
      setIsPlaying(true);
      setDebugInfo(`Playing: ${duration}s`);

      console.log('✓ BVH animation playing via TalkingHead');
    } catch (error) {
      console.error('Failed to load BVH animation:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [head, onError]);

  const stopAnimation = useCallback(() => {
    if (head) {
      TalkingHeadBVH.stopAnimation(head);
      setIsPlaying(false);
      setCurrentAnimation(null);
      setDebugInfo('Stopped');
    }
  }, [head]);

  return (
    <div className="border border-[var(--outline)] rounded-lg p-3 text-sm space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold">BVH</span>
        <span className="text-[var(--muted)] text-xs">
          {currentAnimation ? (isPlaying ? 'playing' : 'loaded') : 'idle'}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => loadAndPlayBVH('/motions/test.bvh', 10)}
          disabled={isLoading || !head}
          className="flex-1 px-3 py-2 rounded bg-[var(--outline)] text-white hover:bg-white/10 disabled:opacity-60 transition-colors"
        >
          {isLoading ? 'Loading…' : 'Load & Play (10s)'}
        </button>
        <button
          onClick={() => loadAndPlayBVH('/motions/test.bvh', 30)}
          disabled={isLoading || !head}
          className="flex-1 px-3 py-2 rounded bg-[var(--outline)] text-white hover:bg-white/10 disabled:opacity-60 transition-colors"
        >
          {isLoading ? 'Loading…' : 'Load & Play (30s)'}
        </button>
        <button
          onClick={stopAnimation}
          disabled={!head || !currentAnimation}
          className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Stop
        </button>
      </div>
      {debugInfo && (
        <div className="text-xs text-[var(--muted)]">{debugInfo}</div>
      )}
    </div>
  );
}
