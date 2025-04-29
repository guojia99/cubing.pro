import { Player } from '@/pages/Tools/TeamMatch/types';
import { UserOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import React from 'react';

import "./step3_match_modal.css"

interface BattleModalProps {
  teamA: Player | null;
  teamB: Player | null;
  onPlayerClick: (round: number, match: number, playerIndex: 0 | 1) => void;
  setIsModalOpen: (open: boolean) => void;
  isModalOpen: boolean;

  round: number;
  match: number;
}

const PlayerCard: React.FC<{ name: string }> = ({ name }) => {
  return (
    <div className="player-card">
      <div className="player-avatar">
        <UserOutlined className="avatar-icon" />
      </div>
      <div className="player-info">
        <div className="player-name">{name}</div>
      </div>
    </div>
  );
};

const BattleModal: React.FC<BattleModalProps> = ({
  teamA,
  teamB,
  onPlayerClick,
  setIsModalOpen,
  isModalOpen,
  round,
  match,
}) => {
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const teamAWin = () => {
    onPlayerClick(round, match, 0)
    setIsModalOpen(false);
  }
  const teamBWin = () => {
    onPlayerClick(round, match, 1)
    setIsModalOpen(false);
  }


  let roundName = ""
  if (round === 1){
    roundName = "初赛"
  } else if (round === 2){
    roundName = "八强赛"
  } else if (round === 3){
    roundName = "半决赛"
  } else if (round === 4){
    roundName = "决赛"
  } else if (round === 5){
    roundName = "季军赛"
  }


  return (
    <>
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        className="battle-modal"
        width="100%"
        style={{ top: 0, padding: 0, height: '100vh' }}
        bodyStyle={{ height: '100vh', padding: 0 }}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        destroyOnClose
      >
        <div className="battle-container">
          <div className="battle-header">
            <div className="vs-container">
              {teamA && <div className="team-name team-a-name">{teamA.name}</div>}
              {!teamA && <div className="team-name team-a-name">X</div>}
              <div className="vs-text">VS</div>
              {teamB && <div className="team-name team-b-name">{teamB.name}</div>}
              {!teamB && <div className="team-name team-b-name">X</div>}
            </div>
          </div>

          <div className="battle-content">
            <div className="team team-a">
              {teamA && teamA.man.map((player, index) => (
                <PlayerCard key={`team-a-${index}`} name={player} />
              ))}
            </div>

            <div className="battle-middle">
              <div className="battle-timer">
                <div className="timer-count">{roundName}</div>
              </div>
            </div>

            <div className="team team-b">
              {teamB && teamB.man.map((player, index) => (
                <PlayerCard key={`team-b-${index}`} name={player} />
              ))}
            </div>
          </div>

          <div className="battle-footer">
            <div className="button-container">
              {teamA && (
                <Button className="win-button" onClick={teamAWin}>
                  {teamA.name} 胜利!
                </Button>
              )}
              <Button className="cancel-button" onClick={handleCancel}>
                退出
              </Button>
              {teamB && (
                <Button className="win-button" onClick={teamBWin}>
                  {teamB.name} 胜利!
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BattleModal;
