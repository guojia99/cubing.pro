import type { TwistyPlayer } from 'cubing/twisty';
import { TWISTY_FACE_ORDER, type TwistyStickerFaceColorScheme } from './twistyStickerColorScheme';

/**
 * cubing.js 的 TwistyPlayerConfig.colorScheme 仅为 light/dark，不支持每面 HEX。
 * 三阶 3D 使用 Cube3D，贴纸色在创建后可通过 experimentalCurrentThreeJSPuzzleObject
 * 拿到 Cube3D 实例上的 kpuzzleFaceletInfo 更新 MeshBasicMaterial.color。
 * 2D / 非 Cube3D 路径可能无此结构，会静默跳过。
 */
interface Cube3DLike {
  kpuzzleFaceletInfo?: Record<string, unknown[][]>;
  scheduleRenderCallback?: () => void;
}

function applyOnce(puzzle: Cube3DLike, scheme: TwistyStickerFaceColorScheme): boolean {
  const k = puzzle.kpuzzleFaceletInfo;
  if (!k) return false;

  type Fi = {
    faceIdx: number;
    facelet?: { material?: { color?: { set: (v: string) => void } } };
    hintFacelet?: { material?: { color?: { set: (v: string) => void } } };
  };

  for (const orbit of Object.values(k)) {
    const pieces = orbit as Fi[][];
    for (const piece of pieces) {
      for (const fi of piece) {
        const key = TWISTY_FACE_ORDER[fi.faceIdx];
        if (!key) continue;
        const hex = scheme[key];
        if (!hex) continue;
        fi.facelet?.material?.color?.set(hex);
        fi.hintFacelet?.material?.color?.set(hex);
      }
    }
  }

  puzzle.scheduleRenderCallback?.();
  return true;
}

export async function applyTwistyFaceColorScheme(
  player: TwistyPlayer,
  scheme: TwistyStickerFaceColorScheme,
): Promise<void> {
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      const puzzle: unknown = await player.experimentalCurrentThreeJSPuzzleObject?.();
      if (puzzle && typeof puzzle === 'object' && applyOnce(puzzle as Cube3DLike, scheme)) {
        return;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 40 + attempt * 25);
      });
    }
  } catch {
    // 忽略：部分可视化无 Cube3D
  }
}
