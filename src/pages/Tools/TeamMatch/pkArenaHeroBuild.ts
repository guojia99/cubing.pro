import type { PkArenaHeroDetail } from '@/pages/Tools/TeamMatch/components/PkArenaHeroSlideOver';
import { formatPkLineForPlayer } from '@/pages/Tools/TeamMatch/pkSettlement';
import type { PkPlayerResult, Team } from '@/pages/Tools/TeamMatch/types';

export type PkArenaHeroPlayerInput = {
  id: string;
  name: string;
  avatarDataUrl: string | null;
  schoolName: string;
  scoresLine: string;
  playerBattlecry: string;
  wcaId: string | null;
};

export function buildPkArenaHeroDetail(
  p: PkArenaHeroPlayerInput,
  team: Team,
  currentResults: PkPlayerResult[],
): PkArenaHeroDetail {
  return {
    name: p.name,
    avatarDataUrl: p.avatarDataUrl,
    schoolName: p.schoolName,
    teamName: team.name,
    seedScoresLine: p.scoresLine,
    pkResultLine: formatPkLineForPlayer(currentResults, p.id),
    playerBattlecry: p.playerBattlecry,
    teamBattlecry: (team.battlecry ?? '').trim(),
    wcaId: p.wcaId,
  };
}
