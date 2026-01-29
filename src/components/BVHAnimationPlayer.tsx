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
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-3">BVH Animation Player</h3>

      <div className="space-y-3">
        {/* Load test motion */}
        <div className="flex gap-2">
          <button
            onClick={() => loadAndPlayBVH('/test-motion.bvh', 10)}
            disabled={isLoading || !head}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load BVH (10s)'}
          </button>
          <button
            onClick={() => loadAndPlayBVH('/test-motion.bvh', 30)}
            disabled={isLoading || !head}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load BVH (30s)'}
          </button>
        </div>

        {/* Stop button */}
        {currentAnimation && (
          <button
            onClick={stopAnimation}
            disabled={!head}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Stop Animation
          </button>
        )}

        {/* Status */}
        <div className="text-xs text-gray-400 bg-gray-900 p-2 rounded font-mono">
          {currentAnimation ? (
            <div>
              <div>Animation: {currentAnimation}</div>
              <div>Status: {isPlaying ? '▶ Playing' : '⏹ Stopped'}</div>
              <div className="mt-1 text-yellow-400">{debugInfo}</div>
            </div>
          ) : (
            <div>
              <div>No animation loaded</div>
              {debugInfo && <div className="mt-1 text-yellow-400">{debugInfo}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
