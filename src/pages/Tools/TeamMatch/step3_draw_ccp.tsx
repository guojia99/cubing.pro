import MatchBox from '@/pages/Tools/TeamMatch/step3_match_box';
import { Player } from '@/pages/Tools/TeamMatch/types';
import { message } from 'antd';
import React, { useEffect } from 'react';

type Props = {
  seedPairs: number[][];
  // context: Context;
  // setContext: React.Dispatch<React.SetStateAction<Context>>;

  players: (Player | null)[];
  winners: Record<string, Player | null>; // 允许null
  setWinners: React.Dispatch<React.SetStateAction<Record<string, Player | null>>>;
  losers: Record<string, Player>;
  // setWinners: React.Dispatch<React.SetStateAction<Record<string, Player>>>;
  setLosers: React.Dispatch<React.SetStateAction<Record<string, Player>>>;
};

const TournamentBracket: React.FC<Props> = ({
  seedPairs,
  players,
  winners,
  losers,
  setWinners,
  setLosers,
}) => {
  // todo 重新写个随机生成算法
  // Get player by seed
  const getPlayerBySeed = (seed: number) => {
    return players.find((p) => p?.seed === seed) || null;
  };

  // Get winner of a match
  const getWinner = (round: number, match: number) => {
    const matchId = `r${round}-m${match}`;
    return winners[matchId] || null;
  };

  // Get loser of a match
  const getLoser = (round: number, match: number) => {
    const matchId = `r${round}-m${match}`;
    return losers[matchId] || null;
  };

  // Set winner of a match
  const setWinner = (
    round: number,
    match: number,
    player: Player | null, // 允许null
    loser: Player | null
  ) => {
    const matchId = `r${round}-m${match}`;
    setWinners((prev) => ({ ...prev, [matchId]: player }));
    if (loser) {
      setLosers((prev) => ({ ...prev, [matchId]: loser }));
    }
  };


  // Get players for a match
  const getMatchPlayers = (round: number, match: number): [Player | null, Player | null] => {
    if (round === 1) {
      // First round - use seeding pairs
      const pair = seedPairs[match - 1];
      return [getPlayerBySeed(pair[0]), getPlayerBySeed(pair[1])];
    } else if (round === 5) {
      // Third place match - use semifinal losers
      return [getLoser(3, 1), getLoser(3, 2)];
    } else {
      // Later rounds - use winners from previous round
      const prevRound = round - 1;
      const prevMatchBase = (match - 1) * 2;

      return [getWinner(prevRound, prevMatchBase + 1), getWinner(prevRound, prevMatchBase + 2)];
    }
  };

  // Check if a round is complete (all matches have winners)
  const isRoundComplete = (round: number): boolean => {
    if (round === 1) {
      for (let match = 1; match <= 8; match++) {
        const players = getMatchPlayers(1, match);
        const winner = getWinner(1, match);

        // 双方为空时视为完成
        if (!players[0] && !players[1]) continue;
        if (!winner) return false;
      }
      return true;
    }
    if (round === 2) {
      // Check all 4 matches in round 2
      for (let match = 1; match <= 4; match++) {
        if (!getWinner(round, match)) {
          return false;
        }
      }
      return true;
    }
    if (round === 3) {
      // Check both semifinal matches
      return !!getWinner(round, 1) && !!getWinner(round, 2);
    }
    if (round === 4) {
      // Check the final match
      return !!getWinner(round, 1);
    }
    if (round === 5) {
      // Check the third-place match
      return !!getWinner(round, 1);
    }
    return false;
  };

  // Check if a match is clickable (previous rounds must be complete)
  const isMatchClickable = (round: number): boolean => {
    if (round === 1) return true;

    // Special case for the final match (round 4)
    if (round === 4) {
      // Final match requires all previous rounds AND the third-place match to be complete
      return isRoundComplete(1) && isRoundComplete(2) && isRoundComplete(3) && isRoundComplete(5);
    }

    // Special case for the third-place match (round 5)
    if (round === 5) {
      // Third-place match only requires semifinals to be complete
      return isRoundComplete(1) && isRoundComplete(2) && isRoundComplete(3);
    }

    // For other rounds, check if all previous rounds are complete
    for (let r = 1; r < round; r++) {
      if (!isRoundComplete(r)) {
        return false;
      }
    }

    return true;
  };

  // Find the first incomplete round
  const findFirstIncompleteRound = (): number => {
    // Check rounds 1-3 first
    for (let r = 1; r <= 3; r++) {
      if (!isRoundComplete(r)) {
        return r;
      }
    }

    // If rounds 1-3 are complete, check third-place match
    if (!isRoundComplete(5)) {
      return 5; // Third-place match (bronze medal)
    }

    // If third-place match is complete, check final
    if (!isRoundComplete(4)) {
      return 4; // Final match
    }

    return 1;
  };

  // Handle player selection
  const handlePlayerClick = (round: number, match: number, playerIndex: 0 | 1) => {
    const players = getMatchPlayers(round, match);
    const winner = players[playerIndex];
    const loser = players[playerIndex === 0 ? 1 : 0];

    if (!winner) return;

    // Check if this match is clickable
    if (!isMatchClickable(round)) {
      // Show alert
      const incompleteRound = findFirstIncompleteRound();
      if (incompleteRound === 5) {
        message.warning('请先完成季军赛');
      } else {
        message.warning(`请先完成第${incompleteRound}轮的所有比赛！`);
      }

      return;
    }

    setWinner(round, match, winner, loser || null);
  };

  // Check if a player has a medal
  const getPlayerMedal = (player: Player | null) => {
    if (!player) return null;

    const champion = getWinner(4, 1);
    const runnerUp = champion
      ? getMatchPlayers(4, 1)[0]?.id === champion.id
        ? getMatchPlayers(4, 1)[1]
        : getMatchPlayers(4, 1)[0]
      : null;
    const thirdPlace = getWinner(5, 1);

    console.log(player, champion, runnerUp, thirdPlace);

    if (champion?.id === player.id) return 'gold';
    if (runnerUp?.id === player.id) return 'silver';
    if (thirdPlace?.id === player.id) return 'bronze';

    return null;
  };

  // Auto-advance players with byes
  const autoAdvanceByes = () => {
    for (let match = 1; match <= 8; match++) {
      const [player1, player2] = getMatchPlayers(1, match);

      // 处理双方都为null的情况
      if (!player1 && !player2) {
        if (!getWinner(1, match)) {
          setWinner(1, match, null, null);
        }
        continue;
      }

      // 原有轮空逻辑
      if (player1 && !player2 && !getWinner(1, match)) {
        setWinner(1, match, player1, null);
      } else if (!player1 && player2 && !getWinner(1, match)) {
        setWinner(1, match, player2, null);
      }
    }
  };

  // Auto-advance byes on initial render
  useEffect(() => {
    autoAdvanceByes();
  }, [players, seedPairs]);

  return (
    <>
      <div className="tournament-container">
        <div className="tournament-scroll-container">
          <div className="tournament-bracket">
            <table className="bracket-table">
              <thead>
                <tr>
                  <th>16进8</th>
                  <th>四分之一决赛</th>
                  <th>半决赛</th>
                  <th>决赛</th>
                  <th>半决赛</th>
                  <th>四分之一决赛</th>
                  <th>16进8</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {/* Top row - Quadrant 1 and 3 */}
                  <td className="quadrant-cell quadrant-1">
                    <div className="quadrant-label">组别1</div>
                    <div className="matches-container">
                      <MatchBox
                        round={1}
                        match={1}
                        players={getMatchPlayers(1, 1)}
                        winner={getWinner(1, 1)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                      <MatchBox
                        round={1}
                        match={2}
                        players={getMatchPlayers(1, 2)}
                        winner={getWinner(1, 2)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                    </div>
                  </td>
                  <td className="quarterfinals-cell">
                    <div style={{ marginTop: '60px' }}>
                      <MatchBox
                        round={2}
                        match={1}
                        players={getMatchPlayers(2, 1)}
                        winner={getWinner(2, 1)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(2)}
                      />
                    </div>
                  </td>
                  <td rowSpan={2} className="semifinal-cell">
                    <div style={{ marginTop: '205px' }}>
                      <MatchBox
                        round={3}
                        match={1}
                        players={getMatchPlayers(3, 1)}
                        winner={getWinner(3, 1)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(3)}
                      />
                    </div>
                  </td>
                  <td rowSpan={2} className="final-cell">
                    <div style={{ marginTop: '30px' }}>
                      <div className="third-place-container">
                        <div className="third-place-header">季军赛</div>
                        <MatchBox
                          round={5}
                          match={1}
                          players={getMatchPlayers(5, 1)}
                          winner={getWinner(5, 1)}
                          onPlayerClick={handlePlayerClick}
                          getPlayerMedal={getPlayerMedal}
                          isClickable={isMatchClickable(5)}
                          isThirdPlace
                        />
                      </div>

                      <div className="final-container">
                        <div className="final-header">冠军赛</div>
                        <MatchBox
                          round={4}
                          match={1}
                          players={getMatchPlayers(4, 1)}
                          winner={getWinner(4, 1)}
                          onPlayerClick={handlePlayerClick}
                          getPlayerMedal={getPlayerMedal}
                          isClickable={isMatchClickable(4)}
                          isFinal
                        />
                      </div>
                    </div>
                  </td>
                  <td rowSpan={2} className="semifinal-cell">
                    <div style={{ marginTop: '205px' }}>
                      <MatchBox
                        round={3}
                        match={2}
                        players={getMatchPlayers(3, 2)}
                        winner={getWinner(3, 2)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(3)}
                      />
                    </div>
                  </td>
                  <td className="quarterfinals-cell">
                    <div style={{ marginTop: '60px' }}>
                      <MatchBox
                        round={2}
                        match={3}
                        players={getMatchPlayers(2, 3)}
                        winner={getWinner(2, 3)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(2)}
                      />
                    </div>
                  </td>
                  <td className="quadrant-cell quadrant-3">
                    <div className="quadrant-label">组别3</div>
                    <div className="matches-container">
                      <MatchBox
                        round={1}
                        match={5}
                        players={getMatchPlayers(1, 5)}
                        winner={getWinner(1, 5)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                      <MatchBox
                        round={1}
                        match={6}
                        players={getMatchPlayers(1, 6)}
                        winner={getWinner(1, 6)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                    </div>
                  </td>
                </tr>
                <tr className="spacer-row">
                  <td colSpan={7}></td>
                </tr>
                <tr>
                  {/* Bottom row - Quadrant 2 and 4 */}
                  <td className="quadrant-cell quadrant-2">
                    <div className="quadrant-label">组别2</div>
                    <div className="matches-container">
                      <MatchBox
                        round={1}
                        match={3}
                        players={getMatchPlayers(1, 3)}
                        winner={getWinner(1, 3)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                      <MatchBox
                        round={1}
                        match={4}
                        players={getMatchPlayers(1, 4)}
                        winner={getWinner(1, 4)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                    </div>
                  </td>
                  <td className="quarterfinals-cell">
                    <div style={{ marginTop: '60px' }}>
                      <MatchBox
                        round={2}
                        match={2}
                        players={getMatchPlayers(2, 2)}
                        winner={getWinner(2, 2)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(2)}
                      />
                    </div>
                  </td>
                  <td colSpan={3}></td>
                  {/* Empty cells for the middle section */}
                  <td className="quarterfinals-cell">
                    <div style={{ marginTop: '60px' }}>
                      <MatchBox
                        round={2}
                        match={4}
                        players={getMatchPlayers(2, 4)}
                        winner={getWinner(2, 4)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(2)}
                      />
                    </div>
                  </td>
                  <td className="quadrant-cell quadrant-4">
                    <div className="quadrant-label">组别4</div>
                    <div className="matches-container">
                      <MatchBox
                        round={1}
                        match={7}
                        players={getMatchPlayers(1, 7)}
                        winner={getWinner(1, 7)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                      <MatchBox
                        round={1}
                        match={8}
                        players={getMatchPlayers(1, 8)}
                        winner={getWinner(1, 8)}
                        onPlayerClick={handlePlayerClick}
                        getPlayerMedal={getPlayerMedal}
                        isClickable={isMatchClickable(1)}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="tournament-footer">点击决定比赛胜者</div>
      </div>
    </>
  );
};

export default TournamentBracket;
