import * as THREE from 'three';
import { SIZE } from './engine/define';
import PyraCube from './engine/pyra/PyraCube';

export type HeadlessPuzzleKind = 'pyraminx';
export type HeadlessPuzzleCube = PyraCube;

export interface RenderWorld {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  width: number;
  height: number;
}

function buildCube(kind: HeadlessPuzzleKind): HeadlessPuzzleCube {
  switch (kind) {
    case 'pyraminx': return new PyraCube();
    default: throw new Error(`Unsupported headless puzzle: ${kind}`);
  }
}

/** Minimal scene/camera host for server SVG rendering; deliberately has no renderer. */
export class HeadlessWorld implements RenderWorld {
  width = 1;
  height = 1;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(50, 1, 1, SIZE * 32);
  readonly cube: HeadlessPuzzleCube;

  constructor(readonly puzzleKind: HeadlessPuzzleKind) {
    this.scene.matrixAutoUpdate = false;
    this.cube = buildCube(puzzleKind);
    this.scene.add(this.cube);
    this.resize();
  }

  resize(): void {
    const width = Math.max(1, this.width);
    const height = Math.max(1, this.height);
    const perspective = 5;
    const min = height / Math.min(width, height) / perspective;
    this.camera.aspect = width / height;
    this.camera.fov = (2 * Math.atan(min) * 180) / Math.PI;
    const refHalf = SIZE * 4;
    const distance = refHalf * perspective;
    this.camera.position.set(0, 0, distance);
    this.camera.near = Math.max(distance - SIZE * 5, SIZE * 0.4);
    this.camera.far = distance + SIZE * 8;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }
}
