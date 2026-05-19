import { TWISTY_FACE_ORDER } from './twistyStickerColorScheme';
function applyOnce(puzzle, scheme) {
    const k = puzzle.kpuzzleFaceletInfo;
    if (!k)
        return false;
    for (const orbit of Object.values(k)) {
        const pieces = orbit;
        for (const piece of pieces) {
            for (const fi of piece) {
                const key = TWISTY_FACE_ORDER[fi.faceIdx];
                if (!key)
                    continue;
                const hex = scheme[key];
                if (!hex)
                    continue;
                fi.facelet?.material?.color?.set(hex);
                fi.hintFacelet?.material?.color?.set(hex);
            }
        }
    }
    puzzle.scheduleRenderCallback?.();
    return true;
}
export async function applyTwistyFaceColorScheme(player, scheme) {
    try {
        for (let attempt = 0; attempt < 8; attempt++) {
            const puzzle = await player.experimentalCurrentThreeJSPuzzleObject?.();
            if (puzzle && typeof puzzle === 'object' && applyOnce(puzzle, scheme)) {
                return;
            }
            await new Promise((resolve) => {
                setTimeout(resolve, 40 + attempt * 25);
            });
        }
    }
    catch {
        // 忽略：部分可视化无 Cube3D
    }
}
//# sourceMappingURL=applyTwistyFaceColorScheme.js.map