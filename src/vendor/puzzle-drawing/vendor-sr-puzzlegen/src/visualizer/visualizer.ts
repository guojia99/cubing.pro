import { Geometry } from "./../geometry/geometry";
import { Arrow } from "./../geometry/arrow";
import { getDefaultOptions } from "./options";
import { MASK_COLOR } from "./../puzzles/colors";
import { VisualizerType } from "./enum";
import { PuzzleGeometry } from "./../puzzles/puzzleGeometry";
import {
  PuzzleOptions,
  ColorScheme,
  ArrowDefinition,
  validatePuzzleOptions,
} from "./interface";
import { Renderer } from "./../rendering/renderer";
import { Scene } from "../rendering/scene";
import { Camera } from "./../rendering/camera";
import { Simulator, SimulatorValues } from "../simulator/simulator";
import { IColor } from "../geometry/color";
import { applyTransformations } from "../rendering/utils";
import { Group } from "../geometry/group";
import { getPuzzleGeometry, getPuzzleSimulator } from "./puzzleCreator";
import { Vector3 } from "../math/vector";
import { Matrix4 } from "../math/matrix";
import { Quaternion } from "../math/quaternion";

/**
 * Applies a color scheme to simulator values
 *
 * @param faceValues face values from the simulator
 * @param scheme color scheme to
 */
function applyColorScheme(
  faceValues: SimulatorValues,
  scheme: ColorScheme
): { [face: string]: IColor[] } {
  return Object.keys(faceValues).reduce((colors: { [face: string]: IColor[] }, face) => {
    colors[face] = faceValues[face].map((value) => scheme[value] || MASK_COLOR);
    return colors;
  }, {});
}

function createArrow(
  a: ArrowDefinition,
  puzzle: PuzzleGeometry,
  group: Group
): Arrow {
  // Get the face the arrow is pointing to
  let startFace = puzzle.faces[a.start.face];
  let endFace = puzzle.faces[a.end.face];

  if (!startFace || !endFace) {
    throw new Error(`Invalid arrow definition ${JSON.stringify(a)}`);
  }

  // Transform from sticker coordinates to group coordinates
  let startTransformations = [
    startFace.matrix,
    puzzle.group.matrix,
    group.matrix,
  ];
  let endTransformations = [endFace.matrix, puzzle.group.matrix, group.matrix];

  let start: Vector3;
  let end: Vector3;

  // Get the stickers on the face
  if (startFace instanceof Geometry && endFace instanceof Geometry) {
    start = startFace.faces[a.start.sticker]?.centroid;
    end = endFace.faces[a.end.sticker]?.centroid;
  } else {
    start = (startFace as Group).objects[a.start.sticker]?.centroid;
    end = (endFace as Group).objects[a.end.sticker]?.centroid;
    startTransformations.unshift(
      (startFace as Group).objects[a.start.sticker]?.matrix
    );
    endTransformations.unshift(
      (endFace as Group).objects[a.end.sticker]?.matrix
    );
  }

  if (!start || !end) {
    throw new Error(`Invalid arrow definition ${JSON.stringify(a)}`);
  }

  let p1 = applyTransformations(start, startTransformations);
  let p2 = applyTransformations(end, endTransformations);

  return new Arrow(p1, p2);
}

/**
 * Encapsulates logic for setting up a puzzle environment for rendering
 * images. Sets up puzzle geometry, applies any algorithm or masking
 * if necessary, and renders the puzzle
 */
export class Visualizer {
  protected camera: Camera;
  protected scene: Scene;
  protected renderer: Renderer;
  protected type: VisualizerType;
  protected options!: PuzzleOptions;

  public group: Group;
  public puzzleGeometry: PuzzleGeometry;
  public simulator: Simulator;

  constructor(
    renderer: Renderer,
    type: VisualizerType,
    options: PuzzleOptions = {},
    cameraDist?: number
  ) {
    this.type = type;
    this.camera = new Camera(cameraDist);
    this.scene = new Scene();
    this.group = new Group();
    this.scene.add(this.group);
    this.renderer = renderer;

    this.initPuzzleOptions(options);
    this.puzzleGeometry = getPuzzleGeometry(this.type, this.options);
    this.simulator = getPuzzleSimulator(this.type, this.options);
    this.buildGroupMatrix();
    this.applyColors();
    this.addArrows();

    this.group.addObject(this.puzzleGeometry.group);

    this.render();
  }

  private applyColors() {
    if (this.options.stickerColors) {
      this.puzzleGeometry.setColors(this.options.stickerColors!);
    } else {
      this.applySimulatorColors();
    }
  }

  private applySimulatorColors() {
    if (this.options.mask) this.applyMask(this.options);
    if (this.options.alg || this.options.case) this.applyAlgorithm();

    const faceValues = this.simulator.getValues();
    const faceColors = applyColorScheme(faceValues, this.options.scheme!);

    this.puzzleGeometry.setColors(faceColors);
  }

  private applyAlgorithm() {
    if (this.options.case) {
      this.simulator.case(this.options.case);
    } else if (this.options.alg) {
      this.simulator.alg(this.options.alg);
    }
  }

  private applyMask(options: PuzzleOptions) {
    const mask = options.mask!;
    Object.keys(mask).forEach((maskedFace) => {
      mask[maskedFace].forEach((index) =>
        this.simulator.setValue(maskedFace, index, "mask")
      );
    });
  }

  /**
   * build the group matrix for the puzzle. This sets up the
   * rotation, scale, and translation for the resulting rendered
   * image.
   */
  private buildGroupMatrix() {
    this.group.matrix = new Matrix4();

    // Rotate the group matrix
    if (this.options.rotations) {
      this.options.rotations.forEach((rotation) => {
        const { x = 0, y = 0, z = 0 } = rotation;
        let rotationMatrix = Matrix4.fromQuaternion(
          Quaternion.fromEuler(x, y, z)
        );
        Matrix4.multiply(this.group.matrix, rotationMatrix, this.group.matrix);
      });
    }

    // Scale the group matrix
    if (this.options.scale) {
      let scale = this.options.scale;
      this.group.matrix.scale(scale, scale, scale);
    }

    // Translate the group matrix
    if (this.options.translation) {
      const { x = 0, y = 0, z = 0 } = this.options.translation;
      let translationMatrix = Matrix4.fromTranslation(x, y, z);

      Matrix4.multiply(this.group.matrix, translationMatrix, this.group.matrix);
    }
  }

  private addArrows() {
    if (!this.options.arrows) {
      return;
    }

    this.options.arrows.forEach((arrow) => {
      try {
        this.scene.add(createArrow(arrow, this.puzzleGeometry, this.group));
      } catch (e) {
        console.error(e);
        console.warn(`Invalid arrow ${JSON.stringify(arrow)}`);
      }
    });
  }

  private initPuzzleOptions(options: PuzzleOptions) {
    this.options = { ...getDefaultOptions(this.type), ...options };
    validatePuzzleOptions(this.options);
  }

  private applyOptionsToPuzzle() {
    this.simulator.reset();

    this.buildGroupMatrix();
    this.applyColors();
    this.addArrows();
  }

  setPuzzleOptions(options: PuzzleOptions) {
    this.initPuzzleOptions(options);

    this.applyOptionsToPuzzle();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
