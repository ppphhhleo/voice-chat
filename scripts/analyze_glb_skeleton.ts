#!/usr/bin/env npx tsx
/**
 * Analyze GLB/GLTF skeleton structure using gltf-transform
 * Usage: npx tsx scripts/analyze_glb_skeleton.ts <file_path>
 */

import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

interface BoneInfo {
  name: string;
  parent: string | null;
  children: string[];
}

function buildBoneHierarchy(nodes: any[], nodeIndex: number, level: number = 0): string {
  const node = nodes[nodeIndex];
  if (!node) return '';

  const indent = '  '.repeat(level);
  let result = `${indent}${node.name || `Node_${nodeIndex}`}\n`;

  if (node.children && node.children.length > 0) {
    for (const childIndex of node.children) {
      result += buildBoneHierarchy(nodes, childIndex, level + 1);
    }
  }

  return result;
}

async function analyzeGLB(filePath: string) {
  console.log(`\n=== Analyzing GLB: ${path.basename(filePath)} ===\n`);

  const io = new NodeIO();
  const document = await io.read(filePath);

  const root = document.getRoot();
  const scenes = root.listScenes();
  const skins = root.listSkins();
  const animations = root.listAnimations();

  console.log(`✓ Scenes: ${scenes.length}`);
  console.log(`✓ Skins: ${skins.length}`);
  console.log(`✓ Animations: ${animations.length}\n`);

  if (skins.length === 0) {
    console.log('⚠️  No skins/armatures found in GLB file');
    return null;
  }

  // Analyze first skin (avatar skeleton)
  const skin = skins[0];
  const joints = skin.listJoints();

  console.log(`Skeleton: ${skin.getName() || 'Unnamed'}`);
  console.log(`Total Bones: ${joints.length}\n`);

  // Build bone hierarchy
  console.log('Bone Hierarchy:');
  console.log('='.repeat(60));

  const boneInfos: BoneInfo[] = [];
  const boneMap = new Map<any, number>();

  joints.forEach((joint, idx) => {
    boneMap.set(joint, idx);
  });

  // Build parent-child relationships
  const jointParentMap = new Map<any, any>();
  const jointChildrenMap = new Map<any, any[]>();

  joints.forEach(joint => {
    jointChildrenMap.set(joint, []);
  });

  // Build relationships by checking each joint's children
  joints.forEach(joint => {
    const allChildren = joint.listChildren();
    allChildren.forEach((child: any) => {
      if (joints.includes(child)) {
        jointParentMap.set(child, joint);
        const childList = jointChildrenMap.get(joint) || [];
        childList.push(child);
        jointChildrenMap.set(joint, childList);
      }
    });
  });

  // Build hierarchy from root joint
  function printJointHierarchy(joint: any, level: number = 0): void {
    const indent = '  '.repeat(level);
    console.log(`${indent}${joint.getName() || 'Unnamed'}`);

    const children = jointChildrenMap.get(joint) || [];
    children.forEach((child: any) => printJointHierarchy(child, level + 1));
  }

  // Find actual root joints (joints without parent in the joint list)
  const rootJoints = joints.filter(joint => !jointParentMap.has(joint));

  rootJoints.forEach(root => printJointHierarchy(root));

  // Collect bone info
  joints.forEach(joint => {
    const parent = jointParentMap.get(joint);
    const parentName = parent ? parent.getName() : null;
    const children = (jointChildrenMap.get(joint) || []).map((child: any) => child.getName());

    boneInfos.push({
      name: joint.getName() || 'Unnamed',
      parent: parentName,
      children
    });
  });

  // Animation info
  if (animations.length > 0) {
    console.log(`\nAnimations:`);
    console.log('='.repeat(60));
    animations.forEach((anim, idx) => {
      const channels = anim.listChannels();
      const samplers = anim.listSamplers();
      console.log(`  ${idx + 1}. ${anim.getName() || 'Unnamed'}`);
      console.log(`     Duration: ~${Math.max(...samplers.map(s => s.getInput()?.getMax()?.[0] || 0)).toFixed(2)}s`);
      console.log(`     Channels: ${channels.length}`);
    });
  }

  // Save to JSON
  const outputPath = filePath.replace(/\.[^.]+$/, '_skeleton.json');
  const data = {
    file: path.basename(filePath),
    skeletonName: skin.getName() || 'Unnamed',
    totalBones: joints.length,
    rootBones: rootJoints.map(j => j.getName()),
    animations: animations.map(anim => ({
      name: anim.getName() || 'Unnamed',
      channels: anim.listChannels().length,
      samplers: anim.listSamplers().length
    })),
    bones: boneInfos
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n✓ Skeleton data saved to: ${path.basename(outputPath)}`);

  // Print bone names for easy reference
  console.log('\nBone Names (sorted):');
  console.log('='.repeat(60));
  const sortedNames = boneInfos.map(b => b.name).sort();
  sortedNames.forEach(name => console.log(`  - ${name}`));

  return data;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/analyze_glb_skeleton.ts <glb_file_path>');
    process.exit(1);
  }

  let filePath = args[0];

  // Convert to absolute path if relative
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(process.cwd(), filePath);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    await analyzeGLB(filePath);
    console.log('\n✓ Analysis complete!\n');
  } catch (error) {
    console.error('Error analyzing file:', error);
    process.exit(1);
  }
}

main();
