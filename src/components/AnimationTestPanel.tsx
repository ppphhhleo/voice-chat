/**
 * POC: Animation Test Panel
 *
 * This component provides a UI to test custom animations on the avatar.
 * It's a proof of concept to verify the system works before full implementation.
 */

'use client';

import { useState } from 'react';
import { useCustomAnimations, type CustomAnimation } from '@/hooks/useCustomAnimations';
import type { TalkingHead } from '@met4citizen/talkinghead';

interface AnimationTestPanelProps {
  head: TalkingHead | null;
}

// Test animations - add your converted animations here
const TEST_ANIMATIONS: CustomAnimation[] = [
  {
    id: 'dance',
    name: 'Dance',
    path: '/motions/dance/dance.gltf',
    loop: true,
    duration: 3.5
  },
  // Add more test animations here
  // {
  //   id: 'wave',
  //   name: 'Wave',
  //   path: '/motions/wave.gltf',
  //   loop: false,
  //   duration: 2.0
  // },
];

export function AnimationTestPanel({ head }: AnimationTestPanelProps) {
  const { playAnimation, stopAnimation, isReady, getLoadedAnimations, isPlaying } =
    useCustomAnimations(head);

  const [selectedAnimation, setSelectedAnimation] = useState<string>('');
  const [status, setStatus] = useState<string>('Waiting for avatar...');
  const [showDebug, setShowDebug] = useState(false);

  const handlePlay = async () => {
    if (!selectedAnimation) {
      setStatus('⚠️ Please select an animation');
      return;
    }

    const animation = TEST_ANIMATIONS.find(a => a.id === selectedAnimation);
    if (!animation) return;

    setStatus(`⏳ Loading ${animation.name}...`);

    const success = await playAnimation(animation);

    if (success) {
      setStatus(`✓ Playing: ${animation.name}`);
    } else {
      setStatus(`❌ Failed to play ${animation.name}`);
    }
  };

  const handleStop = () => {
    stopAnimation();
    setStatus('✓ Animation stopped');
  };

  const handleTest = () => {
    console.log('=== CUSTOM ANIMATION SYSTEM TEST ===');
    console.log('Ready:', isReady());
    console.log('Playing:', isPlaying);
    console.log('Head:', head);
    console.log('Loaded animations:', getLoadedAnimations());
    console.log('=====================================');
    setStatus('✓ Check console for debug info');
  };

  return (
    <div className="card border-2 border-blue-500/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-blue-400">🧪 Animation Test Panel (POC)</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Test custom full-body animations
          </p>
        </div>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs px-2 py-1 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </button>
      </div>

      {/* Status */}
      <div className="mb-3 p-2 rounded bg-[var(--surface-2)] text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isReady() ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-[var(--muted)]">Status:</span>
          <span>{status}</span>
        </div>
      </div>

      {/* Animation Selector */}
      <div className="mb-3">
        <label className="block text-xs text-[var(--muted)] mb-1.5">
          Select Animation:
        </label>
        <select
          value={selectedAnimation}
          onChange={(e) => setSelectedAnimation(e.target.value)}
          className="w-full px-3 py-2 rounded bg-[var(--surface-2)] text-sm border border-[var(--border)]"
        >
          <option value="">-- Choose --</option>
          {TEST_ANIMATIONS.map(anim => (
            <option key={anim.id} value={anim.id}>
              {anim.name} ({anim.loop ? 'loop' : 'once'}, {anim.duration}s)
            </option>
          ))}
        </select>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          disabled={!isReady() || !selectedAnimation}
          className="flex-1 btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▶ Play
        </button>
        <button
          onClick={handleStop}
          disabled={!isPlaying}
          className="flex-1 btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ■ Stop
        </button>
        <button
          onClick={handleTest}
          className="px-3 text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded"
        >
          🔍 Test
        </button>
      </div>

      {/* Debug Info */}
      {showDebug && (
        <div className="mt-3 p-2 rounded bg-[var(--surface-1)] text-xs font-mono">
          <div className="text-[var(--muted)] mb-1">Debug Info:</div>
          <div className="space-y-0.5">
            <div>Ready: {isReady() ? '✓' : '✗'}</div>
            <div>Playing: {isPlaying ? '✓' : '✗'}</div>
            <div>Head: {head ? '✓' : '✗'}</div>
            <div>Loaded: {getLoadedAnimations().length} animations</div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {TEST_ANIMATIONS.length === 1 && (
        <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
          <div className="text-xs text-yellow-400 font-semibold mb-1">
            ⚠️ Setup Required
          </div>
          <div className="text-xs text-[var(--muted)]">
            <ol className="list-decimal list-inside space-y-1">
              <li>Convert dance.fbx to GLTF using online tool</li>
              <li>Save as: public/motions/dance.gltf</li>
              <li>Refresh page and test</li>
            </ol>
            <div className="mt-2">
              <a
                href="https://products.aspose.app/3d/conversion/fbx-to-gltf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                → FBX to GLTF Converter
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
