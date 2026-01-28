#!/usr/bin/env npx tsx
/**
 * Analyze skeleton structure from FBX or GLB/GLTF files
 * Usage: npx tsx scripts/analyze_skeleton.ts <file_path>
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';

interface BoneInfo {
  name: string;
  parent: string | null;
  position: number[];
  children: string[];
}

function analyzeBone(bone: THREE.Bone, parent: string | null = null): BoneInfo {
  return {
    name: bone.name,
    parent: parent,
    position: bone.position.toArray(),
    children: bone.children.filter(child => child instanceof THREE.Bone).map(child => child.name)
  };
}

function buildBoneHierarchy(bone: THREE.Bone, level: number = 0): string {
  const indent = '  '.repeat(level);
  let result = `${indent}${bone.name}\n`;

  for (const child of bone.children) {
    if (child instanceof THREE.Bone) {
      result += buildBoneHierarchy(child, level + 1);
    }
  }

  return result;
}

function findSkeleton(object: THREE.Object3D): THREE.Bone | null {
  if (object instanceof THREE.Bone) {
    // Find root bone (bone without parent bone)
    let current = object;
    while (current.parent && current.parent instanceof THREE.Bone) {
      current = current.parent as THREE.Bone;
    }
    return current;
  }

  for (const child of object.children) {
    const found = findSkeleton(child);
    if (found) return found;
  }

  return null;
}

function collectAllBones(object: THREE.Object3D, bones: THREE.Bone[] = []): THREE.Bone[] {
  if (object instanceof THREE.Bone) {
    bones.push(object);
  }

  for (const child of object.children) {
    collectAllBones(child, bones);
  }

  return bones;
}

async function analyzeFBX(filePath: string) {
  console.log(`\n=== Analyzing FBX: ${path.basename(filePath)} ===\n`);

  const loader = new FBXLoader();
  const fileData = fs.readFileSync(filePath);
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength
  );

  return new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, '', (object) => {
      try {
        // Find skeleton root
        const rootBone = findSkeleton(object);

        if (!rootBone) {
          console.log('⚠️  No skeleton found in FBX file');
          resolve(null);
          return;
        }

        // Collect all bones
        const allBones = collectAllBones(object);

        console.log(`✓ Found skeleton with ${allBones.length} bones`);
        console.log(`✓ Root bone: ${rootBone.name}\n`);

        // Build hierarchy
        console.log('Bone Hierarchy:');
        console.log('='.repeat(60));
        console.log(buildBoneHierarchy(rootBone));

        // Collect bone info
        const boneInfos: BoneInfo[] = allBones.map(bone =>
          analyzeBone(bone, bone.parent instanceof THREE.Bone ? (bone.parent as THREE.Bone).name : null)
        );

        // Check for animations
        const animations = object.animations || [];
        console.log(`\nAnimations: ${animations.length}`);
        if (animations.length > 0) {
          animations.forEach((clip, idx) => {
            console.log(`  ${idx + 1}. ${clip.name || 'Unnamed'} (${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks)`);
          });
        }

        // Save to JSON
        const outputPath = filePath.replace(/\.[^.]+$/, '_skeleton.json');
        const data = {
          file: path.basename(filePath),
          rootBone: rootBone.name,
          totalBones: allBones.length,
          animations: animations.map(clip => ({
            name: clip.name,
            duration: clip.duration,
            tracks: clip.tracks.length
          })),
          bones: boneInfos
        };

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`\n✓ Skeleton data saved to: ${path.basename(outputPath)}`);

        // Print bone names for easy reference
        console.log('\nBone Names (sorted):');
        console.log('='.repeat(60));
        const sortedNames = allBones.map(b => b.name).sort();
        sortedNames.forEach(name => console.log(`  - ${name}`));

        resolve(data);
      } catch (error) {
        reject(error);
      }
    }, undefined, reject);
  });
}

async function analyzeGLTF(filePath: string) {
  console.log(`\n=== Analyzing GLTF/GLB: ${path.basename(filePath)} ===\n`);

  const loader = new GLTFLoader();

  // Convert to file:// URL for Node.js
  const fileUrl = `file://${filePath}`;
  const gltf = await loader.loadAsync(fileUrl);
  const scene = gltf.scene;

  // Find skeleton
  const rootBone = findSkeleton(scene);

  if (!rootBone) {
    console.log('⚠️  No skeleton found in GLTF file');
    return null;
  }

  // Collect all bones
  const allBones = collectAllBones(scene);

  console.log(`✓ Found skeleton with ${allBones.length} bones`);
  console.log(`✓ Root bone: ${rootBone.name}\n`);

  // Build hierarchy
  console.log('Bone Hierarchy:');
  console.log('='.repeat(60));
  console.log(buildBoneHierarchy(rootBone));

  // Collect bone info
  const boneInfos: BoneInfo[] = allBones.map(bone =>
    analyzeBone(bone, bone.parent instanceof THREE.Bone ? (bone.parent as THREE.Bone).name : null)
  );

  // Check for animations
  const animations = gltf.animations || [];
  console.log(`\nAnimations: ${animations.length}`);
  if (animations.length > 0) {
    animations.forEach((clip, idx) => {
      console.log(`  ${idx + 1}. ${clip.name || 'Unnamed'} (${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks)`);
    });
  }

  // Save to JSON
  const outputPath = filePath.replace(/\.[^.]+$/, '_skeleton.json');
  const data = {
    file: path.basename(filePath),
    rootBone: rootBone.name,
    totalBones: allBones.length,
    animations: animations.map(clip => ({
      name: clip.name,
      duration: clip.duration,
      tracks: clip.tracks.length
    })),
    bones: boneInfos
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n✓ Skeleton data saved to: ${path.basename(outputPath)}`);

  // Print bone names for easy reference
  console.log('\nBone Names (sorted):');
  console.log('='.repeat(60));
  const sortedNames = allBones.map(b => b.name).sort();
  sortedNames.forEach(name => console.log(`  - ${name}`));

  return data;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/analyze_skeleton.ts <file_path>');
    console.log('  Supports: .fbx, .gltf, .glb');
    process.exit(1);
  }

  let filePath = args[0];

  // Convert to absolute path if relative
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(process.cwd(), filePath);
  }

  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    if (ext === '.fbx') {
      await analyzeFBX(filePath);
    } else if (ext === '.gltf' || ext === '.glb') {
      await analyzeGLTF(filePath);
    } else {
      console.error(`Error: Unsupported file format: ${ext}`);
      console.log('  Supported formats: .fbx, .gltf, .glb');
      process.exit(1);
    }

    console.log('\n✓ Analysis complete!\n');
  } catch (error) {
    console.error('Error analyzing file:', error);
    process.exit(1);
  }
}

main();
