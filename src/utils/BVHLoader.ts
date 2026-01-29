/**
 * BVH (BioVision Hierarchy) file parser
 * Parses motion capture data into a format suitable for Three.js
 */

export interface BVHJoint {
  name: string;
  parent: BVHJoint | null;
  children: BVHJoint[];
  offset: [number, number, number];
  channels: string[]; // e.g., ["Xposition", "Yposition", "Zposition", "Xrotation", "Yrotation", "Zrotation"]
  channelOffset: number; // Index into frame data array
}

export interface BVHData {
  skeleton: BVHJoint;
  frameTime: number;
  frames: number[][];
  totalChannels: number;
}

export class BVHLoader {
  /**
   * Parse a BVH file content
   */
  static parse(content: string): BVHData {
    const lines = content.split('\n').map(line => line.trim());
    let currentLine = 0;

    // Parse HIERARCHY section
    if (lines[currentLine] !== 'HIERARCHY') {
      throw new Error('Invalid BVH file: missing HIERARCHY');
    }
    currentLine++;

    const { joint: skeleton, endLine } = this.parseJoint(lines, currentLine, null);
    currentLine = endLine;

    // Find MOTION section
    while (currentLine < lines.length && lines[currentLine] !== 'MOTION') {
      currentLine++;
    }

    if (currentLine >= lines.length) {
      throw new Error('Invalid BVH file: missing MOTION section');
    }
    currentLine++; // Skip "MOTION" line

    // Parse motion data
    const framesMatch = lines[currentLine].match(/Frames:\s*(\d+)/);
    if (!framesMatch) {
      throw new Error('Invalid BVH file: missing Frames count');
    }
    const frameCount = parseInt(framesMatch[1]);
    currentLine++;

    const frameTimeMatch = lines[currentLine].match(/Frame Time:\s*([\d.]+)/);
    if (!frameTimeMatch) {
      throw new Error('Invalid BVH file: missing Frame Time');
    }
    const frameTime = parseFloat(frameTimeMatch[1]);
    currentLine++;

    // Count total channels
    const totalChannels = this.countChannels(skeleton);

    // Parse frame data
    const frames: number[][] = [];
    for (let i = 0; i < frameCount && currentLine < lines.length; i++, currentLine++) {
      const line = lines[currentLine];
      if (!line || line === '') continue;

      const values = line.split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (values.length === totalChannels) {
        frames.push(values);
      }
    }

    return {
      skeleton,
      frameTime,
      frames,
      totalChannels
    };
  }

  /**
   * Parse a single joint (recursive)
   */
  private static parseJoint(
    lines: string[],
    startLine: number,
    parent: BVHJoint | null
  ): { joint: BVHJoint, endLine: number } {
    let currentLine = startLine;

    // Parse ROOT or JOINT line
    const jointMatch = lines[currentLine].match(/(ROOT|JOINT)\s+(.+)/);
    if (!jointMatch) {
      throw new Error(`Invalid joint declaration at line ${currentLine}: ${lines[currentLine]}`);
    }

    const jointName = jointMatch[2];
    currentLine++;

    // Expect opening brace
    if (lines[currentLine] !== '{') {
      throw new Error(`Expected '{' at line ${currentLine}`);
    }
    currentLine++;

    // Parse OFFSET
    const offsetMatch = lines[currentLine].match(/OFFSET\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/);
    if (!offsetMatch) {
      throw new Error(`Expected OFFSET at line ${currentLine}`);
    }
    const offset: [number, number, number] = [
      parseFloat(offsetMatch[1]),
      parseFloat(offsetMatch[2]),
      parseFloat(offsetMatch[3])
    ];
    currentLine++;

    // Parse CHANNELS
    let channels: string[] = [];
    let channelOffset = 0;
    if (lines[currentLine].startsWith('CHANNELS')) {
      const channelMatch = lines[currentLine].match(/CHANNELS\s+(\d+)\s+(.+)/);
      if (channelMatch) {
        channels = channelMatch[2].split(/\s+/);
      }
      currentLine++;
    }

    const joint: BVHJoint = {
      name: jointName,
      parent,
      children: [],
      offset,
      channels,
      channelOffset
    };

    // Parse children (JOINTs) or End Site
    while (currentLine < lines.length) {
      const line = lines[currentLine];

      if (line === '}') {
        // End of this joint
        currentLine++;
        break;
      } else if (line.startsWith('JOINT')) {
        // Parse child joint
        const { joint: childJoint, endLine } = this.parseJoint(lines, currentLine, joint);
        joint.children.push(childJoint);
        currentLine = endLine;
      } else if (line.startsWith('End Site')) {
        // Skip end site (leaf node)
        currentLine++; // "End Site"
        currentLine++; // "{"
        currentLine++; // "OFFSET ..."
        currentLine++; // "}"
      } else {
        currentLine++;
      }
    }

    return { joint, endLine: currentLine };
  }

  /**
   * Count total channels in skeleton (for validation)
   */
  private static countChannels(joint: BVHJoint): number {
    let count = joint.channels.length;
    for (const child of joint.children) {
      count += this.countChannels(child);
    }
    return count;
  }

  /**
   * Assign channel offsets to each joint
   */
  static assignChannelOffsets(joint: BVHJoint, offset = 0): number {
    joint.channelOffset = offset;
    let currentOffset = offset + joint.channels.length;

    for (const child of joint.children) {
      currentOffset = this.assignChannelOffsets(child, currentOffset);
    }

    return currentOffset;
  }

  /**
   * Find a joint by name in the skeleton tree
   */
  static findJoint(root: BVHJoint, name: string): BVHJoint | null {
    if (root.name === name) return root;

    for (const child of root.children) {
      const found = this.findJoint(child, name);
      if (found) return found;
    }

    return null;
  }

  /**
   * Get all joints as a flat array
   */
  static getAllJoints(root: BVHJoint): BVHJoint[] {
    const joints: BVHJoint[] = [root];
    for (const child of root.children) {
      joints.push(...this.getAllJoints(child));
    }
    return joints;
  }
}
