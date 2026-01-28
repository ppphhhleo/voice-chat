#!/usr/bin/env python3
"""
Analyze FBX file skeleton structure using Blender.
Usage: blender --background --python analyze_fbx_skeleton.py -- <fbx_path>
"""
import bpy
import sys
import json

def analyze_skeleton(fbx_path):
    # Clear scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import FBX
    bpy.ops.import_scene.fbx(filepath=fbx_path)

    # Find armature
    armatures = [obj for obj in bpy.data.objects if obj.type == 'ARMATURE']

    if not armatures:
        print("ERROR: No armature found in FBX file")
        return

    armature = armatures[0]

    print(f"\n=== FBX Skeleton Analysis ===")
    print(f"Armature: {armature.name}")
    print(f"Total bones: {len(armature.data.bones)}\n")

    # Build bone hierarchy
    def get_bone_hierarchy(bone, level=0):
        indent = "  " * level
        result = f"{indent}{bone.name}\n"
        for child in bone.children:
            result += get_bone_hierarchy(child, level + 1)
        return result

    # Get root bones (bones without parent)
    root_bones = [bone for bone in armature.data.bones if bone.parent is None]

    print("Bone Hierarchy:")
    print("=" * 50)
    for root in root_bones:
        print(get_bone_hierarchy(root))

    # Export bone list as JSON
    bone_data = []
    for bone in armature.data.bones:
        bone_data.append({
            "name": bone.name,
            "parent": bone.parent.name if bone.parent else None,
            "head": list(bone.head_local),
            "tail": list(bone.tail_local)
        })

    output_path = fbx_path.replace('.fbx', '_skeleton.json')
    with open(output_path, 'w') as f:
        json.dump({
            "armature": armature.name,
            "total_bones": len(armature.data.bones),
            "bones": bone_data
        }, f, indent=2)

    print(f"\nSkeleton data saved to: {output_path}")
    print("\nBone names list:")
    print("=" * 50)
    for bone in sorted([b.name for b in armature.data.bones]):
        print(f"  - {bone}")

if __name__ == '__main__':
    # Get FBX path from command line
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        print("Usage: blender --background --python analyze_fbx_skeleton.py -- <fbx_path>")
        sys.exit(1)

    if len(argv) < 1:
        print("ERROR: FBX file path required")
        sys.exit(1)

    fbx_path = argv[0]
    analyze_skeleton(fbx_path)
