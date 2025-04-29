// Match box component
import { Player } from '@/pages/Tools/TeamMatch/types';
import { TrophyFilled } from '@ant-design/icons';
import {useState} from "react";
import BattleModal from "@/pages/Tools/TeamMatch/step3_match_modal";

const getPlayerMedalIcon = (medal: 'gold' | 'silver' | 'bronze' | null) => {
  if (!medal) return null;

  const colorMap = {
    gold: '#FFD700', // 金色
    silver: '#C0C0C0', // 银色
    bronze: '#CD7F32', // 铜色
  };

  return <TrophyFilled style={{ color: colorMap[medal], fontSize: '24px' }} />;
};

function MatchBox({
  round,
  match,
  players,
  winner,
  onPlayerClick,
  getPlayerMedal,
  isClickable = true,
  isFinal = false,
  isThirdPlace = false,
}: {
  round: number;
  match: number;
  players: [Player | null, Player | null];
  winner: Player | null;
  onPlayerClick: (round: number, match: number, playerIndex: 0 | 1) => void;
  getPlayerMedal: (player: Player | null) => 'gold' | 'silver' | 'bronze' | null;
  isClickable?: boolean;
  isFinal?: boolean;
  isThirdPlace?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const matchClasses = `match-box ${isFinal ? 'match-final' : ''} ${
    isThirdPlace ? 'match-third-place' : ''
  } ${!isClickable ? 'match-disabled' : ''}`;

  // todo 两个都是null的情况下， 则不显示

  const openModal = () => {
    if (!isClickable){
      return;
    }
    setIsModalOpen(true);
  }

  if (!players.some((p) => p)) {
    return (
      <div className={matchClasses}>
        <>比赛空缺 | 未开始</>
      </div>
    );
  }

  return (
    <>
    <BattleModal
      teamA={players[0]}
      teamB={players[1]}
      onPlayerClick={onPlayerClick}
      setIsModalOpen={setIsModalOpen}
      isModalOpen={isModalOpen}
      round={round}
      match={match}
    />

      <div className={matchClasses}>
        {players.map((player, idx) => {
          const medal = getPlayerMedal(player);
          const isBye = round === 1 && player && !players[idx === 0 ? 1 : 0];

          const playerClasses = `player-slot ${idx === 0 ? 'player-top' : 'player-bottom'} ${
            winner?.id === player?.id ? 'player-winner' : ''
          } ${!player ? 'player-empty' : ''} ${isBye ? 'player-bye' : ''} ${
            !isClickable ? 'player-disabled' : ''
          }`;

          const seedClass = player?.seeded ? 'seedFont' : '';

          return (
            <div
              key={idx}
              onClick={() => openModal()}
              className={playerClasses}
            >
              <div className={'player-info-match'}>
                {player?.seed && <span className="player-seed">{player.seed}</span>}
                {!player?.name && <span>无选手</span>}
                {player?.name && (
                  <span className={'player-name-match-box ' + seedClass}>
                  {/*{player?.groupName && <span className="player-name-group">{player?.groupName}<br/></span>}*/}
                    {player?.name}
                </span>
                )}
              </div>
              <div className={'player-status'}>
                {medal && getPlayerMedalIcon(medal)}
                {winner?.id === player?.id && <span className="winner-check">✓</span>}
                {isBye && (<><br/><span className="bye-label">轮空</span></>)}
              </div>
            </div>
          );
        })}
      </div>

    </>
  );
}

export default MatchBox;
